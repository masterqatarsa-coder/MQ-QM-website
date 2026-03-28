<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);

$payload = request_json();
$otp = sanitize_text($payload['otp'] ?? '');

if ($otp === '') {
    json_response(['error' => 'OTP is required.'], 422);
}

$challenge = verify_otp_challenge('login', $otp);
$admin = find_admin_by_id(read_store(), (int)$challenge['adminId']);

if ($admin === null) {
    json_response(['error' => 'Admin account not found.'], 404);
}

mark_admin_authenticated((int)$admin['id']);
$store = read_store();
$index = find_admin_index_by_id($store, (int)$admin['id']);

if ($index !== null) {
    $store['admins'][$index]['lastLoginAt'] = now_utc();
    $store['admins'][$index]['updatedAt'] = now_utc();
    write_store($store);
    $admin = $store['admins'][$index];
}

write_audit_log(
    'auth.login.success',
    'Admin panel login verified with OTP.',
    'info',
    ['twoFactor' => true],
    $admin
);

json_response([
    'message' => 'Admin login verified.',
    'admin' => public_admin($admin),
]);
