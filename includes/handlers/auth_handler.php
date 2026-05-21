<?php
/**
 * auth_handler.php — Xử lý: session, login, logout.
 */

function handleSession(): void
{
    $session = getSession();
    if (!$session) {
        sendJson(200, ['authenticated' => false]);
    }

    $teacher = getTeacherById($session['teacherId']);
    sendJson(200, [
        'authenticated' => true,
        'teacher'       => $teacher,
    ]);
}

function handleLogin(): void
{
    $body = getJsonBody();
    $teacher = authenticateTeacher($body['email'] ?? null, $body['password'] ?? null);

    if (!$teacher) {
        sendJson(401, ['error' => 'Email hoặc mật khẩu không đúng.']);
    }

    createSession($teacher['id']);
    sendJson(200, [
        'authenticated' => true,
        'teacher'       => $teacher,
    ]);
}

function handleLogout(): void
{
    destroySession();
    sendJson(200, ['success' => true]);
}
