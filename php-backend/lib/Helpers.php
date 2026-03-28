<?php
declare(strict_types=1);

function load_env_file(string $filePath): void
{
    if (!file_exists($filePath)) {
        return;
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);

        if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $trimmed, 2);
        $key = trim($key);
        $value = trim($value);

        if ($value !== '' && str_starts_with($value, '"') && str_ends_with($value, '"')) {
            $value = substr($value, 1, -1);
        }

        if (getenv($key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
}

function env_value(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    return $value === false ? $default : $value;
}

function app_path(string $relative = ''): string
{
    $base = dirname(__DIR__);
    return $relative === '' ? $base : $base . DIRECTORY_SEPARATOR . ltrim($relative, '\\/');
}

function storage_path(string $relative = ''): string
{
    $configuredPath = sanitize_text(env_value('APP_DATA_DIR', '') ?? '');

    if ($configuredPath === '') {
        $base = app_path('data');
    } elseif (preg_match('/^(?:[A-Za-z]:\\\\|\\/)/', $configuredPath) === 1) {
        $base = $configuredPath;
    } else {
        $base = app_path($configuredPath);
    }

    return $relative === '' ? $base : $base . DIRECTORY_SEPARATOR . ltrim($relative, '\\/');
}

function configured_allowed_origins(): array
{
    $configured = sanitize_text(
        env_value('APP_ALLOWED_ORIGINS', env_value('CORS_ALLOWED_ORIGINS', '') ?? '') ?? ''
    );

    if ($configured === '') {
        return [
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ];
    }

    $origins = array_values(array_filter(array_map(
        static fn(string $origin): string => trim($origin),
        explode(',', $configured)
    ), static fn(string $origin): bool => $origin !== ''));

    return array_values(array_unique($origins));
}

function session_cookie_samesite(): string
{
    $value = ucfirst(strtolower(sanitize_text(env_value('SESSION_COOKIE_SAMESITE', 'Strict') ?? 'Strict')));
    return in_array($value, ['Strict', 'Lax', 'None'], true) ? $value : 'Strict';
}

function session_cookie_secure_flag(): bool
{
    $sameSite = session_cookie_samesite();

    if ($sameSite === 'None') {
        return true;
    }

    return is_https_request();
}

function trust_proxy_headers(): bool
{
    $value = env_value('ADMIN_TRUST_PROXY_HEADERS', env_value('TRUST_PROXY_HEADERS', '0'));
    return in_array(strtolower(trim((string)$value)), ['1', 'true', 'yes', 'on'], true);
}

function start_app_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $sameSite = session_cookie_samesite();
    $secure = session_cookie_secure_flag();

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_secure', $secure ? '1' : '0');
    ini_set('session.cookie_samesite', $sameSite);
    ini_set('session.gc_maxlifetime', '7200');

    session_name('mq_admin_session');

    session_set_cookie_params([
        'httponly' => true,
        'lifetime' => 0,
        'path' => '/',
        'samesite' => $sameSite,
        'secure' => $secure,
    ]);

    session_start();
}

function is_https_request(): bool
{
    $https = $_SERVER['HTTPS'] ?? '';
    $forwarded = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';

    return $https === 'on' || $https === '1' || strtolower((string) $forwarded) === 'https';
}

function set_api_headers(): void
{
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    header('Expires: 0');
    header('X-Frame-Options: DENY');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    header('Cross-Origin-Opener-Policy: same-origin');
    header('Cross-Origin-Resource-Policy: same-origin');
    header('Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');

    if (is_https_request()) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = configured_allowed_origins();

    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
}

function enable_public_response_cache(int $maxAge = 300): void
{
    $maxAge = max(60, $maxAge);

    header_remove('Pragma');
    header('Cache-Control: public, max-age=' . $maxAge . ', stale-while-revalidate=60');
    header('Expires: ' . gmdate('D, d M Y H:i:s', time() + $maxAge) . ' GMT');
}

function handle_preflight_request(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'OPTIONS') {
        return;
    }

    http_response_code(204);
    exit;
}

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_json(): array
{
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        return [];
    }

    $decoded = json_decode($rawBody, true);
    return is_array($decoded) ? $decoded : [];
}

function require_http_method(array $allowedMethods): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if (!in_array($method, $allowedMethods, true)) {
        json_response(['error' => 'Method not allowed.'], 405);
    }
}

function now_utc(): string
{
    return gmdate('Y-m-d H:i:s');
}

