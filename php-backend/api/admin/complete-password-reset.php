<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);
enforce_admin_login_surface_access('password_reset_complete');

$verification = $_SESSION['password_reset_verified'] ?? null;
if (!is_array($verification) || (int)($verification['expiresAt'] ?? 0) < time()) {
    unset($_SESSION['password_reset_verified']);
    json_response(['error' => 'Password reset session expired. Please start again.'], 422);
}

if (($verification['clientHash'] ?? '') !== current_request_fingerprint()) {
    unset($_SESSION['password_reset_verified']);
    json_response(['error' => 'Password reset session is only valid from the same browser and network. Please start again.'], 422);
}

$payload = request_json();
$newPassword = (string)($payload['newPassword'] ?? '');
$confirmPassword = (string)($payload['confirmPassword'] ?? '');

if ($newPassword === '' || $confirmPassword === '') {
    json_response(['error' => 'New password and confirmation are required.'], 422);
}

if ($newPassword !== $confirmPassword) {
    json_response(['error' => 'New password and confirmation do not match.'], 422);
}

$passwordError = password_strength_error($newPassword);
if ($passwordError !== null) {
    json_response(['error' => $passwordError], 422);
}

$store = read_store();
$index = find_admin_index_by_id($store, (int)$verification['adminId']);

if ($index === null) {
    json_response(['error' => 'Admin account not found.'], 404);
}

$store['admins'][$index]['passwordHash'] = password_hash($newPassword, PASSWORD_DEFAULT);
$store['admins'][$index]['mustChangePassword'] = false;
$store['admins'][$index]['updatedAt'] = now_utc();
write_store($store);
unset($_SESSION['password_reset_verified']);

write_audit_log(
    'auth.password_reset.completed',
    'Password reset completed.',
    'info',
    [],
    $store['admins'][$index]
);

json_response(['message' => 'Password reset successfully.']);
