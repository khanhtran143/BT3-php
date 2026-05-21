<?php
/**
 * router.php — Router cho PHP built-in server (php -S).
 *
 * Chạy: php -S localhost:8080 router.php
 *
 * - /api.php?action=xxx  → xử lý API
 * - /                    → public/index.html
 * - /admin.html          → public/admin.html
 * - /print.html          → public/print.html
 * - /css/*, /js/*        → static files từ public/
 */

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// API requests
if ($uri === '/api.php' || str_starts_with($uri, '/api.php')) {
    require __DIR__ . '/api.php';
    return true;
}

// Map root to index.html
if ($uri === '/' || $uri === '') {
    $uri = '/index.html';
}

// Serve static files from public/
$filePath = __DIR__ . '/public' . $uri;
if (is_file($filePath)) {
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimeTypes = [
        'html' => 'text/html; charset=utf-8',
        'css'  => 'text/css; charset=utf-8',
        'js'   => 'application/javascript; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'png'  => 'image/png',
        'svg'  => 'image/svg+xml',
    ];
    header('Content-Type: ' . ($mimeTypes[$ext] ?? 'application/octet-stream'));
    readfile($filePath);
    return true;
}

// 404
http_response_code(404);
echo 'Không tìm thấy tài nguyên.';
return true;
