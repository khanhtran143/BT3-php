<?php
/**
 * schedule_handler.php — Xử lý: meta, schedule.
 */

function handleMeta(): void
{
    $session = requireAuth();
    sendJson(200, getDashboardMeta($session['teacherId']));
}

function handleSchedule(): void
{
    requireAuth();

    $weekStart = $_GET['weekStart'] ?? null;
    $teacherId = isset($_GET['teacherId']) ? (int)$_GET['teacherId'] : null;

    $normalizedWeekStart = normalizeWeekStart($weekStart);
    $weekEnd = addDays($normalizedWeekStart, 6);

    $db = getDB();

    if ($teacherId) {
        $stmt = $db->prepare(bookingSelectSQL() . "
            WHERE b.date BETWEEN ? AND ? AND t.id = ?
            ORDER BY b.date, b.start_time, b.room
        ");
        $stmt->execute([$normalizedWeekStart, $weekEnd, $teacherId]);
    } else {
        $stmt = $db->prepare(bookingSelectSQL() . "
            WHERE b.date BETWEEN ? AND ?
            ORDER BY b.date, b.start_time, b.room
        ");
        $stmt->execute([$normalizedWeekStart, $weekEnd]);
    }

    $bookings = $stmt->fetchAll();

    // Summary
    $teacherIds = array_unique(array_column($bookings, 'teacherId'));
    $roomNames = array_unique(array_column($bookings, 'room'));

    sendJson(200, [
        'weekStart' => $normalizedWeekStart,
        'weekEnd'   => $weekEnd,
        'teachers'  => listTeachers(),
        'rooms'     => listRooms(),
        'summary'   => [
            'totalBookings' => count($bookings),
            'totalTeachers' => count($teacherIds),
            'totalRooms'    => count($roomNames),
        ],
        'bookings'  => $bookings,
    ]);
}
