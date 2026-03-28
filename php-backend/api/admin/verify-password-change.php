<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);
$payload = request_json();
$otp = sanitize_text($payload['otp'] ?? '');

if ($otp === '') {
    json_response(['error' => 'OTP is required.'], 422);
}

$challenge = verify_otp_challenge('password_change', $otp);
$store = read_store();
$index = find_admin_index_by_id($store, (int)$challenge['adminId']);

if ($index === null) {
    json_response(['error' => 'Admin account not found.'], 404);
}

$store['admins'][$index]['passwordHash'] = (string)($challenge['payload']['passwordHash'] ?? $store['admins'][$index]['passwordHash']);
$store['admins'][$index]['mustChangePassword'] = false;
$store['admins'][$index]['updatedAt'] = now_utc();
write_store($store);

write_audit_log(
    'auth.password_changed',
    'Password changed from admin settings.',
    'info',
    [],
    $store['admins'][$index]
);

json_response(['message' => 'Password updated successfully.']);
