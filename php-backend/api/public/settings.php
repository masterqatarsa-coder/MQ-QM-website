<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['GET']);
enable_public_response_cache(300);

json_response([
    'settings' => settings_payload(true),
]);
