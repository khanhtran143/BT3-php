<?php
/**
 * booking_handler.php — CRUD bookings (user + admin).
 */

function validateBooking(array $payload): void
{
    validateRequired($payload, [
        ['teacherId', 'Cần chọn giảng viên.'],
        ['subjectCode', 'Cần nhập mã môn học.'],
        ['subjectName', 'Cần nhập tên môn học.'],
        ['classGroup', 'Cần nhập nhóm thực hành.'],
        ['room', 'Cần chọn phòng máy.'],
        ['practiceTopic', 'Cần nhập nội dung thực hành.'],
        ['date', 'Cần chọn ngày học.'],
        ['startTime', 'Cần chọn giờ bắt đầu.'],
        ['endTime', 'Cần chọn giờ kết thúc.'],
    ]);

    ensureValidDate($payload['date']);
    ensureValidTime($payload['startTime']);
    ensureValidTime($payload['endTime']);

    if ($payload['startTime'] >= $payload['endTime']) {
        throw new AppException('Giờ kết thúc phải lớn hơn giờ bắt đầu.', 400);
    }

    $teacher = getDB()->prepare('SELECT id FROM teachers WHERE id = ?');
    $teacher->execute([(int)$payload['teacherId']]);
    if (!$teacher->fetch()) {
        throw new AppException('Giảng viên không tồn tại.', 404);
    }
}

function assertNoConflict(array $payload, ?int $excludeBookingId = null): void
{
    $db = getDB();

    // Teacher conflict
    $sql = "SELECT id FROM bookings WHERE teacher_id = ? AND date = ? AND start_time < ? AND end_time > ?";
    $params = [(int)$payload['teacherId'], $payload['date'], $payload['endTime'], $payload['startTime']];
    if ($excludeBookingId) {
        $sql .= " AND id <> ?";
        $params[] = $excludeBookingId;
    }
    $sql .= " LIMIT 1";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    if ($stmt->fetch()) {
        throw new AppException('Giảng viên đã có lịch trong khoảng thời gian này.', 409);
    }

    // Room conflict
    $sql = "SELECT id FROM bookings WHERE room = ? AND date = ? AND start_time < ? AND end_time > ?";
    $params = [$payload['room'], $payload['date'], $payload['endTime'], $payload['startTime']];
    if ($excludeBookingId) {
        $sql .= " AND id <> ?";
        $params[] = $excludeBookingId;
    }
    $sql .= " LIMIT 1";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    if ($stmt->fetch()) {
        throw new AppException('Phòng máy đã được đăng ký trong khoảng thời gian này.', 409);
    }
}

function getBookingById(int $bookingId): ?array
{
    $stmt = getDB()->prepare(bookingSelectSQL() . " WHERE b.id = ?");
    $stmt->execute([$bookingId]);
    return $stmt->fetch() ?: null;
}

function insertSubjectIfMissing(string $code, string $name): void
{
    getDB()->prepare("INSERT INTO subjects (code, name) VALUES (?, ?) ON CONFLICT(code) DO UPDATE SET name = excluded.name")
        ->execute([trim($code), trim($name)]);
}

function doCreateBooking(array $payload): array
{
    validateBooking($payload);
    assertNoConflict($payload);

    $normalizedWeekStart = normalizeWeekStart($payload['date']);
    $db = getDB();

    $stmt = $db->prepare("
        INSERT INTO bookings (teacher_id, subject_code, subject_name, class_group, room, practice_topic, week_start, date, start_time, end_time, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        (int)$payload['teacherId'],
        trim($payload['subjectCode']),
        trim($payload['subjectName']),
        trim($payload['classGroup']),
        trim($payload['room']),
        trim($payload['practiceTopic']),
        $normalizedWeekStart,
        $payload['date'],
        $payload['startTime'],
        $payload['endTime'],
        trim($payload['note'] ?? ''),
    ]);

    $newId = (int)$db->lastInsertId();
    insertSubjectIfMissing($payload['subjectCode'], $payload['subjectName']);
    return getBookingById($newId);
}

function doUpdateBooking(int $bookingId, array $payload): array
{
    $current = getBookingById($bookingId);
    if (!$current) {
        throw new AppException('Không tìm thấy lịch thực hành.', 404);
    }

    validateBooking($payload);
    assertNoConflict($payload, $bookingId);

    $db = getDB();
    $db->prepare("
        UPDATE bookings SET
            teacher_id = ?, subject_code = ?, subject_name = ?, class_group = ?,
            room = ?, practice_topic = ?, week_start = ?, date = ?,
            start_time = ?, end_time = ?, note = ?
        WHERE id = ?
    ")->execute([
        (int)$payload['teacherId'],
        trim($payload['subjectCode']),
        trim($payload['subjectName']),
        trim($payload['classGroup']),
        trim($payload['room']),
        trim($payload['practiceTopic']),
        normalizeWeekStart($payload['date']),
        $payload['date'],
        $payload['startTime'],
        $payload['endTime'],
        trim($payload['note'] ?? ''),
        $bookingId,
    ]);

    insertSubjectIfMissing($payload['subjectCode'], $payload['subjectName']);
    return getBookingById($bookingId);
}

function doDeleteBooking(int $bookingId, ?int $actorTeacherId = null): void
{
    $db = getDB();
    $stmt = $db->prepare("SELECT id, teacher_id AS teacherId FROM bookings WHERE id = ?");
    $stmt->execute([$bookingId]);
    $booking = $stmt->fetch();

    if (!$booking) {
        throw new AppException('Không tìm thấy lịch đăng ký.', 404);
    }

    if ($actorTeacherId && (int)$actorTeacherId !== (int)$booking['teacherId']) {
        throw new AppException('Bạn chỉ có thể xóa lịch do chính mình đăng ký.', 403);
    }

    $db->prepare('DELETE FROM bookings WHERE id = ?')->execute([$bookingId]);
}

// ─── User booking endpoints ──────────────────────────────

function handleUserCreateBooking(): void
{
    $session = requireAuth();
    $body = getJsonBody();
    $body['teacherId'] = $session['teacherId'];
    $booking = doCreateBooking($body);
    sendJson(201, $booking);
}

function handleUserDeleteBooking(int $id): void
{
    $session = requireAuth();
    doDeleteBooking($id, $session['teacherId']);
    sendJson(200, ['success' => true]);
}

// ─── Admin booking endpoints ─────────────────────────────

function handleAdminListBookings(): void
{
    requireAdmin();

    $db = getDB();
    $conditions = [];
    $params = [];

    if (!empty($_GET['date'])) {
        $conditions[] = 'b.date = ?';
        $params[] = $_GET['date'];
    }
    if (!empty($_GET['teacherId'])) {
        $conditions[] = 'b.teacher_id = ?';
        $params[] = (int)$_GET['teacherId'];
    }
    if (!empty($_GET['room'])) {
        $conditions[] = 'b.room = ?';
        $params[] = $_GET['room'];
    }

    $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
    $stmt = $db->prepare(bookingSelectSQL() . " $where ORDER BY b.date DESC, b.start_time, b.room");
    $stmt->execute($params);
    sendJson(200, $stmt->fetchAll());
}

function handleAdminCreateBooking(): void
{
    requireAdmin();
    $booking = doCreateBooking(getJsonBody());
    sendJson(201, $booking);
}

function handleAdminUpdateBooking(int $id): void
{
    requireAdmin();
    $booking = doUpdateBooking($id, getJsonBody());
    sendJson(200, $booking);
}

function handleAdminDeleteBooking(int $id): void
{
    requireAdmin();
    doDeleteBooking($id);
    sendJson(200, ['success' => true]);
}
