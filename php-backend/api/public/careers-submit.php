<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);

$contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
$payload = str_contains($contentType, 'multipart/form-data') ? $_POST : request_json();
$name = sanitize_text($payload['name'] ?? '');
$email = sanitize_text($payload['email'] ?? '');
$phone = sanitize_text($payload['phone'] ?? '');
$role = sanitize_text($payload['role'] ?? '');
$message = sanitize_text($payload['message'] ?? '');
$resume = uploaded_resume_from_request();

enforce_rate_limit(
    'public_career_submit',
    current_request_fingerprint(),
    6,
    900,
    'Too many career applications from this visitor. Please wait before trying again.'
);

if ($name === '' || $email === '' || $phone === '' || $role === '' || $message === '' || $resume === null) {
    json_response(['error' => 'All career form fields are required, including the resume attachment.'], 422);
}

if (!is_valid_email($email)) {
    json_response(['error' => 'A valid email address is required.'], 422);
}

save_submission_item('career', [
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'role' => $role,
    'message' => $message,
    'resumeFileName' => $resume['storedName'],
    'resumeOriginalName' => $resume['originalName'],
    'resumeMimeType' => $resume['mimeType'],
    'resumeSizeBytes' => $resume['sizeBytes'],
    'resumePath' => $resume['path'],
]);

$settings = settings_payload(false);
$mailResult = send_transactional_email([
    'to' => [$settings['careers_recipient_email'] ?: $settings['primary_email']],
    'fromEmail' => $settings['mail_from_email'] ?: env_value('SMTP_FROM_EMAIL', '') ?? '',
    'fromName' => $settings['mail_from_name'] ?: $settings['site_name'],
    'replyToEmail' => $email,
    'replyToName' => $name,
    'subject' => 'New career application: ' . $role,
    'text' => mail_message_text('New career application received', [
        'Name: ' . $name,
        'Email: ' . $email,
        'Phone: ' . $phone,
        'Role: ' . $role,
        'Resume: ' . $resume['originalName'],
        'Message: ' . $message,
    ]),
    'html' => mail_message_html('New career application received', [
        'Name' => $name,
        'Email' => $email,
        'Phone' => $phone,
        'Role' => $role,
        'Resume' => $resume['originalName'],
        'Message' => $message,
    ]),
    'attachments' => [[
        'path' => resolve_storage_path($resume['path']),
        'name' => $resume['originalName'],
    ]],
]);

record_event([
    'eventType' => 'career_form_submit',
    'page' => '/careers',
    'label' => $role,
]);

$responseMessage = 'Career form submitted successfully.';

if (!$mailResult['sent'] && ($mailResult['reason'] ?? null)) {
    $responseMessage = $mailResult['skipped']
        ? 'Career application saved and shown in admin. Email notification will start once SMTP is configured.'
        : 'Career application saved in admin, but email notification could not be sent right now.';
}

json_response(['message' => $responseMessage]);
