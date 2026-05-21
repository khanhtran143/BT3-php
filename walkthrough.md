# Walkthrough:

## Cấu trúc project PHP

```
BT3-php/
├── api.php                          ← Router API (entry point)
├── router.php                       ← Router cho php -S
├── includes/
│   ├── helpers.php                  ← Utilities (JSON, validate, escape)
│   ├── db.php                       ← PDO SQLite + schema + seed
│   ├── auth.php                     ← Session management
│   └── handlers/
│       ├── auth_handler.php         ← Login/Logout/Session
│       ├── schedule_handler.php     ← Schedule + Meta
│       ├── booking_handler.php      ← Bookings CRUD
│       ├── teacher_handler.php      ← Teachers CRUD
│       ├── room_handler.php         ← Rooms CRUD
│       ├── subject_handler.php      ← Subjects CRUD
│       └── student_handler.php      ← Students CRUD
├── public/                          ← Frontend (giữ nguyên HTML/CSS)
│   ├── index.html, admin.html, print.html
│   ├── css/ (3 files — không thay đổi)
│   └── js/ (3 files — chỉ đổi URL endpoint)
└── data/
    └── scheduler.db                 ← Auto-generated
```
## Hướng dẫn chạy localhost

Bạn mở terminal (PowerShell hoặc CMD) tại thư mục d:\TaiLieu\BT3\BT3-php\ và chạy lệnh sau:
D:\XAMPP\php\php.exe -S localhost:8080 router.php
Truy cập:
- **Giảng viên**: http://localhost:8080/
- **Admin**: http://localhost:8080/admin.html
- **Tài khoản mẫu**: Bất kỳ email trong seed data, mật khẩu: `ptit123`
- **Admin**: `admin@ptit.edu.vn` / `ptit123`
## Verification

| Test | Kết quả |
|------|---------|
| PHP syntax lint (12 files) | ✅ Pass |
| API session check | ✅ `{"authenticated": false}` |
| API login | ✅ Trả JSON đúng + tiếng Việt |
| Browser login UI | ✅ Form hiển thị, đăng nhập thành công |
| Admin dashboard | ✅ Stats + charts + recent bookings |
| DB auto-create | ✅ `data/scheduler.db` tự tạo |

chạy trên máy trường bằng lệnh: php -S localhost:8080 router.php