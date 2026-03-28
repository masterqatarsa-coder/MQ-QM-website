<?php
declare(strict_types=1);

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$path = is_string($requestPath) ? $requestPath : '/';

$documentRoot = __DIR__;
$resolvedPath = realpath($documentRoot . DIRECTORY_SEPARATOR . ltrim($path, '/'));

if (
    $resolvedPath !== false
    && str_starts_with($resolvedPath, $documentRoot)
    && is_file($resolvedPath)
) {
    return false;
}

$candidate = $documentRoot . DIRECTORY_SEPARATOR . ltrim($path, '/');

if (is_file($candidate)) {
    require $candidate;
    return true;
}

http_response_code(404);
header('Content-Type: application/json; charset=UTF-8');
echo json_encode(['error' => 'Not found.'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
