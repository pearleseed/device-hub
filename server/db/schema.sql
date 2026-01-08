SET FOREIGN_KEY_CHECKS = 0;

-- Device Hub Database Schema
-- MySQL 8.0+

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS return_requests;
DROP TABLE IF EXISTS borrowing_requests;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

SET FOREIGN_KEY_CHECKS = 1;

-- Create Departments table
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_departments_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    avatar_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    INDEX idx_users_email (email),
    INDEX idx_users_department (department_id),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Equipment table
CREATE TABLE equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    asset_tag VARCHAR(50) NOT NULL UNIQUE,
    category ENUM('laptop', 'mobile', 'tablet', 'monitor', 'accessories') NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    status ENUM('available', 'borrowed', 'maintenance') NOT NULL DEFAULT 'available',
    department_id INT NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL,
    purchase_date DATE NOT NULL,
    specs_json JSON,
    image_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    INDEX idx_equipment_asset_tag (asset_tag),
    INDEX idx_equipment_category (category),
    INDEX idx_equipment_status (status),
    INDEX idx_equipment_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Borrowing Requests table
CREATE TABLE borrowing_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT NOT NULL,
    user_id INT NOT NULL,
    approved_by INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'active', 'returned', 'rejected') NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_borrowing_equipment (equipment_id),
    INDEX idx_borrowing_user (user_id),
    INDEX idx_borrowing_status (status),
    INDEX idx_borrowing_dates (start_date, end_date),
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Return Requests table
CREATE TABLE return_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    borrowing_request_id INT NOT NULL UNIQUE,
    return_date DATE NOT NULL,
    device_condition ENUM('excellent', 'good', 'fair', 'damaged') NOT NULL DEFAULT 'good',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (borrowing_request_id) REFERENCES borrowing_requests(id) ON DELETE RESTRICT,
    INDEX idx_return_borrowing (borrowing_request_id),
    INDEX idx_return_date (return_date),
    INDEX idx_return_condition (device_condition)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create views for common queries

-- View: Equipment with department info and current borrower
CREATE OR REPLACE VIEW v_equipment_details AS
SELECT 
    e.*,
    d.name AS department_name,
    d.code AS department_code,
    br.user_id AS assigned_to_id,
    u.name AS assigned_to_name
FROM equipment e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN borrowing_requests br ON e.id = br.equipment_id AND br.status = 'active'
LEFT JOIN users u ON br.user_id = u.id;

-- View: Borrowing requests with full details
CREATE OR REPLACE VIEW v_borrowing_details AS
SELECT 
    br.*,
    e.name AS equipment_name,
    e.asset_tag AS equipment_asset_tag,
    e.image_url AS equipment_image,
    e.category AS equipment_category,
    u.name AS user_name,
    u.email AS user_email,
    approver.name AS approved_by_name
FROM borrowing_requests br
LEFT JOIN equipment e ON br.equipment_id = e.id
LEFT JOIN users u ON br.user_id = u.id
LEFT JOIN users approver ON br.approved_by = approver.id;

-- View: Users with department info (without password)
CREATE OR REPLACE VIEW v_users_public AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.department_id,
    d.name AS department_name,
    u.role,
    u.avatar_url,
    u.created_at
FROM users u
LEFT JOIN departments d ON u.department_id = d.id;

-- View: Return requests with details
CREATE OR REPLACE VIEW v_return_details AS
SELECT 
    rr.*,
    br.equipment_id,
    br.user_id,
    br.start_date,
    br.end_date,
    e.name AS equipment_name,
    e.asset_tag AS equipment_asset_tag,
    u.name AS user_name
FROM return_requests rr
LEFT JOIN borrowing_requests br ON rr.borrowing_request_id = br.id
LEFT JOIN equipment e ON br.equipment_id = e.id
LEFT JOIN users u ON br.user_id = u.id;
