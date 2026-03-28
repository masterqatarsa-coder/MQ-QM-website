<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET', 'PATCH']);
$admin = require_authenticated_admin();

$type = sanitize_text($_GET['type'] ?? '');

if (!in_array($type, ['contact', 'career'], true)) {
    json_response(['error' => 'Valid submission type is required.'], 422);
}

require_admin_permission($type === 'contact' ? 'contacts' : 'careers');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    json_response([
        'items' => list_submissions($type),
    ]);
}

$payload = request_json();
$id = (int)($payload['id'] ?? 0);
$status = sanitize_text($payload['status'] ?? 'unread');
$adminNotes = sanitize_text($payload['adminNotes'] ?? '');

if ($id <= 0) {
    json_response(['error' => 'Submission id is required.'], 422);
}

$items = update_submission_item($type, $id, $status, $adminNotes);
write_audit_log(
    'admin.submission_updated',
    'Updated inbox submission status or notes.',
    'info',
    ['type' => $type, 'submissionId' => $id, 'status' => $status],
    $admin
);

json_response([
    'message' => 'Submission updated.',
    'items' => $items,
]);
