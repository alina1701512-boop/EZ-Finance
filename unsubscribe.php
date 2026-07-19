<?php
/**
 * EZ Finance — обработчик страницы отписки /unsubscribe/
 *
 * ВАЖНО: прямой интеграции с API EmailSender/SMTP.bz для автоматического
 * занесения в чёрный список здесь нет — нет доступа к этому API.
 * Пока что каждая заявка на отписку присылается уведомлением на почту,
 * и отписку нужно провести вручную в панели рассылки.
 * Как только будут данные API EmailSender — можно дописать автоматику
 * прямо в этот файл, вызвав нужный запрос перед отправкой уведомления.
 */

header('Content-Type: application/json; charset=utf-8');

// ==== НАСТРОЙКИ ПОЧТЫ (Яндекс, как в send-form.php) ====
define('SMTP_HOST', 'smtp.yandex.ru');
define('SMTP_PORT', 465);
define('SMTP_USER', 'info@ezfinance.ru');
define('SMTP_PASS', 'ВАШ_ПАРОЛЬ_ОТ_ПОЧТЫ'); // <-- впишите тот же пароль, что в send-form.php

$to = 'info@ezfinance.ru';
// ==========================================================

function smtp_send_mail($to, $subject, $body) {
    $host = SMTP_HOST;
    $port = SMTP_PORT;
    $user = SMTP_USER;
    $pass = SMTP_PASS;
    $fromEmail = SMTP_USER;
    $fromName  = 'EZ Finance Site';

    $socket = @stream_socket_client("ssl://$host:$port", $errno, $errstr, 10);
    if (!$socket) {
        return ['ok' => false, 'error' => 'connect_failed: ' . $errstr];
    }
    stream_set_timeout($socket, 15);

    $read = function () use ($socket) {
        $data = '';
        while (($line = fgets($socket, 515)) !== false) {
            $data .= $line;
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        $meta = stream_get_meta_data($socket);
        if ($meta['timed_out']) {
            $data .= "\n[connection timed out]";
        }
        return $data;
    };
    $write = function ($cmd) use ($socket) {
        fwrite($socket, $cmd . "\r\n");
    };

    $read();
    $write('EHLO ezfinance.ru');
    $read();
    $write('AUTH LOGIN');
    $read();
    $write(base64_encode($user));
    $read();
    $write(base64_encode($pass));
    $resp = $read();
    if (strpos($resp, '235') !== 0) {
        fclose($socket);
        return ['ok' => false, 'error' => 'auth_failed: ' . $resp];
    }

    $write("MAIL FROM:<$fromEmail>");
    $read();
    $write("RCPT TO:<$to>");
    $resp = $read();
    if (strpos($resp, '250') !== 0) {
        fclose($socket);
        return ['ok' => false, 'error' => 'rcpt_failed: ' . $resp];
    }

    $write('DATA');
    $read();

    $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers  = "From: $fromName <$fromEmail>\r\n";
    $headers .= "To: <$to>\r\n";
    $headers .= "Subject: $encodedSubject\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";

    $bodyEscaped = preg_replace('/\n\./', "\n..", $body);
    $message = $headers . "\r\n" . $bodyEscaped . "\r\n.";
    $write($message);
    $resp = $read();

    $write('QUIT');
    fclose($socket);

    return ['ok' => (strpos($resp, '250') === 0), 'raw' => $resp];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

$email  = isset($_POST['email']) ? trim($_POST['email']) : '';
$token  = isset($_POST['token']) ? trim($_POST['token']) : '';
$reason = isset($_POST['reason']) ? trim($_POST['reason']) : '';
$page   = isset($_POST['page_url']) ? trim($_POST['page_url']) : '';

if ($email === '' && $token === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'missing_identifier']);
    exit;
}

$subject = '[EZ Finance] Заявка на отписку' . ($email !== '' ? ' — ' . $email : '');

$lines = [];
$lines[] = 'Запрос на отписку от рассылки EZ Finance';
$lines[] = str_repeat('-', 40);
if ($email !== '') $lines[] = 'Email: ' . $email;
if ($token !== '') $lines[] = 'Токен/ID контакта: ' . $token;
$lines[] = 'Причина: ' . ($reason !== '' ? $reason : 'не указана');
$lines[] = str_repeat('-', 40);
$lines[] = 'Действие: отпишите этот email вручную в панели EmailSender / SMTP.bz.';
$lines[] = 'Отправлено: ' . date('d.m.Y H:i');
$lines[] = 'Ссылка: ' . $page;

$body = implode("\n", $lines);

$result = smtp_send_mail($to, $subject, $body);

if ($result['ok']) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'smtp_failed', 'debug' => $result['error'] ?? '']);
}
