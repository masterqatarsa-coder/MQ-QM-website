<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);

$payload = request_json();
$name = sanitize_text($payload['name'] ?? '');
$email = sanitize_text($payload['email'] ?? '');
$phone = sanitize_text($payload['phone'] ?? '');
$message = sanitize_text($payload['message'] ?? '');

enforce_rate_limit(
    'public_contact_submit',
    current_request_fingerprint(),
    6,
    900,
    'Too many contact form submissions from this visitor. Please wait before trying again.'
);

if ($name === '' || $email === '' || $phone === '' || $message === '') {
    json_response(['error' => 'All contact form fields are required.'], 422);
}

if (!is_valid_email($email)) {
    json_response(['error' => 'A valid email address is required.'], 422);
}

save_submission_item('contact', [
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'message' => $message,
]);

$settings = settings_payload(false);
$mailResult = send_transactional_email([
    'to' => [$settings['contact_recipient_email'] ?: $settings['primary_email']],
    'fromEmail' => $settings['mail_from_email'] ?: env_value('SMTP_FROM_EMAIL', '') ?? '',
    'fromName' => $settings['mail_from_name'] ?: $settings['site_name'],
    'replyToEmail' => $email,
    'replyToName' => $name,
    'subject' => 'New contact inquiry from ' . $name,
    'text' => mail_message_text('New contact inquiry received', [
        'Name: ' . $name,
        'Email: ' . $email,
        'Phone: ' . $phone,
        'Message: ' . $message,
    ]),
    'html' => mail_message_html('New contact inquiry received', [
        'Name' => $name,
        'Email' => $email,
        'Phone' => $phone,
        'Message' => $message,
    ]),
]);

record_event([
    'eventType' => 'contact_form_submit',
    'page' => '/contact',
    'label' => 'contact_form',
]);

$responseMessage = 'Contact form submitted successfully.';

if (!$mailResult['sent'] && ($mailResult['reason'] ?? null)) {
    $responseMessage = $mailResult['skipped']
        ? 'Contact form saved and shown in admin. Email notification will start once SMTP is configured.'
        : 'Contact form saved in admin, but email notification could not be sent right now.';
}

json_response(['message' => $responseMessage]);
