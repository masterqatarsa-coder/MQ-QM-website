<?php
declare(strict_types=1);

function phpmailer_src_path(): string
{
    return app_path('vendor/phpmailer/phpmailer/src');
}

function load_phpmailer_runtime(): bool
{
    $basePath = phpmailer_src_path();

    if (!is_dir($basePath)) {
        return false;
    }

    require_once $basePath . '/Exception.php';
    require_once $basePath . '/PHPMailer.php';
    require_once $basePath . '/SMTP.php';

    return class_exists('\\PHPMailer\\PHPMailer\\PHPMailer');
}

function smtp_is_configured(): bool
{
    return sanitize_text(env_value('SMTP_HOST', '') ?? '') !== ''
        && sanitize_text(env_value('SMTP_USERNAME', '') ?? '') !== ''
        && sanitize_text(env_value('SMTP_PASSWORD', '') ?? '') !== '';
}

function smtp_secure_mode(): string
{
    $mode = strtolower(sanitize_text(env_value('SMTP_ENCRYPTION', 'tls') ?? 'tls'));

    if (in_array($mode, ['ssl', 'smtps'], true)) {
        return \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
    }

    return \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
}

function mail_debug_log_path(): string
{
    return storage_path('mail.log');
}

function append_mail_log(string $message): void
{
    $directory = dirname(mail_debug_log_path());
    if (!is_dir($directory)) {
        mkdir($directory, 0777, true);
    }

    file_put_contents(
        mail_debug_log_path(),
        '[' . now_utc() . '] ' . $message . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}

function send_transactional_email(array $payload): array
{
    if (!load_phpmailer_runtime()) {
        append_mail_log('PHPMailer source files were not found. Email delivery skipped.');
        return [
            'sent' => false,
            'skipped' => true,
            'reason' => 'PHPMailer is not available on the server.',
        ];
    }

    if (!smtp_is_configured()) {
        append_mail_log('SMTP settings are not configured. Email delivery skipped.');
        return [
            'sent' => false,
            'skipped' => true,
            'reason' => 'SMTP is not configured yet.',
        ];
    }

    try {
        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = sanitize_text(env_value('SMTP_HOST', '') ?? '');
        $mail->Port = (int)(env_value('SMTP_PORT', '587') ?? '587');
        $mail->SMTPAuth = normalize_bool(env_value('SMTP_AUTH', '1') ?? '1') === 1;
        $mail->Username = sanitize_text(env_value('SMTP_USERNAME', '') ?? '');
        $mail->Password = env_value('SMTP_PASSWORD', '') ?? '';
        $mail->CharSet = 'UTF-8';
        $mail->SMTPSecure = smtp_secure_mode();

        $fromEmail = sanitize_text((string)($payload['fromEmail'] ?? env_value('SMTP_FROM_EMAIL', '') ?? ''));
        $fromName = sanitize_text((string)($payload['fromName'] ?? env_value('SMTP_FROM_NAME', 'Website') ?? 'Website'));

        if ($fromEmail === '') {
            return [
                'sent' => false,
                'skipped' => true,
                'reason' => 'SMTP from email is not configured yet.',
            ];
        }

        $mail->setFrom($fromEmail, $fromName);

        $recipients = $payload['to'] ?? [];
        if (!is_array($recipients)) {
            $recipients = [$recipients];
        }

        foreach ($recipients as $recipient) {
            $email = sanitize_text((string)$recipient);
            if ($email !== '') {
                $mail->addAddress($email);
            }
        }

        $replyToEmail = sanitize_text((string)($payload['replyToEmail'] ?? ''));
        if ($replyToEmail !== '') {
            $replyToName = sanitize_text((string)($payload['replyToName'] ?? ''));
            $mail->addReplyTo($replyToEmail, $replyToName);
        }

        $attachments = $payload['attachments'] ?? [];
        if (is_array($attachments)) {
            foreach ($attachments as $attachment) {
                if (!is_array($attachment)) {
                    continue;
                }

                $attachmentPath = sanitize_text((string)($attachment['path'] ?? ''));
                $attachmentName = sanitize_text((string)($attachment['name'] ?? ''));

                if ($attachmentPath !== '' && file_exists($attachmentPath)) {
                    $mail->addAttachment($attachmentPath, $attachmentName !== '' ? $attachmentName : basename($attachmentPath));
                }
            }
        }

        $mail->isHTML(true);
        $mail->Subject = sanitize_text((string)($payload['subject'] ?? 'Website notification'));
        $mail->Body = (string)($payload['html'] ?? nl2br(htmlspecialchars((string)($payload['text'] ?? ''), ENT_QUOTES, 'UTF-8')));
        $mail->AltBody = (string)($payload['text'] ?? strip_tags((string)($payload['html'] ?? '')));
        $mail->send();

        append_mail_log('Email sent: ' . $mail->Subject);

        return [
            'sent' => true,
            'skipped' => false,
            'reason' => null,
        ];
    } catch (\Throwable $exception) {
        append_mail_log('Email failed: ' . $exception->getMessage());

        return [
            'sent' => false,
            'skipped' => false,
            'reason' => $exception->getMessage(),
        ];
    }
}

function mail_message_text(string $heading, array $lines): string
{
    $cleanLines = array_filter(array_map(
        static fn(mixed $line): string => sanitize_text((string)$line),
        $lines
    ), static fn(string $line): bool => $line !== '');

    return trim($heading . PHP_EOL . PHP_EOL . implode(PHP_EOL, $cleanLines));
}

function mail_message_html(string $heading, array $rows): string
{
    $htmlRows = '';
    foreach ($rows as $label => $value) {
        $stringValue = nl2br(htmlspecialchars(sanitize_text((string)$value), ENT_QUOTES, 'UTF-8'));
        $htmlRows .= '<tr>'
            . '<td style="padding:10px 14px;font-weight:700;border-bottom:1px solid #e2e8f0;width:180px;">'
            . htmlspecialchars((string)$label, ENT_QUOTES, 'UTF-8')
            . '</td>'
            . '<td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;">'
            . $stringValue
            . '</td>'
            . '</tr>';
    }

    return '<div style="font-family:Arial,sans-serif;color:#0f172a;">'
        . '<h2 style="margin:0 0 16px;">' . htmlspecialchars($heading, ENT_QUOTES, 'UTF-8') . '</h2>'
        . '<table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">'
        . $htmlRows
        . '</table>'
        . '</div>';
}
