<?php
/**
 * db.php — Kết nối PDO SQLite, khởi tạo schema, seed dữ liệu mẫu.
 */

require_once __DIR__ . '/helpers.php';

define('DATA_DIR', __DIR__ . '/../data');
define('DB_PATH', DATA_DIR . '/scheduler.db');
define('DEFAULT_PASSWORD', 'ptit123');

/**
 * Lấy singleton PDO instance.
 */
function getDB(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        if (!is_dir(DATA_DIR)) {
            mkdir(DATA_DIR, 0755, true);
        }
        $pdo = new PDO('sqlite:' . DB_PATH, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA journal_mode = WAL');
    }
    return $pdo;
}

/**
 * Khởi tạo database: schema + seed data.
 */
function initializeDatabase(): void
{
    $db = getDB();
    ensureSchema($db);
    seedTeachers($db);
    seedAdminUser($db);
    seedTeacherPasswords($db);
    seedRooms($db);
    seedSubjects($db);
    seedStudents($db);
    seedBookings($db);
}

// ─── Schema ──────────────────────────────────────────────

function ensureSchema(PDO $db): void
{
    $db->exec("
        CREATE TABLE IF NOT EXISTS teachers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            department TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            password_hash TEXT DEFAULT '',
            is_admin INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            capacity INTEGER NOT NULL DEFAULT 40,
            status TEXT NOT NULL DEFAULT 'available'
        );

        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_code TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            class_name TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active'
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            subject_code TEXT NOT NULL,
            subject_name TEXT NOT NULL,
            class_group TEXT NOT NULL,
            room TEXT NOT NULL,
            practice_topic TEXT NOT NULL,
            week_start TEXT NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            note TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
        );
    ");
}

// ─── Seed functions ──────────────────────────────────────

function seedTeachers(PDO $db): void
{
    $count = (int)$db->query('SELECT COUNT(*) FROM teachers')->fetchColumn();
    if ($count > 0) return;

    $stmt = $db->prepare('INSERT INTO teachers (full_name, department, email, phone, is_admin) VALUES (?, ?, ?, ?, ?)');
    $teachers = [
        ['Nguyễn Quang Hưng', 'Khoa Công nghệ thông tin', 'hung.nq@ptit.edu.vn', '0901001001', 0],
        ['Đào Ngọc Phong', 'Khoa Công nghệ thông tin', 'phong.dn@ptit.edu.vn', '0901001002', 0],
        ['Bùi Văn Công', 'Bộ môn Lập trình Python', 'cong.vbv@ptit.edu.vn', '0901001003', 0],
        ['Võ Ngọc Bích Uyên', 'Bộ môn Trí tuệ nhân tạo', 'uyen.vnb@ptit.edu.vn', '0901001004', 0],
        ['Đỗ Thị Liên', 'Bộ môn Ngôn ngữ lập trình', 'lien.dt@ptit.edu.vn', '0901001005', 0],
        ['Quản trị viên', 'Phòng đào tạo', 'admin@ptit.edu.vn', '0901001999', 1],
    ];
    foreach ($teachers as $t) {
        $stmt->execute($t);
    }
}

function seedAdminUser(PDO $db): void
{
    $admin = $db->prepare('SELECT id FROM teachers WHERE lower(email) = lower(?)');
    $admin->execute(['admin@ptit.edu.vn']);
    $row = $admin->fetch();
    if (!$row) {
        $db->prepare('INSERT INTO teachers (full_name, department, email, phone, is_admin) VALUES (?, ?, ?, ?, 1)')
            ->execute(['Quản trị viên', 'Phòng đào tạo', 'admin@ptit.edu.vn', '0901001999']);
    } else {
        $db->prepare('UPDATE teachers SET is_admin = 1 WHERE id = ?')->execute([$row['id']]);
    }
}

function seedTeacherPasswords(PDO $db): void
{
    $teachers = $db->query('SELECT id, password_hash FROM teachers')->fetchAll();
    $stmt = $db->prepare('UPDATE teachers SET password_hash = ? WHERE id = ?');
    foreach ($teachers as $teacher) {
        if (!empty($teacher['password_hash'])) continue;
        $hash = password_hash(DEFAULT_PASSWORD, PASSWORD_BCRYPT);
        $stmt->execute([$hash, $teacher['id']]);
    }
}

function seedRooms(PDO $db): void
{
    $rooms = [
        ['Phòng Lab A1-201', 45, 'available'],
        ['Phòng Lab A2-204', 40, 'available'],
        ['Phòng Lab B1-305', 50, 'maintenance'],
        ['Phòng Lab C2-402', 42, 'available'],
    ];
    $stmt = $db->prepare('INSERT OR IGNORE INTO rooms (name, capacity, status) VALUES (?, ?, ?)');
    foreach ($rooms as $r) {
        $stmt->execute($r);
    }
}

