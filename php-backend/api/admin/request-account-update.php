<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);
$admin = require_authenticated_admin();

$payload = request_json();
$loginId = sanitize_text($payload['loginId'] ?? '');
$email = sanitize_text($payload['email'] ?? '');
$phone = sanitize_text($payload['phone'] ?? '');

enforce_rate_limit(
    'account_update_request',
    (string)$admin['id'] . '|' . current_request_fingerprint(),
    6,
    900,
    'Too many account update attempts. Please wait before trying again.'
);

if ($loginId === '' || $email === '') {
    json_response(['error' => 'Login ID and email are required.'], 422);
}

if (!is_valid_email($email)) {
    json_response(['error' => 'A valid email address is required.'], 422);
}

$store = read_store();
foreach ($store['admins'] as $candidate) {
    if ((int)($candidate['id'] ?? 0) === (int)$admin['id']) {
        continue;
    }

    if (strcasecmp((string)($candidate['loginId'] ?? ''), $loginId) === 0) {
        json_response(['error' => 'That login ID is already in use.'], 422);
    }

    if (strcasecmp((string)($candidate['email'] ?? ''), $email) === 0) {
        json_response(['error' => 'That email address is already in use.'], 422);
    }
}

$challenge = create_secondary_factor_challenge('account_update', (int)$admin['id'], [
    'loginId' => $loginId,
    'email' => $email,
    'phone' => $phone,
]);

json_response([
    'message' => match ((string)($challenge['method'] ?? 'email')) {
        'email_or_authenticator' => 'Enter either the emailed code or your authenticator code to finish the account update.',
        'authenticator', 'totp' => 'Authenticator verification required for account update.',
        default => 'Verification code sent for account update.',
    },
    'emailMasked' => $challenge['emailMasked'] ?? null,
    'verificationMethod' => ((string)($challenge['method'] ?? 'email') === 'totp')
        ? 'authenticator'
        : (string)($challenge['method'] ?? 'email'),
]);
