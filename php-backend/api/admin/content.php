<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET', 'POST', 'DELETE']);
$admin = require_admin_permission('content');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $type = sanitize_text($_GET['type'] ?? '');
    if ($type === '') {
        json_response(['error' => 'Content type is required.'], 422);
    }

    json_response([
        'items' => list_content_items($type, false),
    ]);
}

$payload = request_json();

if ($method === 'POST') {
    $item = save_content_item($payload);
    write_audit_log(
        'admin.content_saved',
        'Saved managed website content.',
        'info',
        ['type' => $item['type'], 'title' => $item['title']],
        $admin
    );
    json_response([
        'message' => 'Content saved.',
        'item' => $item,
        'items' => list_content_items((string)$item['type'], false),
    ]);
}

$type = sanitize_text($payload['type'] ?? '');
$id = (int)($payload['id'] ?? 0);

if ($type === '' || $id <= 0) {
    json_response(['error' => 'Content type and id are required.'], 422);
}

write_audit_log(
    'admin.content_deleted',
    'Deleted managed website content.',
    'warning',
    ['type' => $type, 'id' => $id],
    $admin
);

json_response([
    'message' => 'Content deleted.',
    'items' => delete_content_item($type, $id),
]);
