<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET']);
require_admin_permission('health');

json_response([
    'health' => system_health_summary(),
]);
