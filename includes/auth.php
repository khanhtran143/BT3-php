<?php
/**
 * auth.php — Quản lý session (PHP native sessions).
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

define('SESSION_DURATION', 12 * 60 * 60); // 12 giờ

/**
 * Khởi tạo session PHP.
 */
function initSession(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => SESSION_DURATION,
            'path'     => '/',
            'httponly'  => true,
            'samesite'  => 'Lax',
        ]);
        session_start();
    }
}

/**
 * Lấy session hiện tại, null nếu chưa đăng nhập hoặc hết hạn.
 */
function getSession(): ?array
{
    initSession();

    if (empty($_SESSION['teacherId']) || empty($_SESSION['expiresAt'])) {
        return null;
    }

    if ($_SESSION['expiresAt'] <= time()) {
        session_destroy();
        return null;
    }

    // Gia hạn session
    $_SESSION['expiresAt'] = time() + SESSION_DURATION;

    return [
        'teacherId' => (int)$_SESSION['teacherId'],
    ];
}

/**
 * Tạo session mới cho teacher.
 */
function createSession(int $teacherId): void
{
    initSession();
    session_regenerate_id(true);
    $_SESSION['teacherId'] = $teacherId;
    $_SESSION['expiresAt'] = time() + SESSION_DURATION;
}

/**
 * Xóa session (đăng xuất).
 */
function destroySession(): void
{
    initSession();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }
    session_destroy();
}

/**
 * Yêu cầu đăng nhập — throw nếu chưa auth.
 */
function requireAuth(): array
{
    $session = getSession();
    if (!$session) {
        throw new AppException('Bạn cần đăng nhập để sử dụng chức năng này.', 401);
    }
    return $session;
}

/**
 * Yêu cầu quyền admin.
 */
function requireAdmin(): array
{
    $session = requireAuth();
    $teacher = getTeacherById($session['teacherId']);

    if (!$teacher || !$teacher['isAdmin']) {
        throw new AppException('Bạn cần quyền admin để truy cập chức năng này.', 403);
    }

    return [
        'teacherId' => $session['teacherId'],
        'teacher'   => $teacher,
    ];
}
