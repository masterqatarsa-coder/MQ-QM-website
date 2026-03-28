<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);
$admin = require_authenticated_admin();

$payload = request_json();
$oldPassword = (string)($payload['oldPassword'] ?? '');
$newPassword = (string)($payload['newPassword'] ?? '');
$confirmPassword = (string)($payload['confirmPassword'] ?? '');

enforce_rate_limit(
    'password_change_request',
    (string)$admin['id'] . '|' . current_request_fingerprint(),
    6,
    900,
    'Too many password change attempts. Please wait before trying again.'
);

if ($oldPassword === '' || $newPassword === '' || $confirmPassword === '') {
    json_response(['error' => 'All password fields are required.'], 422);
}

if ($newPassword !== $confirmPassword) {
    json_response(['error' => 'New password and confirmation do not match.'], 422);
}

$passwordError = password_strength_error($newPassword);
if ($passwordError !== null) {
    json_response(['error' => $passwordError], 422);
}

if (!password_verify($oldPassword, (string)($admin['passwordHash'] ?? ''))) {
    json_response(['error' => 'Current password is incorrect.'], 401);
}

$challenge = create_secondary_factor_challenge('password_change', (int)$admin['id'], [
    'passwordHash' => password_hash($newPassword, PASSWORD_DEFAULT),
]);

json_response([
    'message' => (($challenge['method'] ?? 'email') === 'totp')
        ? 'Authenticator verification required for password change.'
        : 'Verification code sent for password change.',
    'emailMasked' => $challenge['emailMasked'] ?? null,
    'verificationMethod' => (($challenge['method'] ?? 'email') === 'totp') ? 'authenticator' : 'email',
]);
