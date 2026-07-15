<?php
/**
 * EZ Finance — единый обработчик всех форм сайта.
 * Отправляет письма через SMTP настоящего почтового ящика (а не через mail()),
 * чтобы письма не попадали в спам — у ящика уже есть законные SPF/DKIM.
 */

header('Content-Type: application/json; charset=utf-8');

// ==== НАСТРОЙКИ ПОЧТЫ — ЗАПОЛНИТЕ ПЕРЕД ЗАГРУЗКОЙ ====
// Почта на Яндексе. Логин и пароль — от ящика info@ezfinance.ru.
// Если в Яндекс.Почте включена двухфакторная аутентификация — нужен
// не обычный пароль, а ПАРОЛЬ ПРИЛОЖЕНИЯ (создаётся в настройках
// безопасности Яндекс ID: id.yandex.ru -> Пароли и авторизация -> Пароли приложений).
define('SMTP_HOST', 'smtp.yandex.ru');
define('SMTP_PORT', 465); // порт с прямым SSL — работает быстрее и стабильнее, чем 587
define('SMTP_USER', 'info@ezfinance.ru');
define('SMTP_PASS', 'ВАШ_ПАРОЛЬ_ОТ_ПОЧТЫ'); // <-- замените на реальный пароль (или пароль приложения)

$to       = 'info@ezfinance.ru'; // куда присылать все заявки
$fromName = 'EZ Finance Site';
// ========================================================

// ---------- Простой SMTP-клиент без внешних библиотек ----------
function smtp_send_mail($to, $subject, $body, $replyTo = null) {
    $host = SMTP_HOST;
    $port = SMTP_PORT;
    $user = SMTP_USER;
    $pass = SMTP_PASS;
    $fromEmail = SMTP_USER;
    $fromName  = 'EZ Finance Site';

    // Порт 465 = сразу SSL-соединение, без отдельного шага STARTTLS
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

    $read(); // приветствие сервера

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
    if ($replyTo) {
        $headers .= "Reply-To: $replyTo\r\n";
    }
    $headers .= "Subject: $encodedSubject\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";

    // Экранируем строки, начинающиеся с точки (правило протокола SMTP)
    $bodyEscaped = preg_replace('/\n\./', "\n..", $body);

    $message = $headers . "\r\n" . $bodyEscaped . "\r\n.";
    $write($message);
    $resp = $read();

    $write('QUIT');
    fclose($socket);

    return ['ok' => (strpos($resp, '250') === 0), 'raw' => $resp];
}
// ---------- конец SMTP-клиента ----------

// Отвечаем только на POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

// Простая защита от ботов
if (!empty($_POST['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

$formLabels = [
    'audit_home'      => 'Заявка на аудит — Главная страница',
    'audit_materials' => 'Заявка на аудит — со страницы Материалы',
    'partner'         => 'Заявка в партнёрскую программу',
    'newsletter'      => 'Подписка на рассылку материалов',
    'article_request' => 'Запрос статьи — Материалы',
];

$type  = isset($_POST['form_type']) ? trim($_POST['form_type']) : '';
$label = $formLabels[$type] ?? 'Заявка с сайта EZ Finance (тип не определён)';

if (empty($_POST['consent'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'no_consent']);
    exit;
}

$name      = isset($_POST['name']) ? trim($_POST['name']) : '';
$company   = isset($_POST['company']) ? trim($_POST['company']) : '';
$phone     = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$email     = isset($_POST['email']) ? trim($_POST['email']) : '';
$article   = isset($_POST['article']) ? trim($_POST['article']) : '';
$marketing = !empty($_POST['marketing_consent']) ? 'Да' : 'Нет';

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'bad_email']);
    exit;
}

$subject = '[EZ Finance] ' . $label;
if ($article !== '') {
    $subject .= ' — ' . $article;
} elseif ($name !== '') {
    $subject .= ' — ' . $name;
}

$lines = [];
$lines[] = 'Новая заявка с сайта ezfinance.ru';
$lines[] = 'Тип формы: ' . $label;
$lines[] = str_repeat('-', 40);
if ($article !== '')  $lines[] = 'Запрошенная статья: ' . $article;
if ($name !== '')    $lines[] = 'Имя: ' . $name;
if ($company !== '') $lines[] = 'Компания: ' . $company;
if ($phone !== '')   $lines[] = 'Телефон: ' . $phone;
$lines[] = 'Email: ' . $email;
$lines[] = 'Согласие на получение рассылки: ' . $marketing;
$lines[] = str_repeat('-', 40);
$lines[] = 'Отправлено: ' . date('d.m.Y H:i');
$lines[] = 'Страница: ' . (isset($_POST['page_url']) ? trim($_POST['page_url']) : 'не указана');

$body = implode("\n", $lines);

$result = smtp_send_mail($to, $subject, $body, $email);

if ($result['ok']) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    // error записываем в тело ответа только для отладки; уберите 'debug' в бою при желании
    echo json_encode(['ok' => false, 'error' => 'smtp_failed', 'debug' => $result['error'] ?? '']);
}
