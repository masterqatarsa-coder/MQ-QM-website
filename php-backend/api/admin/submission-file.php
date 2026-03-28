<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET']);
require_authenticated_admin();

$type = sanitize_text($_GET['type'] ?? '');
$id = (int)($_GET['id'] ?? 0);
$disposition = strtolower(sanitize_text($_GET['disposition'] ?? 'attachment'));

if ($type !== 'career' || $id <= 0) {
    json_response(['error' => 'Valid career submission id is required.'], 422);
}

$store = read_store();
$submissions = $store['submissions']['career'] ?? [];
$submission = null;

foreach ($submissions as $item) {
    if ((int)($item['id'] ?? 0) === $id) {
        $submission = $item;
        break;
    }
}

if ($submission === null) {
    json_response(['error' => 'Submission not found.'], 404);
}

$resumePath = sanitize_text((string)($submission['resumePath'] ?? ''));
$resumeName = sanitize_text((string)($submission['resumeOriginalName'] ?? $submission['resumeFileName'] ?? 'resume'));
$resumeMimeType = sanitize_text((string)($submission['resumeMimeType'] ?? 'application/octet-stream'));

if ($resumePath === '') {
    json_response(['error' => 'Resume attachment not found.'], 404);
}

$absolutePath = resolve_storage_path($resumePath);

if (!file_exists($absolutePath)) {
    json_response(['error' => 'Resume attachment is missing from storage.'], 404);
}

header_remove('Content-Type');
header('Content-Type: ' . ($resumeMimeType !== '' ? $resumeMimeType : 'application/octet-stream'));
header('Content-Length: ' . (string)filesize($absolutePath));

$safeDisposition = 'attachment';
if ($disposition === 'inline' && $resumeMimeType === 'application/pdf') {
    $safeDisposition = 'inline';
}

header('Content-Disposition: ' . $safeDisposition . '; filename="' . addslashes($resumeName) . '"');

readfile($absolutePath);
exit;
