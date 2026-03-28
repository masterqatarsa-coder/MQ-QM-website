<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET', 'POST', 'DELETE']);
$admin = require_admin_permission('users');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    json_response([
        'items' => list_admin_users(),
    ]);
}

$payload = request_json();

if ($method === 'DELETE') {
    $id = (int)($payload['id'] ?? 0);

    if ($id <= 0) {
        json_response(['error' => 'User id is required.'], 422);
    }

    json_response([
        'message' => 'User deleted.',
        'items' => delete_admin_user($id, $admin),
    ]);
}

$action = sanitize_text((string)($payload['action'] ?? 'save'));

if ($action === 'create') {
    $result = create_admin_user($payload, $admin);
    json_response([
        'message' => 'User created.',
        'item' => $result['user'],
        'items' => $result['users'],
    ]);
}

if ($action === 'reset_password') {
    $id = (int)($payload['id'] ?? 0);
    $password = (string)($payload['password'] ?? '');

    if ($id <= 0 || $password === '') {
        json_response(['error' => 'User id and the new password are required.'], 422);
    }

    $result = reset_admin_user_password($id, $password, $admin);
    json_response([
        'message' => 'User password reset.',
        'items' => $result['users'],
    ]);
}

$result = update_admin_user($payload, $admin);
json_response([
    'message' => 'User updated.',
    'item' => $result['user'],
    'items' => $result['users'],
]);
