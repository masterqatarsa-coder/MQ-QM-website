<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);
enforce_admin_login_surface_access('admin_login');

$payload = request_json();
$loginId = sanitize_text($payload['loginId'] ?? '');
$password = (string)($payload['password'] ?? '');

if ($loginId === '' || $password === '') {
    json_response(['error' => 'Login ID and password are required.'], 422);
}

enforce_rate_limit(
    'admin_login_ip',
    current_request_fingerprint(),
    12,
    900,
    'Too many login attempts from this client. Please wait before trying again.'
);
enforce_rate_limit(
    'admin_login_user',
    strtolower($loginId),
    8,
    900,
    'Too many login attempts for this account. Please wait before trying again.'
);

$store = read_store();
$admin = find_admin_by_login($store, $loginId);

if ($admin === null || normalize_bool($admin['isActive'] ?? true) !== 1 || !password_verify($password, (string)($admin['passwordHash'] ?? ''))) {
    write_audit_log(
        'auth.login.failed',
        'Failed admin panel login attempt.',
        'warning',
        [
            'loginId' => $loginId,
            'requestFingerprint' => current_request_fingerprint(),
        ],
        $admin
    );
    json_response(['error' => 'Invalid login credentials.'], 401);
}

enforce_admin_ip_access($admin, 'admin_login_role');

clear_rate_limit('admin_login_ip', current_request_fingerprint());
clear_rate_limit('admin_login_user', strtolower($loginId));

$verificationMethod = secondary_factor_method($admin, 'login');

if ($verificationMethod !== 'none') {
    $challenge = create_secondary_factor_challenge('login', (int)$admin['id']);
    json_response([
        'message' => match ($verificationMethod) {
            'email_or_authenticator' => 'Enter either the emailed code or your authenticator code.',
            'authenticator' => 'Authenticator verification required.',
            default => 'Verification code sent.',
        },
        'pendingOtp' => true,
        'authenticated' => false,
        'emailMasked' => $challenge['emailMasked'] ?? null,
        'verificationMethod' => $verificationMethod,
    ]);
}

mark_admin_authenticated((int)$admin['id']);
$index = find_admin_index_by_id($store, (int)$admin['id']);
if ($index !== null) {
    $store['admins'][$index]['lastLoginAt'] = now_utc();
    $store['admins'][$index]['updatedAt'] = now_utc();
    write_store($store);
    $admin = $store['admins'][$index];
}

write_audit_log(
    'auth.login.success',
    'Admin panel login succeeded.',
    'info',
    [],
    $admin
);

json_response([
    'message' => 'Login successful.',
    'pendingOtp' => false,
    'authenticated' => true,
    'admin' => public_admin($admin),
    'verificationMethod' => null,
]);
