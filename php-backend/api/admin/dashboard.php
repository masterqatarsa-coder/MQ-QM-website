<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET']);
$admin = require_authenticated_admin();

json_response(dashboard_summary($admin));
