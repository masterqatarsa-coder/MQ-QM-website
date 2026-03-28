<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/bootstrap.php';

require_http_method(['POST']);
$admin = require_authenticated_admin();
$settings = settings_payload(false);

$payload = request_json();
$submissionType = sanitize_text($payload['submissionType'] ?? '');
$submissionId = (int)($payload['submissionId'] ?? 0);
$subject = sanitize_text($payload['subject'] ?? '');
$message = sanitize_text($payload['message'] ?? '');

if (!in_array($submissionType, ['contact', 'career'], true) || $submissionId <= 0) {
    json_response(['error' => 'Valid submission type and id are required.'], 422);
}

require_admin_permission($submissionType === 'contact' ? 'contacts' : 'careers');

if ($subject === '' || $message === '') {
    json_response(['error' => 'Reply subject and message are required.'], 422);
}

$submissions = list_submissions($submissionType);
$submission = null;
foreach ($submissions as $item) {
    if ((int)($item['id'] ?? 0) === $submissionId) {
        $submission = $item;
        break;
    }
}

if ($submission === null) {
    json_response(['error' => 'Submission not found.'], 404);
}

$mailResult = send_transactional_email([
    'to' => [$submission['email']],
    'fromEmail' => $settings['mail_from_email'] ?: env_value('SMTP_FROM_EMAIL', '') ?? '',
    'fromName' => $settings['mail_from_name'] ?: $settings['site_name'],
    'replyToEmail' => $settings['primary_email'],
    'replyToName' => $settings['site_name'],
    'subject' => $subject,
    'text' => $message,
    'html' => '<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.7;">'
        . nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'))
        . '</div>',
]);

$responseMessage = 'Reply saved.';
if (!$mailResult['sent'] && ($mailResult['reason'] ?? null)) {
    $responseMessage = $mailResult['skipped']
        ? 'Reply saved in admin. Email delivery will start once SMTP is configured.'
        : 'Reply saved in admin, but email delivery failed.';
}

$items = add_submission_reply($submissionType, $submissionId, [
    'subject' => $subject,
    'message' => $message,
    'adminName' => $admin['name'] ?? 'Admin',
]);

write_audit_log(
    'admin.reply_sent',
    'Sent an inbox reply from the admin panel.',
    'info',
    ['type' => $submissionType, 'submissionId' => $submissionId, 'mailSent' => $mailResult['sent'] ?? false],
    $admin
);

json_response([
    'message' => $responseMessage,
    'items' => $items,
]);
