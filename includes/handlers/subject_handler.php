<?php
/**
 * subject_handler.php — CRUD môn học (admin only).
 */

function handleListSubjects(): void
{
    requireAdmin();
    sendJson(200, listSubjects());
}

function handleCreateSubject(): void
{
    requireAdmin();
    $body = getJsonBody();

    validateRequired($body, [
        ['code', 'Cần nhập mã môn.'],
        ['name', 'Cần nhập tên môn.'],
    ]);

    $db = getDB();
    $stmt = $db->prepare("INSERT INTO subjects (code, name) VALUES (?, ?)");
    $stmt->execute([trim($body['code']), trim($body['name'])]);

    $newId = (int)$db->lastInsertId();
    $result = $db->prepare("SELECT id, code, name FROM subjects WHERE id = ?");
    $result->execute([$newId]);
    sendJson(201, $result->fetch());
}

function handleUpdateSubject(int $id): void
{
    requireAdmin();
    $body = getJsonBody();

    validateRequired($body, [
        ['code', 'Cần nhập mã môn.'],
        ['name', 'Cần nhập tên môn.'],
    ]);

    $db = getDB();
    $current = $db->prepare("SELECT id, code FROM subjects WHERE id = ?");
    $current->execute([$id]);
    if (!$current->fetch()) {
        throw new AppException('Không tìm thấy môn học.', 404);
    }

    $db->prepare("UPDATE subjects SET code = ?, name = ? WHERE id = ?")
        ->execute([trim($body['code']), trim($body['name']), $id]);

    $result = $db->prepare("SELECT id, code, name FROM subjects WHERE id = ?");
    $result->execute([$id]);
    sendJson(200, $result->fetch());
}

function handleDeleteSubject(int $id): void
{
    requireAdmin();
    $db = getDB();

    $current = $db->prepare("SELECT id, code FROM subjects WHERE id = ?");
    $current->execute([$id]);
    $subject = $current->fetch();

    if (!$subject) {
        throw new AppException('Không tìm thấy môn học.', 404);
    }

    $usage = $db->prepare("SELECT COUNT(*) FROM bookings WHERE subject_code = ?");
    $usage->execute([$subject['code']]);
    if ((int)$usage->fetchColumn() > 0) {
        throw new AppException('Môn học đang có lịch thực hành, không thể xóa.', 400);
    }

    $db->prepare('DELETE FROM subjects WHERE id = ?')->execute([$id]);
    sendJson(200, ['success' => true]);
}
