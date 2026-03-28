<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);
$payload = request_json();
$otp = sanitize_text($payload['otp'] ?? '');

if ($otp === '') {
    json_response(['error' => 'OTP is required.'], 422);
}

$challenge = verify_otp_challenge('password_reset', $otp);
$_SESSION['password_reset_verified'] = [
    'adminId' => (int)$challenge['adminId'],
    'expiresAt' => time() + 900,
    'clientHash' => current_request_fingerprint(),
];

json_response(['message' => 'Password reset verified.']);
