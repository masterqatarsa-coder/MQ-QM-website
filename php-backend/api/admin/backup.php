<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET']);
$admin = require_admin_permission('settings');

$store = read_store();
$fileName = 'mq-admin-backup-' . gmdate('Ymd-His') . '.json';

write_audit_log(
    'admin.backup_exported',
    'Exported a full admin data backup.',
    'warning',
    ['fileName' => $fileName],
    $admin,
    true
);

header('Content-Type: application/json; charset=UTF-8');
header('Content-Disposition: attachment; filename="' . $fileName . '"');

echo json_encode([
    'exportedAt' => now_utc(),
    'storageMode' => 'JSON store',
    'data' => $store,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
exit;
