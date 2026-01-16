SET FOREIGN_KEY_CHECKS = 0;

-- Device Hub Database Schema
-- MySQL 8.0+

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS renewal_requests;
DROP TABLE IF EXISTS return_requests;
DROP TABLE IF EXISTS borrow_requests;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

SET FOREIGN_KEY_CHECKS = 1;

-- Department name ENUM type for dropdown selection
-- This ensures consistent department names across the system

-- Create Departments table with ENUM name
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_departments_code (code),
    INDEX idx_departments_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    temp_password VARCHAR(100),
    department_id INT NOT NULL,
    role ENUM('superuser', 'admin', 'user') NOT NULL DEFAULT 'user',
    avatar_url VARCHAR(500),
    avatar_thumbnail_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    INDEX idx_users_email (email),
    INDEX idx_users_department (department_id),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Devices table
CREATE TABLE devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    asset_tag VARCHAR(50) NOT NULL UNIQUE,
    category ENUM('laptop', 'mobile', 'tablet', 'monitor', 'accessories', 'storage', 'ram') NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(200) NOT NULL,
    status ENUM('available', 'inuse', 'maintenance', 'updating', 'storage', 'discard', 'transferred') NOT NULL DEFAULT 'available',
    notes TEXT,
    department_id INT NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2),
    purchase_date DATE NOT NULL,
    warranty_date DATE,
    vendor VARCHAR(200),
    mac_address VARCHAR(17),
    ip_address VARCHAR(45),
    hostname VARCHAR(255),
    specs_json JSON,
    image_url VARCHAR(500),
    image_thumbnail_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    INDEX idx_devices_asset_tag (asset_tag),
    INDEX idx_devices_category (category),
    INDEX idx_devices_status (status),
    INDEX idx_devices_department (department_id),
    INDEX idx_devices_purchase_price (purchase_price),
    INDEX idx_devices_selling_price (selling_price),
    INDEX idx_devices_mac_address (mac_address),
    INDEX idx_devices_hostname (hostname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Borrow Requests table
CREATE TABLE borrow_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id INT NOT NULL,
    user_id INT NOT NULL,
    approved_by INT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'active', 'returned', 'rejected') NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_borrow_device (device_id),
    INDEX idx_borrow_user (user_id),
    INDEX idx_borrow_status (status),
    INDEX idx_borrow_dates (start_date, end_date),
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Return Requests table
CREATE TABLE return_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    borrow_request_id INT NOT NULL UNIQUE,
    return_date DATE NOT NULL,
    device_condition ENUM('excellent', 'good', 'fair', 'damaged') NOT NULL DEFAULT 'good',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (borrow_request_id) REFERENCES borrow_requests(id) ON DELETE CASCADE,
    INDEX idx_return_borrow (borrow_request_id),
    INDEX idx_return_date (return_date),
    INDEX idx_return_condition (device_condition)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Renewal Requests table
CREATE TABLE renewal_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    borrow_request_id INT NOT NULL,
    user_id INT NOT NULL,
    current_end_date DATE NOT NULL,
    requested_end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by INT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (borrow_request_id) REFERENCES borrow_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_renewal_borrow (borrow_request_id),
    INDEX idx_renewal_user (user_id),
    INDEX idx_renewal_status (status),
    CONSTRAINT chk_renewal_dates CHECK (requested_end_date > current_end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create views for common queries

-- View: Devices with department info and current borrower
CREATE OR REPLACE VIEW v_device_details AS
SELECT 
    d.*,
    dept.name AS department_name,
    dept.code AS department_code,
    br.user_id AS assigned_to_id,
    u.name AS assigned_to_name,
    u.avatar_url AS assigned_to_avatar,
    u.department_id AS assigned_to_department_id,
    user_dept.name AS assigned_to_department_name
FROM devices d
LEFT JOIN departments dept ON d.department_id = dept.id
LEFT JOIN borrow_requests br ON d.id = br.device_id AND br.status = 'active'
LEFT JOIN users u ON br.user_id = u.id
LEFT JOIN departments user_dept ON u.department_id = user_dept.id;

-- View: Borrow requests with full details
CREATE OR REPLACE VIEW v_borrow_details AS
SELECT 
    br.*,
    d.name AS device_name,
    d.asset_tag AS device_asset_tag,
    d.image_url AS device_image,
    d.category AS device_category,
    u.name AS user_name,
    u.email AS user_email,
    approver.name AS approved_by_name
FROM borrow_requests br
LEFT JOIN devices d ON br.device_id = d.id
LEFT JOIN users u ON br.user_id = u.id
LEFT JOIN users approver ON br.approved_by = approver.id;

-- View: Users with department info (without password_hash)
CREATE OR REPLACE VIEW v_users_public AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.department_id,
    d.name AS department_name,
    u.role,
    u.avatar_url,
    u.avatar_thumbnail_url,
    u.is_active,
    u.must_change_password,
    u.temp_password,
    u.last_login_at,
    u.created_at
FROM users u
LEFT JOIN departments d ON u.department_id = d.id;

-- View: Return requests with details
CREATE OR REPLACE VIEW v_return_details AS
SELECT 
    rr.*,
    br.device_id,
    br.user_id,
    br.start_date,
    br.end_date,
    d.name AS device_name,
    d.asset_tag AS device_asset_tag,
    u.name AS user_name
FROM return_requests rr
LEFT JOIN borrow_requests br ON rr.borrow_request_id = br.id
LEFT JOIN devices d ON br.device_id = d.id
LEFT JOIN users u ON br.user_id = u.id;

-- View: Renewal requests with details
CREATE OR REPLACE VIEW v_renewal_details AS
SELECT 
    renew.*,
    br.device_id,
    br.start_date AS borrow_start_date,
    d.name AS device_name,
    d.asset_tag AS device_asset_tag,
    d.image_url AS device_image,
    u.name AS user_name,
    u.email AS user_email,
    reviewer.name AS reviewed_by_name
FROM renewal_requests renew
LEFT JOIN borrow_requests br ON renew.borrow_request_id = br.id
LEFT JOIN devices d ON br.device_id = d.id
LEFT JOIN users u ON renew.user_id = u.id
LEFT JOIN users reviewer ON renew.reviewed_by = reviewer.id;

-- Create In-App Notifications table
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('request_approved', 'request_rejected', 'new_request', 'overdue', 'device_returned', 'renewal_approved', 'renewal_rejected', 'info') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    related_request_id INT,
    related_device_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_request_id) REFERENCES borrow_requests(id) ON DELETE SET NULL,
    FOREIGN KEY (related_device_id) REFERENCES devices(id) ON DELETE SET NULL,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View: Notifications with related info
CREATE OR REPLACE VIEW v_notification_details AS
SELECT 
    n.*,
    u.name AS user_name,
    u.email AS user_email,
    d.name AS device_name,
    d.asset_tag AS device_asset_tag
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
LEFT JOIN devices d ON n.related_device_id = d.id;
