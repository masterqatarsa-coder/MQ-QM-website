<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);
$payload = request_json();
$otp = sanitize_text($payload['otp'] ?? '');

if ($otp === '') {
    json_response(['error' => 'OTP is required.'], 422);
}

$challenge = verify_otp_challenge('account_update', $otp);
$store = read_store();
$index = find_admin_index_by_id($store, (int)$challenge['adminId']);

if ($index === null) {
    json_response(['error' => 'Admin account not found.'], 404);
}

$store['admins'][$index]['loginId'] = (string)($challenge['payload']['loginId'] ?? $store['admins'][$index]['loginId']);
$store['admins'][$index]['email'] = (string)($challenge['payload']['email'] ?? $store['admins'][$index]['email']);
$store['admins'][$index]['phone'] = (string)($challenge['payload']['phone'] ?? $store['admins'][$index]['phone']);
$store['admins'][$index]['updatedAt'] = now_utc();
write_store($store);

write_audit_log(
    'admin.account_updated',
    'Updated own admin account profile.',
    'info',
    [],
    $store['admins'][$index]
);

json_response([
    'message' => 'Account updated successfully.',
    'admin' => public_admin($store['admins'][$index]),
]);
