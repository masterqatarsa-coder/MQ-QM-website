<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET', 'POST']);
$admin = require_admin_permission('settings');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    json_response([
        'settings' => settings_payload(),
    ]);
}

$payload = request_json();
$settings = save_settings_payload($payload);

write_audit_log(
    'admin.settings_saved',
    'Updated site settings.',
    'info',
    ['keys' => array_keys($payload)],
    $admin
);

json_response([
    'message' => 'Settings saved.',
    'settings' => $settings,
]);
