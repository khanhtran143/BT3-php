<?php
/**
 * teacher_handler.php — CRUD giảng viên (admin only).
 */

function handleListTeachers(): void
{
    requireAdmin();
    sendJson(200, listTeachers());
}

function handleCreateTeacher(): void
{
    requireAdmin();
    $body = getJsonBody();

    validateRequired($body, [
        ['fullName', 'Cần nhập tên giảng viên.'],
        ['department', 'Cần nhập bộ môn.'],
        ['email', 'Cần nhập email.'],
        ['phone', 'Cần nhập số điện thoại.'],
    ]);

    $db = getDB();
    $password = password_hash($body['password'] ?? DEFAULT_PASSWORD, PASSWORD_BCRYPT);

    $stmt = $db->prepare("
        INSERT INTO teachers (full_name, department, email, phone, is_admin, password_hash)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        trim($body['fullName']),
        trim($body['department']),
        trim($body['email']),
        trim($body['phone']),
        !empty($body['isAdmin']) && $body['isAdmin'] !== 'false' ? 1 : 0,
        $password,
    ]);

    $newId = (int)$db->lastInsertId();
    sendJson(201, getTeacherById($newId));
}

function handleUpdateTeacher(int $id): void
{
    requireAdmin();
    $body = getJsonBody();

    $teacher = getTeacherById($id);
    if (!$teacher) {
        throw new AppException('Không tìm thấy giảng viên.', 404);
    }

    validateRequired($body, [
        ['fullName', 'Cần nhập tên giảng viên.'],
        ['department', 'Cần nhập bộ môn.'],
        ['email', 'Cần nhập email.'],
        ['phone', 'Cần nhập số điện thoại.'],
    ]);

    $db = getDB();
    $db->prepare("
        UPDATE teachers SET full_name = ?, department = ?, email = ?, phone = ?, is_admin = ?
        WHERE id = ?
    ")->execute([
        trim($body['fullName']),
        trim($body['department']),
        trim($body['email']),
        trim($body['phone']),
        !empty($body['isAdmin']) && $body['isAdmin'] !== 'false' ? 1 : 0,
        $id,
    ]);

    if (!empty($body['password'])) {
        $hash = password_hash($body['password'], PASSWORD_BCRYPT);
        $db->prepare("UPDATE teachers SET password_hash = ? WHERE id = ?")->execute([$hash, $id]);
    }

    sendJson(200, getTeacherById($id));
}

function handleDeleteTeacher(int $id): void
{
    requireAdmin();
    $teacher = getTeacherById($id);
    if (!$teacher) {
        throw new AppException('Không tìm thấy giảng viên.', 404);
    }

    if ($teacher['isAdmin']) {
        $count = (int)getDB()->query("SELECT COUNT(*) FROM teachers WHERE is_admin = 1")->fetchColumn();
        if ($count <= 1) {
            throw new AppException('Không thể xóa admin cuối cùng của hệ thống.', 400);
        }
    }

    getDB()->prepare('DELETE FROM teachers WHERE id = ?')->execute([$id]);
    sendJson(200, ['success' => true]);
}
