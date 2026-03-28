<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET']);
enable_public_response_cache(300);

$type = sanitize_text($_GET['type'] ?? '');
$homepage = isset($_GET['homepage']) && $_GET['homepage'] === '1';

if ($type === '') {
    json_response(['error' => 'Content type is required.'], 422);
}

if ($homepage) {
    json_response([
        'items' => list_homepage_content_items($type),
    ]);
} else {
    json_response([
        'items' => list_content_items($type, true),
    ]);
}
