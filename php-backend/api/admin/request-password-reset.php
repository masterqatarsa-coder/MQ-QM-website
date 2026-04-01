<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);
enforce_admin_login_surface_access('password_reset_request');

$payload = request_json();
$loginId = sanitize_text($payload['loginId'] ?? '');

if ($loginId === '') {
    json_response(['error' => 'Login ID is required.'], 422);
}

enforce_rate_limit(
    'password_reset_request_ip',
    current_request_fingerprint(),
    6,
    900,
    'Too many password reset requests. Please wait before trying again.'
);
enforce_rate_limit(
    'password_reset_request_login',
    strtolower($loginId),
    4,
    900,
    'Too many password reset requests. Please wait before trying again.'
);

$admin = find_admin_by_login(read_store(), $loginId);

if ($admin !== null && is_primary_admin($admin)) {
    if (!is_admin_ip_allowed($admin)) {
        write_audit_log(
            'auth.password_reset.ip_denied',
            'Password reset requested from an IP address outside the allowed admin policy.',
            'warning',
            ['loginId' => $loginId],
            $admin,
            true
        );
        json_response([
            'message' => 'If the account exists, a password reset code has been sent.',
            'emailMasked' => null,
            'verificationMethod' => 'email',
        ]);
    }

    $challenge = create_secondary_factor_challenge('password_reset', (int)$admin['id']);
    write_audit_log('auth.password_reset.requested', 'Password reset requested.', 'info', [], $admin);
    json_response([
        'message' => 'If the account exists, a password reset code has been sent.',
        'emailMasked' => $challenge['emailMasked'] ?? null,
        'verificationMethod' => ((string)($challenge['method'] ?? 'email') === 'totp')
            ? 'authenticator'
            : (string)($challenge['method'] ?? 'email'),
    ]);
}

if ($admin !== null) {
    write_audit_log(
        'auth.password_reset.denied',
        'Password reset was requested for a non-primary admin account.',
        'warning',
        ['loginId' => $loginId],
        $admin,
        true
    );
}

write_audit_log(
    'auth.password_reset.unknown_login',
    'Password reset requested for an unknown login ID.',
    'warning',
    ['loginId' => $loginId],
    null,
    true
);

json_response([
    'message' => 'If the account exists, a password reset code has been sent.',
    'emailMasked' => null,
    'verificationMethod' => 'email',
]);
