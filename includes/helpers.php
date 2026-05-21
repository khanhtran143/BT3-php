<?php
/**
 * helpers.php — Hàm tiện ích dùng chung toàn project.
 */

/**
 * Gửi response JSON và kết thúc script.
 */
function sendJson(int $statusCode, mixed $data, array $extraHeaders = []): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    foreach ($extraHeaders as $name => $value) {
        header("$name: $value");
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Đọc JSON body từ request (POST/PUT/PATCH).
 */
function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new AppException('Dữ liệu JSON không hợp lệ.', 400);
    }
    return $data;
}

/**
 * Validate các trường bắt buộc trong payload.
 * $fields = [['fieldName', 'Thông báo lỗi'], ...]
 */
function validateRequired(array $payload, array $fields): void
{
    foreach ($fields as [$field, $message]) {
        $value = trim((string)($payload[$field] ?? ''));
        if ($value === '') {
            throw new AppException($message, 400);
        }
    }
}

/**
 * HTML escape — dùng cho output.
 */
function e(?string $value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Validate date format YYYY-MM-DD.
 */
function ensureValidDate(?string $date): void
{
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date ?? '')) {
        throw new AppException('Ngày học không hợp lệ.', 400);
    }
}

/**
 * Validate time format HH:MM.
 */
function ensureValidTime(?string $time): void
{
    if (!preg_match('/^\d{2}:\d{2}$/', $time ?? '')) {
        throw new AppException('Giờ học không hợp lệ.', 400);
    }
}

/**
 * Tính ngày thứ Hai của tuần chứa $date.
 */
function getMonday(?string $dateString = null): string
{
    $date = $dateString ? new DateTime($dateString) : new DateTime();
    $dayOfWeek = (int)$date->format('N'); // 1=Mon ... 7=Sun
    if ($dayOfWeek !== 1) {
        $date->modify('-' . ($dayOfWeek - 1) . ' days');
    }
    return $date->format('Y-m-d');
}

/**
 * Cộng/trừ ngày.
 */
function addDays(string $dateString, int $amount): string
{
    $date = new DateTime($dateString);
    $date->modify(($amount >= 0 ? '+' : '') . $amount . ' days');
    return $date->format('Y-m-d');
}

/**
 * Normalize weekStart về Monday.
 */
function normalizeWeekStart(?string $weekStart): string
{
    $ws = $weekStart ?: getMonday();
    ensureValidDate($ws);
    return getMonday($ws);
}

/**
 * Lấy request method thực tế (hỗ trợ _method override).
 */
function getRequestMethod(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

/**
 * Custom exception class với HTTP status code.
 */
class AppException extends RuntimeException
{
    public int $statusCode;

    public function __construct(string $message, int $statusCode = 500)
    {
        parent::__construct($message);
        $this->statusCode = $statusCode;
    }
}
