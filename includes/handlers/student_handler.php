<?php
/**
 * student_handler.php — CRUD sinh viên (admin only).
 */

function handleListStudents(): void
{
    requireAdmin();
    sendJson(200, listStudents());
}

function handleCreateStudent(): void
{
    requireAdmin();
    $body = getJsonBody();

    validateRequired($body, [
        ['studentCode', 'Cần nhập mã sinh viên.'],
        ['fullName', 'Cần nhập tên sinh viên.'],
        ['email', 'Cần nhập email.'],
        ['className', 'Cần nhập lớp.'],
    ]);

    $db = getDB();
    $stmt = $db->prepare("
        INSERT INTO students (student_code, full_name, email, class_name, status)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        trim($body['studentCode']),
        trim($body['fullName']),
        trim($body['email']),
        trim($body['className']),
        $body['status'] ?? 'active',
    ]);

    $newId = (int)$db->lastInsertId();
    $students = listStudents();
    $result = null;
    foreach ($students as $s) {
        if ((int)$s['id'] === $newId) {
            $result = $s;
            break;
        }
    }
    sendJson(201, $result);
}

function handleUpdateStudent(int $id): void
{
    requireAdmin();
    $body = getJsonBody();

    validateRequired($body, [
        ['studentCode', 'Cần nhập mã sinh viên.'],
        ['fullName', 'Cần nhập tên sinh viên.'],
        ['email', 'Cần nhập email.'],
        ['className', 'Cần nhập lớp.'],
    ]);

    $db = getDB();
    $current = $db->prepare("SELECT id FROM students WHERE id = ?");
    $current->execute([$id]);
    if (!$current->fetch()) {
        throw new AppException('Không tìm thấy sinh viên.', 404);
    }

    $db->prepare("
        UPDATE students SET student_code = ?, full_name = ?, email = ?, class_name = ?, status = ?
        WHERE id = ?
    ")->execute([
        trim($body['studentCode']),
        trim($body['fullName']),
        trim($body['email']),
        trim($body['className']),
        $body['status'] ?? 'active',
        $id,
    ]);

    $students = listStudents();
    $result = null;
    foreach ($students as $s) {
        if ((int)$s['id'] === $id) {
            $result = $s;
            break;
        }
    }
    sendJson(200, $result);
}

function handleDeleteStudent(int $id): void
{
    requireAdmin();
    $db = getDB();

    $stmt = $db->prepare('DELETE FROM students WHERE id = ?');
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        throw new AppException('Không tìm thấy sinh viên.', 404);
    }

    sendJson(200, ['success' => true]);
}
