<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET', 'POST']);
$admin = require_admin_permission('health');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    $store = read_store();
    $scope = sanitize_text((string)($_GET['scope'] ?? ''));

    if ($scope !== '') {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $pageSize = max(1, (int)($_GET['pageSize'] ?? 8));

        $items = match ($scope) {
            'admin_logins' => admin_login_sessions($store),
            'panel' => panel_activity_logs($store, $admin),
            'suspicious' => suspicious_activity_groups($store),
            default => null,
        };

        if ($items === null) {
            json_response(['error' => 'Invalid security history scope.'], 422);
        }

        json_response(paginate_collection($items, $page, $pageSize));
    }

    json_response([
        'suspiciousActivity' => array_slice(suspicious_activity_groups($store), 0, 20),
        'blockedIps' => blocked_ip_list($store),
        'recentAdminLogins' => array_slice(admin_login_sessions($store), 0, 10),
        'recentPanelActivity' => array_slice(panel_activity_logs($store, $admin), 0, 10),
    ]);
}

$payload = request_json();
$action = sanitize_text((string)($payload['action'] ?? ''));
$ipAddress = sanitize_text((string)($payload['ipAddress'] ?? ''));
$loginId = sanitize_text((string)($payload['loginId'] ?? ''));
$requestFingerprint = sanitize_text((string)($payload['requestFingerprint'] ?? ''));
$adminPassword = (string)($payload['adminPassword'] ?? '');

if ($action === '') {
    json_response(['error' => 'Action is required.'], 422);
}

if ($action === 'block') {
    if ($ipAddress === '') {
        json_response(['error' => 'IP address is required.'], 422);
    }
    block_ip_address($ipAddress, $admin);
} elseif ($action === 'unblock') {
    if ($ipAddress === '') {
        json_response(['error' => 'IP address is required.'], 422);
    }

    if ($adminPassword === '' || !password_verify($adminPassword, (string)($admin['passwordHash'] ?? ''))) {
        write_audit_log(
            'security.unblock_ip.denied',
            'Failed blocked IP removal confirmation.',
            'warning',
            ['ipAddress' => $ipAddress],
            $admin,
            true
        );
        json_response(['error' => 'Admin password confirmation is required to unblock this IP address.'], 401);
    }

    unblock_ip_address($ipAddress, $admin);
} elseif ($action === 'clear_login_lock') {
    if ($loginId === '') {
        json_response(['error' => 'Login ID is required.'], 422);
    }
    clear_login_lockouts($loginId, $requestFingerprint, $admin);
} else {
    json_response(['error' => 'Invalid action.'], 422);
}

$store = read_store();
json_response([
    'message' => $action === 'block'
        ? 'IP address blocked.'
        : ($action === 'unblock' ? 'IP address unblocked.' : 'Login lock cleared.'),
    'suspiciousActivity' => array_slice(suspicious_activity_groups($store), 0, 20),
    'blockedIps' => blocked_ip_list($store),
    'recentAdminLogins' => array_slice(admin_login_sessions($store), 0, 10),
    'recentPanelActivity' => array_slice(panel_activity_logs($store, $admin), 0, 10),
]);
