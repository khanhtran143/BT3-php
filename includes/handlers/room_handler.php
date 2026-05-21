<?php
/**
 * room_handler.php — CRUD phòng học (admin only).
 */

function handleListRooms(): void
{
    requireAdmin();
    sendJson(200, listAdminRooms());
}

function handleCreateRoom(): void
{
    requireAdmin();
    $body = getJsonBody();

    validateRequired($body, [['name', 'Cần nhập tên phòng.']]);

    $db = getDB();
    $stmt = $db->prepare("INSERT INTO rooms (name, capacity, status) VALUES (?, ?, ?)");
    $stmt->execute([
        trim($body['name']),
        (int)($body['capacity'] ?? 40),
        $body['status'] ?? 'available',
    ]);

    $newId = (int)$db->lastInsertId();
    $room = $db->prepare("SELECT id, name, capacity, status FROM rooms WHERE id = ?")->execute([$newId]);
    $stmt2 = $db->prepare("SELECT id, name, capacity, status FROM rooms WHERE id = ?");
    $stmt2->execute([$newId]);
    sendJson(201, $stmt2->fetch());
}

function handleUpdateRoom(int $id): void
{
    requireAdmin();
    $body = getJsonBody();

    $db = getDB();
    $current = $db->prepare("SELECT id, name FROM rooms WHERE id = ?");
    $current->execute([$id]);
    $currentRoom = $current->fetch();

    if (!$currentRoom) {
        throw new AppException('Không tìm thấy phòng học.', 404);
    }

    validateRequired($body, [['name', 'Cần nhập tên phòng.']]);

    $db->prepare("UPDATE rooms SET name = ?, capacity = ?, status = ? WHERE id = ?")
        ->execute([
            trim($body['name']),
            (int)($body['capacity'] ?? 40),
            $body['status'] ?? 'available',
            $id,
        ]);

    // Cascade room name change to bookings
    if ($currentRoom['name'] !== trim($body['name'])) {
        $db->prepare("UPDATE bookings SET room = ? WHERE room = ?")
            ->execute([trim($body['name']), $currentRoom['name']]);
    }

    $stmt = $db->prepare("SELECT id, name, capacity, status FROM rooms WHERE id = ?");
    $stmt->execute([$id]);
    sendJson(200, $stmt->fetch());
}

function handleDeleteRoom(int $id): void
{
    requireAdmin();
    $db = getDB();

    $room = $db->prepare("SELECT id, name FROM rooms WHERE id = ?");
    $room->execute([$id]);
    $roomData = $room->fetch();

    if (!$roomData) {
        throw new AppException('Không tìm thấy phòng học.', 404);
    }

    $usage = $db->prepare("SELECT COUNT(*) FROM bookings WHERE room = ?");
    $usage->execute([$roomData['name']]);
    if ((int)$usage->fetchColumn() > 0) {
        throw new AppException('Phòng đang có lịch sử dụng, không thể xóa.', 400);
    }

    $db->prepare('DELETE FROM rooms WHERE id = ?')->execute([$id]);
    sendJson(200, ['success' => true]);
}
