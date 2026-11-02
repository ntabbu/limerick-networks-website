<?php
// Saves the resume on this server, emails the application (with resume attached) to HR,
// and returns the resume link for the WhatsApp message. Used by join-limerick.html.
header('Content-Type: application/json; charset=utf-8');

$EMAIL_TO   = 'poojap@limerick.co.in';   // HR mailbox ('' = email OFF)
$EMAIL_FROM = 'noreply@limerick.co.in';  // create this mailbox in Hostinger (Emails) for reliable delivery

function fail($code, $msg) { http_response_code($code); echo json_encode(['success' => false, 'message' => $msg]); exit; }
function clean($v) { return trim(str_replace(["\r", "\n"], ' ', strip_tags((string)$v))); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'POST only');
if (!empty($_POST['website'])) { echo json_encode(['success' => true, 'url' => '']); exit; } // honeypot

$f = [];
foreach (['role', 'name', 'phone', 'email', 'exp', 'loc', 'ctc', 'notice'] as $k) $f[$k] = clean($_POST[$k] ?? '');
$f['msg'] = trim(strip_tags((string)($_POST['msg'] ?? '')));
if ($f['name'] === '') fail(400, 'Name missing');

// ---- resume (optional) ----
$url = ''; $path = ''; $stored = '';
if (!empty($_FILES['attachment']) && $_FILES['attachment']['error'] !== UPLOAD_ERR_NO_FILE) {
  $file = $_FILES['attachment'];
  if ($file['error'] !== UPLOAD_ERR_OK) fail(400, 'Upload error ' . $file['error']);
  if ($file['size'] > 5 * 1024 * 1024) fail(400, 'File larger than 5 MB');
  $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
  if (!in_array($ext, ['pdf', 'doc', 'docx'], true)) fail(400, 'Only PDF/DOC/DOCX allowed');

  $dir = __DIR__ . '/resumes';
  if (!is_dir($dir) && !mkdir($dir, 0755, true)) fail(500, 'Cannot create resumes folder');
  if (!file_exists($dir . '/index.html')) file_put_contents($dir . '/index.html', '');
  if (!file_exists($dir . '/.htaccess')) file_put_contents($dir . '/.htaccess', "Options -Indexes\n<FilesMatch \"\\.(php|phtml|phar|html?|js|cgi|pl|py|sh)$\">\n  Require all denied\n</FilesMatch>\n");

  $who = trim(substr(preg_replace('/[^A-Za-z0-9]+/', '-', $f['name']), 0, 30), '-') ?: 'applicant';
  $stored = date('Ymd-His') . '-' . $who . '-' . bin2hex(random_bytes(6)) . '.' . $ext; // unguessable
  $path = $dir . '/' . $stored;
  if (!move_uploaded_file($file['tmp_name'], $path)) fail(500, 'Could not save file');

  $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
  $url = ($https ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\') . '/resumes/' . $stored;
}

// ---- email to HR (with resume attached) ----
$mailed = false;
if ($EMAIL_TO !== '') {
  $subject = 'Job Application - ' . $f['role'] . ' - ' . $f['name'];
  $body  = "New job application received from the Limerick website\r\n\r\n";
  $body .= "Role: {$f['role']}\r\nName: {$f['name']}\r\nMobile: {$f['phone']}\r\nEmail: " . ($f['email'] ?: '-') . "\r\n";
  $body .= "Experience: " . ($f['exp'] ?: '-') . "\r\nLocation: " . ($f['loc'] ?: '-') . "\r\n";
  $body .= "Current salary: " . ($f['ctc'] ?: '-') . "\r\nNotice period: " . ($f['notice'] ?: '-') . "\r\nMessage: " . ($f['msg'] ?: '-') . "\r\n";
  if ($url) $body .= "Resume link: $url\r\n";

  $b = md5(uniqid('', true));
  $h = "From: Limerick Careers <$EMAIL_FROM>\r\n";
  if (filter_var($f['email'], FILTER_VALIDATE_EMAIL)) $h .= "Reply-To: {$f['email']}\r\n";
  $h .= "MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"$b\"\r\n";
  $m = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n$body\r\n";
  if ($path) {
    $m .= "--$b\r\nContent-Type: application/octet-stream; name=\"$stored\"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"$stored\"\r\n\r\n";
    $m .= chunk_split(base64_encode(file_get_contents($path))) . "\r\n";
  }
  $m .= "--$b--";
  $mailed = @mail($EMAIL_TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $m, $h, '-f' . $EMAIL_FROM);
}

echo json_encode(['success' => true, 'url' => $url, 'mailed' => $mailed]);
