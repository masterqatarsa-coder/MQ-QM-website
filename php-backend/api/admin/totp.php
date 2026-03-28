<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET', 'POST']);
$admin = require_admin_permission('settings');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    json_response([
        'enabled' => normalize_bool($admin['authenticatorEnabled'] ?? false) === 1,
        'accountLabel' => totp_account_label($admin),
        'issuer' => settings_payload(false)['site_name'] ?: 'Master Qatar Admin',
        'periodSeconds' => admin_totp_period($admin),
    ]);
}

$payload = request_json();
$action = sanitize_text((string)($payload['action'] ?? ''));

if ($action === 'start') {
    $secret = generate_totp_secret();
    $periodSeconds = normalize_authenticator_period_seconds(settings_payload(false)['authenticator_period_seconds'] ?? 30);
    $_SESSION['totp_setup'] = [
        'adminId' => (int)$admin['id'],
        'secret' => $secret,
        'periodSeconds' => $periodSeconds,
        'clientHash' => current_request_fingerprint(),
        'expiresAt' => time() + 900,
    ];

    json_response([
        'message' => 'Google Authenticator setup started.',
        'secret' => $secret,
        'otpauthUri' => otpauth_uri_for_admin($admin, $secret, $periodSeconds),
        'accountLabel' => totp_account_label($admin),
        'issuer' => settings_payload(false)['site_name'] ?: 'Master Qatar Admin',
        'periodSeconds' => $periodSeconds,
    ]);
}

if ($action === 'enable') {
    $setup = current_totp_setup();
    $code = sanitize_text((string)($payload['code'] ?? ''));

    if ($setup === null || (int)($setup['adminId'] ?? 0) !== (int)$admin['id']) {
        json_response(['error' => 'Authenticator setup session expired. Start again.'], 422);
    }

    if (($setup['clientHash'] ?? '') !== current_request_fingerprint()) {
        unset($_SESSION['totp_setup']);
        json_response(['error' => 'Authenticator setup is only valid from the same browser and network.'], 422);
    }

    $periodSeconds = normalize_authenticator_period_seconds($setup['periodSeconds'] ?? 30);

    if (!verify_totp_secret_code((string)($setup['secret'] ?? ''), $code, 1, $periodSeconds)) {
        json_response(['error' => 'Invalid authenticator code.'], 422);
    }

    $store = read_store();
    $index = find_admin_index_by_id($store, (int)$admin['id']);
    if ($index === null) {
        json_response(['error' => 'Admin account not found.'], 404);
    }

    $store['admins'][$index]['authenticatorEnabled'] = true;
    $store['admins'][$index]['authenticatorSecret'] = encrypt_sensitive_value((string)$setup['secret']);
    $store['admins'][$index]['authenticatorPeriodSeconds'] = $periodSeconds;
    $store['admins'][$index]['updatedAt'] = now_utc();
    write_store($store);
    unset($_SESSION['totp_setup']);

    write_audit_log(
        'security.authenticator.enabled',
        'Enabled Google Authenticator verification.',
        'info',
        [],
        $store['admins'][$index]
    );

    json_response([
        'message' => 'Google Authenticator enabled.',
        'admin' => public_admin($store['admins'][$index]),
    ]);
}

if ($action === 'disable') {
    $code = sanitize_text((string)($payload['code'] ?? ''));
    $secret = admin_totp_secret($admin);

    if ($secret === '') {
        json_response(['error' => 'Google Authenticator is not enabled on this account.'], 422);
    }

    if (!verify_totp_secret_code($secret, $code, 1, admin_totp_period($admin))) {
        json_response(['error' => 'Invalid authenticator code.'], 422);
    }

    $store = read_store();
    $index = find_admin_index_by_id($store, (int)$admin['id']);
    if ($index === null) {
        json_response(['error' => 'Admin account not found.'], 404);
    }

    $store['admins'][$index]['authenticatorEnabled'] = false;
    $store['admins'][$index]['authenticatorSecret'] = null;
    $store['admins'][$index]['updatedAt'] = now_utc();
    write_store($store);

    write_audit_log(
        'security.authenticator.disabled',
        'Disabled Google Authenticator verification.',
        'warning',
        [],
        $store['admins'][$index],
        true
    );

    json_response([
        'message' => 'Google Authenticator disabled.',
        'admin' => public_admin($store['admins'][$index]),
    ]);
}

json_response(['error' => 'Invalid action.'], 422);
