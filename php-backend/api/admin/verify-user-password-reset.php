<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);
$admin = require_admin_permission('users');

if (!is_primary_admin($admin)) {
    json_response(['error' => 'Only the primary admin can reset other user passwords.'], 403);
}

$payload = request_json();
$otp = sanitize_text((string)($payload['otp'] ?? ''));

if ($otp === '') {
    json_response(['error' => 'OTP is required.'], 422);
}

$challenge = verify_otp_challenge('user_password_reset', $otp);
if ((int)($challenge['adminId'] ?? 0) !== (int)$admin['id']) {
    json_response(['error' => 'This verification does not belong to the current admin session.'], 403);
}

$targetUserId = (int)($challenge['payload']['targetUserId'] ?? 0);
$passwordHash = (string)($challenge['payload']['passwordHash'] ?? '');

if ($targetUserId <= 0 || $passwordHash === '') {
    json_response(['error' => 'Password reset payload is incomplete.'], 422);
}

$store = read_store();
$index = find_admin_index_by_id($store, $targetUserId);
if ($index === null) {
    json_response(['error' => 'User not found.'], 404);
}

$store['admins'][$index]['passwordHash'] = $passwordHash;
$store['admins'][$index]['mustChangePassword'] = false;
$store['admins'][$index]['updatedAt'] = now_utc();
write_store($store);

write_audit_log(
    'admin.user_password_reset',
    'Reset an admin panel user password after OTP verification.',
    'warning',
    ['targetUser' => public_admin($store['admins'][$index])],
    $admin,
    true
);

json_response([
    'message' => 'User password updated.',
    'items' => list_admin_users(read_store()),
]);