function sanitize_text(?string $value): string
{
    return trim((string) $value);
}

function mask_email(string $email): string
{
    if (!str_contains($email, '@')) {
        return $email;
    }

    [$name, $domain] = explode('@', $email, 2);
    $visibleName = strlen($name) <= 2 ? substr($name, 0, 1) : substr($name, 0, 2);
    return $visibleName . str_repeat('*', max(2, strlen($name) - strlen($visibleName))) . '@' . $domain;
}

function is_valid_email(string $email): bool
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function normalize_bool(mixed $value): int
{
    if (is_bool($value)) {
        return $value ? 1 : 0;
    }

    $stringValue = strtolower(trim((string) $value));
    return in_array($stringValue, ['1', 'true', 'yes', 'on'], true) ? 1 : 0;
}

function decode_metadata(mixed $metadata): array
{
    if (is_array($metadata)) {
        return $metadata;
    }

    if (is_string($metadata) && trim($metadata) !== '') {
        $decoded = json_decode($metadata, true);
        return is_array($decoded) ? $decoded : [];
    }

    return [];
}

function json_metadata(array $metadata): string
{
    return json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
}

function app_log_path(string $fileName = 'app.log'): string
{
    return storage_path($fileName);
}

function append_app_log(string $message, string $fileName = 'app.log'): void
{
    $path = app_log_path($fileName);
    $directory = dirname($path);

    if (!is_dir($directory)) {
        @mkdir($directory, 0777, true);
    }

    @file_put_contents(
        $path,
        '[' . now_utc() . '] ' . $message . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}

function security_secret(): string
{
    static $secret = null;

    if (is_string($secret) && $secret !== '') {
        return $secret;
    }

    $envSecret = sanitize_text(env_value('APP_SECURITY_KEY', env_value('APP_KEY', '') ?? '') ?? '');
    if ($envSecret !== '') {
        $secret = $envSecret;
        return $secret;
    }

    $secret = hash('sha256', app_path() . '|' . (env_value('ADMIN_DEFAULT_EMAIL', 'local-dev') ?? 'local-dev'));
    return $secret;
}

function encrypt_sensitive_value(string $value): string
{
    if ($value === '') {
        return '';
    }

    if (!function_exists('openssl_encrypt')) {
        return 'plain:' . base64_encode($value);
    }

    $key = hash('sha256', security_secret(), true);
    $iv = random_bytes(16);
    $ciphertext = openssl_encrypt($value, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

    if ($ciphertext === false) {
        return 'plain:' . base64_encode($value);
    }

    return 'enc:' . base64_encode($iv . $ciphertext);
}

function decrypt_sensitive_value(?string $value): string
{
    $normalized = trim((string)$value);
    if ($normalized === '') {
        return '';
    }

    if (str_starts_with($normalized, 'plain:')) {
        $decoded = base64_decode(substr($normalized, 6), true);
        return is_string($decoded) ? $decoded : '';
    }

    if (!str_starts_with($normalized, 'enc:') || !function_exists('openssl_decrypt')) {
        return $normalized;
    }

    $decoded = base64_decode(substr($normalized, 4), true);
    if (!is_string($decoded) || strlen($decoded) <= 16) {
        return '';
    }

    $iv = substr($decoded, 0, 16);
    $ciphertext = substr($decoded, 16);
    $key = hash('sha256', security_secret(), true);
    $plaintext = openssl_decrypt($ciphertext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

    return is_string($plaintext) ? $plaintext : '';
}

function forwarded_client_ip(): string
{
    $candidates = [
        sanitize_text($_SERVER['HTTP_CF_CONNECTING_IP'] ?? ''),
        sanitize_text($_SERVER['HTTP_X_REAL_IP'] ?? ''),
    ];

    foreach ($candidates as $candidate) {
        if ($candidate !== '' && filter_var($candidate, FILTER_VALIDATE_IP) !== false) {
            return $candidate;
        }
    }

    $forwarded = sanitize_text($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
    if ($forwarded !== '') {
        $parts = array_map('trim', explode(',', $forwarded));
        foreach ($parts as $part) {
            if ($part !== '' && filter_var($part, FILTER_VALIDATE_IP) !== false) {
                return $part;
            }
        }
    }

    return '';
}

function client_ip_address(): string
{
    if (trust_proxy_headers()) {
        $forwarded = forwarded_client_ip();
        if ($forwarded !== '') {
            return $forwarded;
        }
    }

    $remoteAddress = sanitize_text($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0') ?: '0.0.0.0';
    return filter_var($remoteAddress, FILTER_VALIDATE_IP) !== false ? $remoteAddress : '0.0.0.0';
}

function hash_identifier(string $value): string
{
    return substr(hash_hmac('sha256', $value, security_secret()), 0, 20);
}

function current_request_fingerprint(): string
{
    $userAgent = sanitize_text($_SERVER['HTTP_USER_AGENT'] ?? 'unknown-client') ?: 'unknown-client';
    return hash_identifier(client_ip_address() . '|' . $userAgent);
}

function visitor_cookie_name(): string
{
    return 'mq_visitor_id';
}

function ensure_public_visitor_id(): string
{
    $existing = sanitize_text($_COOKIE[visitor_cookie_name()] ?? '');
    if (preg_match('/^[a-f0-9]{32}$/', $existing) === 1) {
        return $existing;
    }

    try {
        $visitorId = bin2hex(random_bytes(16));
    } catch (\Throwable) {
        $visitorId = hash('sha256', uniqid('mq_visitor_', true) . microtime(true));
        $visitorId = substr($visitorId, 0, 32);
    }

    setcookie(visitor_cookie_name(), $visitorId, [
        'expires' => time() + (86400 * 90),
        'path' => '/',
        'secure' => is_https_request(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    $_COOKIE[visitor_cookie_name()] = $visitorId;

    return $visitorId;
}

function visitor_alias(string $visitorId): string
{
    return 'Visitor ' . strtoupper(substr($visitorId, 0, 6));
}

function current_browser_name(): string
{
    $userAgent = strtolower(sanitize_text($_SERVER['HTTP_USER_AGENT'] ?? ''));

    if ($userAgent === '') {
        return 'Unknown browser';
    }

    if (str_contains($userAgent, 'edg/')) {
        return 'Microsoft Edge';
    }

    if (str_contains($userAgent, 'opr/') || str_contains($userAgent, 'opera')) {
        return 'Opera';
    }

    if (str_contains($userAgent, 'chrome/') && !str_contains($userAgent, 'edg/')) {
        return 'Chrome';
    }

    if (str_contains($userAgent, 'safari/') && !str_contains($userAgent, 'chrome/')) {
        return 'Safari';
    }

    if (str_contains($userAgent, 'firefox/')) {
        return 'Firefox';
    }

    return 'Other browser';
}

function current_device_type(): string
{
    $userAgent = strtolower(sanitize_text($_SERVER['HTTP_USER_AGENT'] ?? ''));

    if ($userAgent === '') {
        return 'Unknown device';
    }

    if (str_contains($userAgent, 'tablet') || str_contains($userAgent, 'ipad')) {
        return 'Tablet';
    }

    if (str_contains($userAgent, 'mobile') || str_contains($userAgent, 'android')) {
        return 'Mobile';
    }

    return 'Desktop';
}

function current_referrer_summary(): ?string
{
    $referrer = sanitize_text($_SERVER['HTTP_REFERER'] ?? '');
    if ($referrer === '') {
        return null;
    }

    $host = (string)(parse_url($referrer, PHP_URL_HOST) ?? '');
    $path = (string)(parse_url($referrer, PHP_URL_PATH) ?? '');

    $summary = trim($host . $path);
    return $summary !== '' ? $summary : null;
}

function current_visitor_context(): array
{
    $visitorId = ensure_public_visitor_id();

    return [
        'visitorId' => $visitorId,
        'visitorAlias' => visitor_alias($visitorId),
        'sessionHash' => hash_identifier(session_id() !== '' ? session_id() : 'sessionless'),
        'requestFingerprint' => current_request_fingerprint(),
        'ipHash' => hash_identifier(client_ip_address()),
        'browser' => current_browser_name(),
        'deviceType' => current_device_type(),
        'referrer' => current_referrer_summary(),
    ];
}

function password_strength_error(string $password): ?string
{
    if (strlen($password) < 10) {
        return 'Use at least 10 characters for the new password.';
    }

    if (!preg_match('/[a-z]/', $password)) {
        return 'Include at least one lowercase letter in the new password.';
    }

    if (!preg_match('/[A-Z]/', $password)) {
        return 'Include at least one uppercase letter in the new password.';
    }

    if (!preg_match('/\d/', $password)) {
        return 'Include at least one number in the new password.';
    }

    if (!preg_match('/[^a-zA-Z0-9]/', $password)) {
        return 'Include at least one special character in the new password.';
    }

    return null;
}
