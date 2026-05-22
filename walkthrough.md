# Walkthrough:

## Cấu trúc project PHP

```
BT3-php/
├── api.php                          ← Router API (entry point)
├── router.php                       ← Router cho php -S
├── scheduler.sql                    ← File xuất cơ sở dữ liệu cho phpMyAdmin / MySQL [NEW]
├── includes/
│   ├── helpers.php                  ← Utilities (JSON, validate, escape)
│   ├── db.php                       ← PDO SQLite + MySQL support (tự động kết nối)
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
    └── scheduler.db                 ← Cơ sở dữ liệu SQLite mặc định (tự sinh)
```

## Hướng dẫn chạy localhost (SQLite mặc định)

Bạn mở terminal (PowerShell hoặc CMD) tại thư mục dự án và chạy lệnh sau:
```bash
D:\XAMPP\php\php.exe -S localhost:8080 router.php
```
Hoặc trên máy trường:
```bash
php -S localhost:8080 router.php
```
Truy cập:
- **Giảng viên**: http://localhost:8080/
- **Admin**: http://localhost:8080/admin.html
- **Tài khoản mẫu**: Bất kỳ email trong dữ liệu mẫu, mật khẩu: `ptit123`
- **Admin**: `admin@ptit.edu.vn` / `ptit123`

## Hướng dẫn cài đặt & sử dụng MySQL / phpMyAdmin

Để chuyển sang dùng MySQL kết nối với phpMyAdmin (ví dụ trên XAMPP):

1. **Khởi động MySQL**: Mở **XAMPP Control Panel** và nhấn **Start** tại mục MySQL.
2. **Tạo CSDL & Import dữ liệu**:
   - Truy cập trang quản trị phpMyAdmin tại địa chỉ: [http://localhost/phpmyadmin/](http://localhost/phpmyadmin/).
   - Click vào tab **Import** (Nhập).
   - Chọn tệp tin [scheduler.sql](file:///c:/Users/Lenovo/Documents/LT_WEB/BT3-php/scheduler.sql) trong thư mục gốc của project.
   - Nhấn nút **Import** (Nhập) ở cuối trang. Hệ thống sẽ tự động tạo cơ sở dữ liệu tên là `scheduler` cùng toàn bộ bảng và dữ liệu mẫu đầy đủ.
3. **Cấu hình PHP kết nối MySQL**:
   - Mở file [db.php](file:///c:/Users/Lenovo/Documents/LT_WEB/BT3-php/includes/db.php).
   - Tại dòng 10, thay đổi giá trị cấu hình `DB_TYPE` từ `'sqlite'` thành `'mysql'`:
     ```php
     define('DB_TYPE', 'mysql'); // Chuyển từ 'sqlite' sang 'mysql'
     ```
   - Cập nhật thông số kết nối MySQL (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`) nếu chúng khác cấu hình mặc định của XAMPP (`localhost`, `3306`, `scheduler`, `root`, không mật khẩu).
4. **Kiểm tra**:
   - Khi chạy ứng dụng, các thao tác thêm/sửa/xóa lịch, môn học, phòng máy,... sẽ được ghi trực tiếp vào MySQL và bạn có thể kiểm tra qua phpMyAdmin.

## Verification

| Test | Kết quả |
|------|---------|
| PHP syntax lint (12 files) | ✅ Pass |
| API session check | ✅ `{"authenticated": false}` |
| API login | ✅ Trả JSON đúng + tiếng Việt |
| Browser login UI | ✅ Form hiển thị, đăng nhập thành công |
| Admin dashboard | ✅ Stats + charts + recent bookings |
| DB SQL Export | ✅ `scheduler.sql` tạo thành công cho phpMyAdmin |
| Dual DB support | ✅ Hỗ trợ cả SQLite và MySQL/phpMyAdmin |