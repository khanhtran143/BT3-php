-- SQL Script for phpMyAdmin / MySQL
-- Database: scheduler
-- Compatible with MySQL 5.7+ and MySQL 8.0+

CREATE DATABASE IF NOT EXISTS `scheduler` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `scheduler`;

-- --------------------------------------------------------
-- Table structure for table `teachers`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(255) NOT NULL,
  `department` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) DEFAULT '',
  `is_admin` TINYINT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `rooms`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `capacity` INT NOT NULL DEFAULT 40,
  `status` VARCHAR(50) NOT NULL DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `subjects`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `students`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_code` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `class_name` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `bookings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `teacher_id` INT NOT NULL,
  `subject_code` VARCHAR(50) NOT NULL,
  `subject_name` VARCHAR(255) NOT NULL,
  `class_group` VARCHAR(100) NOT NULL,
  `room` VARCHAR(255) NOT NULL,
  `practice_topic` VARCHAR(255) NOT NULL,
  `week_start` VARCHAR(50) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `start_time` VARCHAR(10) NOT NULL,
  `end_time` VARCHAR(10) NOT NULL,
  `note` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seed Data
-- --------------------------------------------------------

-- Teachers (password_hash is BCRYPT hash of 'ptit123')
INSERT INTO `teachers` (`id`, `full_name`, `department`, `email`, `phone`, `password_hash`, `is_admin`) VALUES
(1, 'Nguyễn Quang Hưng', 'Khoa Công nghệ thông tin', 'hung.nq@ptit.edu.vn', '0901001001', '$2y$10$/KHaGcyzfc6bBrbcfMxPIea0rfuxsHC3sZyIUvS8Zz9wFs4iKo7wG', 0),
(2, 'Đào Ngọc Phong', 'Khoa Công nghệ thông tin', 'phong.dn@ptit.edu.vn', '0901001002', '$2y$10$/KHaGcyzfc6bBrbcfMxPIea0rfuxsHC3sZyIUvS8Zz9wFs4iKo7wG', 0),
(3, 'Bùi Văn Công', 'Bộ môn Lập trình Python', 'cong.vbv@ptit.edu.vn', '0901001003', '$2y$10$/KHaGcyzfc6bBrbcfMxPIea0rfuxsHC3sZyIUvS8Zz9wFs4iKo7wG', 0),
(4, 'Võ Ngọc Bích Uyên', 'Bộ môn Trí tuệ nhân tạo', 'uyen.vnb@ptit.edu.vn', '0901001004', '$2y$10$/KHaGcyzfc6bBrbcfMxPIea0rfuxsHC3sZyIUvS8Zz9wFs4iKo7wG', 0),
(5, 'Đỗ Thị Liên', 'Bộ môn Ngôn ngữ lập trình', 'lien.dt@ptit.edu.vn', '0901001005', '$2y$10$/KHaGcyzfc6bBrbcfMxPIea0rfuxsHC3sZyIUvS8Zz9wFs4iKo7wG', 0),
(6, 'Quản trị viên', 'Phòng đào tạo', 'admin@ptit.edu.vn', '0901001999', '$2y$10$/KHaGcyzfc6bBrbcfMxPIea0rfuxsHC3sZyIUvS8Zz9wFs4iKo7wG', 1)
ON DUPLICATE KEY UPDATE `id`=`id`;

-- Rooms
INSERT INTO `rooms` (`name`, `capacity`, `status`) VALUES
('Phòng Lab A1-201', 45, 'available'),
('Phòng Lab A2-204', 40, 'available'),
('Phòng Lab B1-305', 50, 'maintenance'),
('Phòng Lab C2-402', 42, 'available')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- Subjects
INSERT INTO `subjects` (`code`, `name`) VALUES
('INT1434', 'Lập trình Web'),
('INT3162', 'Lập trình với Python'),
('INT1341', 'Nhập môn trí tuệ nhân tạo'),
('INT1340', 'Nhập môn công nghệ phần mềm'),
('INT1339', 'Ngôn ngữ lập trình C++')
ON DUPLICATE KEY UPDATE `code`=`code`;

-- Students
INSERT INTO `students` (`student_code`, `full_name`, `email`, `class_name`, `status`) VALUES
('B21DCCN001', 'Nguyễn Minh Anh', 'anh.nm21@stu.ptit.edu.vn', 'D21CQCN01-B', 'active'),
('B21DCCN108', 'Trần Bảo Long', 'long.tb21@stu.ptit.edu.vn', 'D21CQCN03-B', 'active'),
('B22DCCN077', 'Lê Hà Linh', 'linh.lh22@stu.ptit.edu.vn', 'D22CQCN02-B', 'active')
ON DUPLICATE KEY UPDATE `student_code`=`student_code`;

-- Calculate dynamically the Monday of the current week in MySQL
SET @week_start = DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY);

-- Bookings
INSERT INTO `bookings` (`id`, `teacher_id`, `subject_code`, `subject_name`, `class_group`, `room`, `practice_topic`, `week_start`, `date`, `start_time`, `end_time`, `note`) VALUES
(1, 1, 'INT1434', 'Lập trình Web', 'Nhóm 98', 'Phòng Lab A1-201', 'Hướng dẫn xây dựng giao diện dashboard', @week_start, DATE_ADD(@week_start, INTERVAL 0 DAY), '07:00', '11:50', 'Mang theo file thiết kế giao diện.'),
(2, 3, 'INT3162', 'Lập trình với Python', 'Nhóm 04', 'Phòng Lab A2-204', 'Xử lý dữ liệu bằng pandas', @week_start, DATE_ADD(@week_start, INTERVAL 1 DAY), '07:00', '08:50', 'Thực hành trên bộ dữ liệu mẫu.'),
(3, 4, 'INT1341', 'Nhập môn trí tuệ nhân tạo', 'Nhóm 04', 'Phòng Lab B1-305', 'Mô hình hóa bài toán phân loại', @week_start, DATE_ADD(@week_start, INTERVAL 2 DAY), '09:00', '11:50', 'Ưu tiên nhóm đã đăng ký sớm.'),
(4, 1, 'INT1434', 'Lập trình Web', 'Nhóm 98', 'Phòng Lab C2-402', 'Thực hành Node.js và REST API', @week_start, DATE_ADD(@week_start, INTERVAL 3 DAY), '07:00', '11:50', 'Sử dụng đề tài đăng ký lịch.'),
(5, 2, 'INT1340', 'Nhập môn công nghệ phần mềm', 'Nhóm 07', 'Phòng Lab A2-204', 'Viết user story và test case', @week_start, DATE_ADD(@week_start, INTERVAL 1 DAY), '13:00', '15:50', 'Chuẩn bị biểu mẫu sprint.'),
(6, 5, 'INT1339', 'Ngôn ngữ lập trình C++', 'Nhóm 99', 'Phòng Lab B1-305', 'Thực hành class, object và file I/O', @week_start, DATE_ADD(@week_start, INTERVAL 3 DAY), '13:00', '15:50', 'Giảng viên mang bộ bài tập mẫu.'),
(7, 5, 'INT1339', 'Ngôn ngữ lập trình C++', 'Nhóm 99', 'Phòng Lab C2-402', 'Thực hành con trỏ và cấp phát động', @week_start, DATE_ADD(@week_start, INTERVAL 4 DAY), '13:00', '15:50', 'Tăng cường cho nhóm cần ôn tập.')
ON DUPLICATE KEY UPDATE `id`=`id`;
