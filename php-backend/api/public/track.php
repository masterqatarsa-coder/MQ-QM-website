<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);

$payload = request_json();
enforce_rate_limit(
    'public_tracking',
    current_request_fingerprint(),
    240,
    3600,
    'Tracking rate limit reached for this visitor.'
);
record_event($payload);

json_response([
    'message' => 'Event tracked.',
]);
