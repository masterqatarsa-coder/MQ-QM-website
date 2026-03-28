<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);
$admin = current_admin();

if ($admin !== null) {
    close_current_admin_session('logged_out', 'Admin signed out.');
    write_audit_log('auth.logout', 'Admin panel logout.', 'info', [], $admin);
}

clear_auth_flow();
session_destroy();

json_response(['message' => 'Logged out successfully.']);
