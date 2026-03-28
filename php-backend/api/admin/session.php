<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET']);
enforce_admin_login_surface_access('admin_session');

$admin = current_admin();
$challenge = current_otp_challenge('login');

if ($admin !== null) {
    json_response([
        'authenticated' => true,
        'pendingOtp' => false,
        'admin' => public_admin($admin),
        'twoFactorEnabled' => normalize_bool($admin['twoFactorEnabled'] ?? true) === 1,
        'verificationMethod' => normalize_bool($admin['authenticatorEnabled'] ?? false) === 1 ? 'authenticator' : 'email',
    ]);
}

if ($challenge !== null) {
    json_response([
        'authenticated' => false,
        'pendingOtp' => true,
        'emailMasked' => $challenge['emailMasked'] ?? null,
        'twoFactorEnabled' => true,
        'verificationMethod' => (string)($challenge['method'] ?? 'email'),
    ]);
}

json_response([
    'authenticated' => false,
    'pendingOtp' => false,
    'twoFactorEnabled' => (bool)(settings_payload()['two_factor_auth_enabled'] ?? false),
    'verificationMethod' => null,
]);
