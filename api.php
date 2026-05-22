<?php
/**
 * api.php — Entry point duy nhất cho mọi API request.
 *
 * URL: api.php?action=session
 *       api.php?action=auth/login (POST)
 *       api.php?action=admin/teachers&id=5 (PUT/DELETE)
 *       ...
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/handlers/auth_handler.php';
require_once __DIR__ . '/includes/handlers/schedule_handler.php';
require_once __DIR__ . '/includes/handlers/booking_handler.php';
require_once __DIR__ . '/includes/handlers/teacher_handler.php';
require_once __DIR__ . '/includes/handlers/room_handler.php';
require_once __DIR__ . '/includes/handlers/subject_handler.php';
require_once __DIR__ . '/includes/handlers/student_handler.php';

// Khởi tạo database (tạo bảng + seed nếu chưa có)
initializeDatabase();

// Lấy thông tin request
$action = $_GET['action'] ?? '';
$method = getRequestMethod();
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    // ─── Auth ────────────────────────────────────────
    if ($action === 'session' && $method === 'GET') {
        handleSession();
    }
    if ($action === 'auth/login' && $method === 'POST') {
        handleLogin();
    }
    if ($action === 'auth/logout' && $method === 'POST') {
        handleLogout();
    }

    // ─── User: Meta & Schedule ───────────────────────
    if ($action === 'meta' && $method === 'GET') {
        handleMeta();
    }
    if ($action === 'schedule' && $method === 'GET') {
        handleSchedule();
    }

    // ─── User: Bookings ──────────────────────────────
    if ($action === 'bookings' && $method === 'POST') {
        handleUserCreateBooking();
    }
    if ($action === 'bookings' && $method === 'DELETE' && $id) {
        handleUserDeleteBooking($id);
    }

    // ─── Admin: Dashboard ────────────────────────────
    if ($action === 'admin/dashboard' && $method === 'GET') {
        requireAdmin();
        sendJson(200, getAdminDashboard());
    }
    if ($action === 'admin/meta' && $method === 'GET') {
        $session = requireAdmin();
        sendJson(200, [
            'currentAdmin' => $session['teacher'],
            'teachers'     => listTeachers(),
            'rooms'        => listAdminRooms(),
            'roomNames'    => getDashboardMeta($session['teacherId'])['rooms'],
            'subjects'     => listSubjects(),
            'students'     => listStudents(),
        ]);
    }

    // ─── Admin: Teachers ─────────────────────────────
    if ($action === 'admin/teachers' && $method === 'GET') {
        handleListTeachers();
    }
    if ($action === 'admin/teachers' && $method === 'POST') {
        handleCreateTeacher();
    }
    if ($action === 'admin/teachers' && ($method === 'PUT' || $method === 'PATCH') && $id) {
        handleUpdateTeacher($id);
    }
    if ($action === 'admin/teachers' && $method === 'DELETE' && $id) {
        handleDeleteTeacher($id);
    }

    // ─── Admin: Bookings ─────────────────────────────
    if ($action === 'admin/bookings' && $method === 'GET') {
        handleAdminListBookings();
    }
    if ($action === 'admin/bookings' && $method === 'POST') {
        handleAdminCreateBooking();
    }
    if ($action === 'admin/bookings' && ($method === 'PUT' || $method === 'PATCH') && $id) {
        handleAdminUpdateBooking($id);
    }
    if ($action === 'admin/bookings' && $method === 'DELETE' && $id) {
        handleAdminDeleteBooking($id);
    }

    // ─── Admin: Rooms ────────────────────────────────
    if ($action === 'admin/rooms' && $method === 'GET') {
        handleListRooms();
    }
    if ($action === 'admin/rooms' && $method === 'POST') {
        handleCreateRoom();
    }
    if ($action === 'admin/rooms' && ($method === 'PUT' || $method === 'PATCH') && $id) {
        handleUpdateRoom($id);
    }
    if ($action === 'admin/rooms' && $method === 'DELETE' && $id) {
        handleDeleteRoom($id);
    }

    // ─── Admin: Subjects ─────────────────────────────
    if ($action === 'admin/subjects' && $method === 'GET') {
        handleListSubjects();
    }
    if ($action === 'admin/subjects' && $method === 'POST') {
        handleCreateSubject();
    }
    if ($action === 'admin/subjects' && ($method === 'PUT' || $method === 'PATCH') && $id) {
        handleUpdateSubject($id);
    }
    if ($action === 'admin/subjects' && $method === 'DELETE' && $id) {
        handleDeleteSubject($id);
    }

    // ─── Admin: Students ─────────────────────────────
    if ($action === 'admin/students' && $method === 'GET') {
        handleListStudents();
    }
    if ($action === 'admin/students' && $method === 'POST') {
        handleCreateStudent();
    }
    if ($action === 'admin/students' && ($method === 'PUT' || $method === 'PATCH') && $id) {
        handleUpdateStudent($id);
    }
    if ($action === 'admin/students' && $method === 'DELETE' && $id) {
        handleDeleteStudent($id);
    }

    // ─── 404 ─────────────────────────────────────────
    sendJson(404, ['error' => 'API không tồn tại.']);

} catch (AppException $e) {
    sendJson($e->statusCode, ['error' => $e->getMessage()]);
} catch (PDOException $e) {
    // Handle SQLite and MySQL UNIQUE/Duplicate constraint violations nicely
    if (str_contains($e->getMessage(), 'UNIQUE constraint failed') || str_contains($e->getMessage(), 'Duplicate entry') || $e->getCode() == '23000') {
        sendJson(409, ['error' => 'Dữ liệu đã tồn tại (trùng lặp).']);
    }
    sendJson(500, ['error' => 'Lỗi cơ sở dữ liệu: ' . $e->getMessage()]);
} catch (Throwable $e) {
    sendJson(500, ['error' => 'Có lỗi xảy ra: ' . $e->getMessage()]);
}
