<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);
$admin = require_admin_permission('users');

if (!is_primary_admin($admin)) {
    json_response(['error' => 'Only the primary admin can reset other user passwords.'], 403);
}

$payload = request_json();
$targetUserId = (int)($payload['id'] ?? 0);
$newPassword = (string)($payload['newPassword'] ?? '');
$confirmPassword = (string)($payload['confirmPassword'] ?? '');
$adminPassword = (string)($payload['adminPassword'] ?? '');

if ($targetUserId <= 0 || $newPassword === '' || $confirmPassword === '' || $adminPassword === '') {
    json_response(['error' => 'Target user, new password, confirmation, and admin password are required.'], 422);
}

if ($targetUserId === (int)$admin['id']) {
    json_response(['error' => 'Use the admin account change-password flow for your own password.'], 422);
}

if ($newPassword !== $confirmPassword) {
    json_response(['error' => 'New password and confirmation do not match.'], 422);
}

$passwordError = password_strength_error($newPassword);
if ($passwordError !== null) {
    json_response(['error' => $passwordError], 422);
}

if (!password_verify($adminPassword, (string)($admin['passwordHash'] ?? ''))) {
    write_audit_log(
        'admin.user_password_reset.denied',
        'User password reset denied because the admin password confirmation failed.',
        'warning',
        ['targetUserId' => $targetUserId],
        $admin,
        true
    );
    json_response(['error' => 'Admin password confirmation failed.'], 401);
}

$targetUser = find_admin_by_id(read_store(), $targetUserId);
if ($targetUser === null) {
    json_response(['error' => 'User not found.'], 404);
}

$challenge = create_secondary_factor_challenge('user_password_reset', (int)$admin['id'], [
    'targetUserId' => $targetUserId,
    'passwordHash' => password_hash($newPassword, PASSWORD_DEFAULT),
]);

json_response([
    'message' => match ((string)($challenge['method'] ?? 'email')) {
        'email_or_authenticator' => 'Enter either the emailed code or your authenticator code before resetting the user password.',
        'authenticator', 'totp' => 'Authenticator verification required before resetting the user password.',
        default => 'Verification code sent to the admin email.',
    },
    'emailMasked' => $challenge['emailMasked'] ?? null,
    'verificationMethod' => ((string)($challenge['method'] ?? 'email') === 'totp')
        ? 'authenticator'
        : (string)($challenge['method'] ?? 'email'),
]);