function seedSubjects(PDO $db): void
{
    $subjects = [
        ['INT1434', 'Lập trình Web'],
        ['INT3162', 'Lập trình với Python'],
        ['INT1341', 'Nhập môn trí tuệ nhân tạo'],
        ['INT1340', 'Nhập môn công nghệ phần mềm'],
        ['INT1339', 'Ngôn ngữ lập trình C++'],
    ];
    $stmt = $db->prepare('INSERT OR IGNORE INTO subjects (code, name) VALUES (?, ?)');
    foreach ($subjects as $s) {
        $stmt->execute($s);
    }
}

function seedStudents(PDO $db): void
{
    $count = (int)$db->query('SELECT COUNT(*) FROM students')->fetchColumn();
    if ($count > 0) return;

    $stmt = $db->prepare('INSERT INTO students (student_code, full_name, email, class_name, status) VALUES (?, ?, ?, ?, ?)');
    $students = [
        ['B21DCCN001', 'Nguyễn Minh Anh', 'anh.nm21@stu.ptit.edu.vn', 'D21CQCN01-B', 'active'],
        ['B21DCCN108', 'Trần Bảo Long', 'long.tb21@stu.ptit.edu.vn', 'D21CQCN03-B', 'active'],
        ['B22DCCN077', 'Lê Hà Linh', 'linh.lh22@stu.ptit.edu.vn', 'D22CQCN02-B', 'active'],
    ];
    foreach ($students as $s) {
        $stmt->execute($s);
    }
}

function seedBookings(PDO $db): void
{
    $count = (int)$db->query('SELECT COUNT(*) FROM bookings')->fetchColumn();
    if ($count > 0) return;

    $weekStart = getMonday();
    $stmt = $db->prepare('
        INSERT INTO bookings (teacher_id, subject_code, subject_name, class_group, room, practice_topic, week_start, date, start_time, end_time, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    $bookings = [
        [1, 'INT1434', 'Lập trình Web', 'Nhóm 98', 'Phòng Lab A1-201', 'Hướng dẫn xây dựng giao diện dashboard', $weekStart, addDays($weekStart, 0), '07:00', '11:50', 'Mang theo file thiết kế giao diện.'],
        [3, 'INT3162', 'Lập trình với Python', 'Nhóm 04', 'Phòng Lab A2-204', 'Xử lý dữ liệu bằng pandas', $weekStart, addDays($weekStart, 1), '07:00', '08:50', 'Thực hành trên bộ dữ liệu mẫu.'],
        [4, 'INT1341', 'Nhập môn trí tuệ nhân tạo', 'Nhóm 04', 'Phòng Lab B1-305', 'Mô hình hóa bài toán phân loại', $weekStart, addDays($weekStart, 2), '09:00', '11:50', 'Ưu tiên nhóm đã đăng ký sớm.'],
        [1, 'INT1434', 'Lập trình Web', 'Nhóm 98', 'Phòng Lab C2-402', 'Thực hành Node.js và REST API', $weekStart, addDays($weekStart, 3), '07:00', '11:50', 'Sử dụng đề tài đăng ký lịch.'],
        [2, 'INT1340', 'Nhập môn công nghệ phần mềm', 'Nhóm 07', 'Phòng Lab A2-204', 'Viết user story và test case', $weekStart, addDays($weekStart, 1), '13:00', '15:50', 'Chuẩn bị biểu mẫu sprint.'],
        [5, 'INT1339', 'Ngôn ngữ lập trình C++', 'Nhóm 99', 'Phòng Lab B1-305', 'Thực hành class, object và file I/O', $weekStart, addDays($weekStart, 3), '13:00', '15:50', 'Giảng viên mang bộ bài tập mẫu.'],
        [5, 'INT1339', 'Ngôn ngữ lập trình C++', 'Nhóm 99', 'Phòng Lab C2-402', 'Thực hành con trỏ và cấp phát động', $weekStart, addDays($weekStart, 4), '13:00', '15:50', 'Tăng cường cho nhóm cần ôn tập.'],
    ];
    foreach ($bookings as $b) {
        $stmt->execute($b);
    }
}

// ─── Query helpers ───────────────────────────────────────

function teacherSelectSQL(): string
{
    return "SELECT id, full_name AS fullName, department, email, phone, is_admin AS isAdmin FROM teachers";
}

function mapTeacher(?array $row): ?array
{
    if (!$row) return null;
    $row['isAdmin'] = (bool)$row['isAdmin'];
    return $row;
}

function listTeachers(): array
{
    $rows = getDB()->query(teacherSelectSQL() . " ORDER BY full_name")->fetchAll();
    return array_map('mapTeacher', $rows);
}

function getTeacherById(int $id): ?array
{
    $stmt = getDB()->prepare(teacherSelectSQL() . " WHERE id = ?");
    $stmt->execute([$id]);
    return mapTeacher($stmt->fetch() ?: null);
}

function authenticateTeacher(?string $email, ?string $password): ?array
{
    $email = trim($email ?? '');
    if ($email === '') return null;

    $stmt = getDB()->prepare("SELECT id, full_name AS fullName, department, email, phone, is_admin AS isAdmin, password_hash AS passwordHash FROM teachers WHERE lower(email) = lower(?)");
    $stmt->execute([$email]);
    $teacher = $stmt->fetch();

    if (!$teacher || empty($teacher['passwordHash'])) return null;
    if (!password_verify($password ?? '', $teacher['passwordHash'])) return null;

    unset($teacher['passwordHash']);
    $teacher['isAdmin'] = (bool)$teacher['isAdmin'];
    return $teacher;
}

function listRooms(): array
{
    $roomRows = getDB()->query("SELECT name FROM rooms ORDER BY name")->fetchAll(PDO::FETCH_COLUMN);
    $bookingRooms = getDB()->query("SELECT DISTINCT room FROM bookings ORDER BY room")->fetchAll(PDO::FETCH_COLUMN);
    return array_values(array_unique(array_merge($roomRows, $bookingRooms)));
}

function listAdminRooms(): array
{
    return getDB()->query("SELECT id, name, capacity, status FROM rooms ORDER BY name")->fetchAll();
}

function listSubjects(): array
{
    return getDB()->query("SELECT id, code, name FROM subjects ORDER BY code")->fetchAll();
}

function listStudents(): array
{
    return getDB()->query("
        SELECT id, student_code AS studentCode, full_name AS fullName, email, class_name AS className, status
        FROM students ORDER BY student_code
    ")->fetchAll();
}

function bookingSelectSQL(): string
{
    return "
        SELECT
            b.id, b.subject_code AS subjectCode, b.subject_name AS subjectName,
            b.class_group AS classGroup, b.room, b.practice_topic AS practiceTopic,
            b.week_start AS weekStart, b.date, b.start_time AS startTime, b.end_time AS endTime,
            b.note, b.created_at AS createdAt,
            t.id AS teacherId, t.full_name AS teacherName, t.department, t.email, t.phone
        FROM bookings b
        INNER JOIN teachers t ON t.id = b.teacher_id
    ";
}

function getDashboardMeta(?int $currentTeacherId = null): array
{
    return [
        'teachers'        => listTeachers(),
        'rooms'           => listRooms(),
        'defaultWeekStart' => getMonday(),
        'currentTeacher'  => $currentTeacherId ? getTeacherById($currentTeacherId) : null,
        'defaultPassword' => DEFAULT_PASSWORD,
    ];
}

function getAdminDashboard(): array
{
    $db = getDB();
    $today = date('Y-m-d');
    $weekStart = getMonday();
    $weekEnd = addDays($weekStart, 6);

    $schedulesByDay = $db->prepare("SELECT date, COUNT(*) AS total FROM bookings WHERE date BETWEEN ? AND ? GROUP BY date ORDER BY date");
    $schedulesByDay->execute([$weekStart, $weekEnd]);

    $roomUsage = $db->query("SELECT room, COUNT(*) AS total FROM bookings GROUP BY room ORDER BY total DESC, room LIMIT 8")->fetchAll();

    $totals = [
        'teachers'      => (int)$db->query("SELECT COUNT(*) FROM teachers WHERE is_admin = 0")->fetchColumn(),
        'bookings'      => (int)$db->query("SELECT COUNT(*) FROM bookings")->fetchColumn(),
        'todayBookings' => (int)$db->prepare("SELECT COUNT(*) FROM bookings WHERE date = ?")->execute([$today]) ? (int)$db->prepare("SELECT COUNT(*) FROM bookings WHERE date = ?")->execute([$today]) : 0,
        'roomsInUse'    => 0,
        'rooms'         => (int)$db->query("SELECT COUNT(*) FROM rooms")->fetchColumn(),
        'subjects'      => (int)$db->query("SELECT COUNT(*) FROM subjects")->fetchColumn(),
        'students'      => (int)$db->query("SELECT COUNT(*) FROM students")->fetchColumn(),
    ];

    // Fix todayBookings and roomsInUse
    $stmtToday = $db->prepare("SELECT COUNT(*) FROM bookings WHERE date = ?");
    $stmtToday->execute([$today]);
    $totals['todayBookings'] = (int)$stmtToday->fetchColumn();

    $stmtRooms = $db->prepare("SELECT COUNT(DISTINCT room) FROM bookings WHERE date = ?");
    $stmtRooms->execute([$today]);
    $totals['roomsInUse'] = (int)$stmtRooms->fetchColumn();

    // Recent bookings
    $recentBookings = $db->query(bookingSelectSQL() . " ORDER BY b.date DESC, b.start_time, b.room LIMIT 6")->fetchAll();

    return [
        'totals'         => $totals,
        'schedulesByDay' => $schedulesByDay->fetchAll(),
        'roomUsage'      => $roomUsage,
        'recentBookings' => $recentBookings,
    ];
}
