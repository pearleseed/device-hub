SET FOREIGN_KEY_CHECKS = 0;

-- Device Hub Seed Data
-- Realistic data for testing and development

-- Clear existing data (in reverse order of dependencies)
DELETE FROM return_requests;
DELETE FROM borrow_requests;
DELETE FROM devices;
DELETE FROM users;
DELETE FROM departments;

SET FOREIGN_KEY_CHECKS = 1;

-- Reset auto-increment
ALTER TABLE departments AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE devices AUTO_INCREMENT = 1;
ALTER TABLE borrow_requests AUTO_INCREMENT = 1;
ALTER TABLE return_requests AUTO_INCREMENT = 1;

-- Insert Departments
INSERT INTO departments (name, code) VALUES
('Information Technology', 'IT'),
('Engineering', 'ENG'),
('Design', 'DSN'),
('Marketing', 'MKT'),
('Human Resources', 'HR'),
('Finance', 'FIN'),
('Operations', 'OPS'),
('Sales', 'SLS');

-- Insert Users
-- Password for all users is 'password123' (hashed using PBKDF2)
-- In production, you would generate proper hashes
INSERT INTO users (name, email, password_hash, department_id, role, avatar_url) VALUES
-- IT Department (Admins)
('Alex Johnson', 'alex.johnson@company.com', '64657669636568756273616c74313233:8cbcc198d6ed229ba7b01dc40bc74407683d7cb53b9b301248cd2b87fbf75468', 1, 'admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'),
('James Wilson', 'james.wilson@company.com', '64657669636568756273616c74313233:8cbcc198d6ed229ba7b01dc40bc74407683d7cb53b9b301248cd2b87fbf75468', 1, 'admin', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'),
-- Engineering
('Sarah Chen', 'sarah.chen@company.com', '64657669636568756273616c74313233:8cbcc198d6ed229ba7b01dc40bc74407683d7cb53b9b301248cd2b87fbf75468', 2, 'user', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'),
('David Kim', 'david.kim@company.com', '64657669636568756273616c74313233:8cbcc198d6ed229ba7b01dc40bc74407683d7cb53b9b301248cd2b87fbf75468', 2, 'user', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'),
('Lisa Wang', 'lisa.wang@company.com', '64657669636568756273616c74313233:8cbcc198d6ed229ba7b01dc40bc74407683d7cb53b9b301248cd2b87fbf75468', 2, 'user', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'),
-- Design
('Michael Park', 'michael.park@company.com', '64657669636568756273616c74313233:8cbcc198d6ed229ba7b01dc40bc74407683d7cb53b9b301248cd2b87fbf75468', 3, 'user', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face'),
('Emma Rodriguez', 'emma.rodriguez@company.com', '64657669636568756273616c74313233:8cbcc198d6ed229ba7b01dc40bc74407683d7cb53b9b301248cd2b87fbf75468', 3, 'user', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'),
-- Marketing
('Emily Davis', 'emily.davis@company.com', '64657669636568756273616c74313233:8cbcc198d6ed229ba7b01dc40bc74407683d7cb53b9b301248cd2b87fbf75468', 4, 'user', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'),
('Tom Anderson', 'tom.anderson@company.com', '64657669636568756273616c74313233:8cbcc198d6ed229ba7b01dc40bc74407683d7cb53b9b301248cd2b87fbf75468', 4, 'user', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face'),
-- HR
('Jennifer Lee', 'jennifer.lee@company.com', '64657669636568756273616c74313233:8cbcc198d6ed229ba7b01dc40bc74407683d7cb53b9b301248cd2b87fbf75468', 5, 'user', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face');

-- Insert Devices
INSERT INTO devices (name, asset_tag, category, brand, model, status, department_id, purchase_price, purchase_date, specs_json, image_url) VALUES
-- Laptops
('MacBook Pro 16"', 'LAP-001', 'laptop', 'Apple', 'MacBook Pro 16-inch (2024, M3 Pro)', 'available', 1, 2499.00, '2024-01-15', 
 '{"os": "macOS Sonoma", "processor": "Apple M3 Pro", "ram": "18GB", "storage": "512GB SSD", "display": "16.2\\" Liquid Retina XDR", "battery": "22 hours"}',
 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop'),

('MacBook Pro 14"', 'LAP-002', 'laptop', 'Apple', 'MacBook Pro 14-inch (2024, M3)', 'borrowed', 1, 1999.00, '2024-02-10',
 '{"os": "macOS Sonoma", "processor": "Apple M3", "ram": "16GB", "storage": "512GB SSD", "display": "14.2\\" Liquid Retina XDR", "battery": "17 hours"}',
 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=300&fit=crop'),

('ThinkPad X1 Carbon', 'LAP-003', 'laptop', 'Lenovo', 'ThinkPad X1 Carbon Gen 11', 'borrowed', 2, 1849.00, '2024-01-20',
 '{"os": "Windows 11 Pro", "processor": "Intel Core i7-1365U", "ram": "16GB", "storage": "512GB SSD", "display": "14\\" 2.8K OLED", "battery": "15 hours"}',
 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop'),

('Dell XPS 15', 'LAP-004', 'laptop', 'Dell', 'XPS 15 9530', 'available', 2, 1799.00, '2024-02-15',
 '{"os": "Windows 11 Pro", "processor": "Intel Core i7-13700H", "ram": "32GB", "storage": "1TB SSD", "display": "15.6\\" 3.5K OLED", "battery": "13 hours"}',
 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop'),

('MacBook Air M2', 'LAP-005', 'laptop', 'Apple', 'MacBook Air 13-inch (M2)', 'available', 3, 1199.00, '2024-01-10',
 '{"os": "macOS Sonoma", "processor": "Apple M2", "ram": "8GB", "storage": "256GB SSD", "display": "13.6\\" Liquid Retina", "battery": "18 hours"}',
 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=300&fit=crop'),

('HP EliteBook 840', 'LAP-006', 'laptop', 'HP', 'EliteBook 840 G10', 'maintenance', 4, 1549.00, '2023-11-05',
 '{"os": "Windows 11 Pro", "processor": "Intel Core i5-1345U", "ram": "16GB", "storage": "512GB SSD", "display": "14\\" FHD IPS", "battery": "14 hours"}',
 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop'),

-- Mobile Phones
('iPhone 15 Pro', 'MOB-001', 'mobile', 'Apple', 'iPhone 15 Pro', 'available', 1, 999.00, '2024-01-20',
 '{"os": "iOS 17", "processor": "A17 Pro", "ram": "8GB", "storage": "256GB", "display": "6.1\\" Super Retina XDR", "battery": "Up to 23 hours"}',
 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'),

('iPhone 15 Pro Max', 'MOB-002', 'mobile', 'Apple', 'iPhone 15 Pro Max', 'borrowed', 4, 1199.00, '2024-02-01',
 '{"os": "iOS 17", "processor": "A17 Pro", "ram": "8GB", "storage": "512GB", "display": "6.7\\" Super Retina XDR", "battery": "Up to 29 hours"}',
 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=300&fit=crop'),

('Samsung Galaxy S24 Ultra', 'MOB-003', 'mobile', 'Samsung', 'Galaxy S24 Ultra', 'maintenance', 1, 1299.00, '2024-02-05',
 '{"os": "Android 14", "processor": "Snapdragon 8 Gen 3", "ram": "12GB", "storage": "256GB", "display": "6.8\\" Dynamic AMOLED 2X", "battery": "5000mAh"}',
 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop'),

('Google Pixel 8 Pro', 'MOB-004', 'mobile', 'Google', 'Pixel 8 Pro', 'available', 2, 999.00, '2024-02-20',
 '{"os": "Android 14", "processor": "Google Tensor G3", "ram": "12GB", "storage": "128GB", "display": "6.7\\" LTPO OLED", "battery": "5050mAh"}',
 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=300&fit=crop'),

('Samsung Galaxy S24', 'MOB-005', 'mobile', 'Samsung', 'Galaxy S24', 'available', 4, 799.00, '2024-03-01',
 '{"os": "Android 14", "processor": "Exynos 2400", "ram": "8GB", "storage": "128GB", "display": "6.2\\" Dynamic AMOLED 2X", "battery": "4000mAh"}',
 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop'),

-- Tablets
('iPad Pro 12.9"', 'TAB-001', 'tablet', 'Apple', 'iPad Pro 12.9-inch (M2)', 'available', 3, 1099.00, '2024-01-25',
 '{"os": "iPadOS 17", "processor": "Apple M2", "ram": "8GB", "storage": "256GB", "display": "12.9\\" Liquid Retina XDR", "battery": "10 hours"}',
 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'),

('iPad Pro 11"', 'TAB-002', 'tablet', 'Apple', 'iPad Pro 11-inch (M2)', 'borrowed', 3, 799.00, '2024-02-08',
 '{"os": "iPadOS 17", "processor": "Apple M2", "ram": "8GB", "storage": "128GB", "display": "11\\" Liquid Retina", "battery": "10 hours"}',
 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'),

('Samsung Galaxy Tab S9 Ultra', 'TAB-003', 'tablet', 'Samsung', 'Galaxy Tab S9 Ultra', 'available', 3, 1199.00, '2024-03-10',
 '{"os": "Android 14", "processor": "Snapdragon 8 Gen 2", "ram": "12GB", "storage": "256GB", "display": "14.6\\" Dynamic AMOLED 2X", "battery": "11200mAh"}',
 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=300&fit=crop'),

('iPad Air', 'TAB-004', 'tablet', 'Apple', 'iPad Air (M1)', 'available', 4, 599.00, '2023-12-15',
 '{"os": "iPadOS 17", "processor": "Apple M1", "ram": "8GB", "storage": "64GB", "display": "10.9\\" Liquid Retina", "battery": "10 hours"}',
 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'),

-- Monitors
('Dell UltraSharp 27"', 'MON-001', 'monitor', 'Dell', 'UltraSharp U2723QE', 'borrowed', 3, 799.00, '2024-02-01',
 '{"display": "27\\" 4K UHD IPS", "resolution": "3840x2160", "refresh_rate": "60Hz", "ports": "USB-C, HDMI, DisplayPort"}',
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop'),

('LG UltraWide 34"', 'MON-002', 'monitor', 'LG', '34WN80C-B', 'available', 2, 599.00, '2024-02-08',
 '{"display": "34\\" WQHD IPS Curved", "resolution": "3440x1440", "refresh_rate": "60Hz", "ports": "USB-C, HDMI"}',
 'https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=400&h=300&fit=crop'),

('Samsung Odyssey G7', 'MON-003', 'monitor', 'Samsung', 'Odyssey G7 32"', 'available', 2, 699.00, '2024-01-30',
 '{"display": "32\\" QHD VA Curved", "resolution": "2560x1440", "refresh_rate": "240Hz", "ports": "HDMI 2.0, DisplayPort 1.4"}',
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop'),

('Apple Studio Display', 'MON-004', 'monitor', 'Apple', 'Studio Display', 'available', 3, 1599.00, '2024-03-05',
 '{"display": "27\\" 5K Retina", "resolution": "5120x2880", "refresh_rate": "60Hz", "ports": "Thunderbolt 3, USB-C"}',
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop'),

('ASUS ProArt', 'MON-005', 'monitor', 'ASUS', 'ProArt PA279CRV', 'available', 3, 899.00, '2024-02-20',
 '{"display": "27\\" 4K IPS", "resolution": "3840x2160", "refresh_rate": "60Hz", "ports": "USB-C, HDMI, DisplayPort"}',
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop'),

-- Accessories
('Magic Keyboard', 'ACC-001', 'accessories', 'Apple', 'Magic Keyboard with Touch ID', 'available', 1, 199.00, '2024-01-05',
 '{"connectivity": "Bluetooth, USB-C", "features": "Touch ID, Backlit keys"}',
 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop'),

('Magic Mouse', 'ACC-002', 'accessories', 'Apple', 'Magic Mouse', 'available', 1, 99.00, '2024-01-05',
 '{"connectivity": "Bluetooth", "features": "Multi-Touch surface"}',
 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop'),

('AirPods Pro', 'ACC-003', 'accessories', 'Apple', 'AirPods Pro (2nd Gen)', 'borrowed', 4, 249.00, '2024-01-12',
 '{"connectivity": "Bluetooth 5.3", "features": "Active Noise Cancellation, Spatial Audio", "battery": "6 hours"}',
 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop'),

('Sony WH-1000XM5', 'ACC-004', 'accessories', 'Sony', 'WH-1000XM5', 'available', 2, 399.00, '2024-02-14',
 '{"connectivity": "Bluetooth 5.2", "features": "Industry-leading ANC, 30-hour battery", "battery": "30 hours"}',
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'),

('Logitech MX Master 3S', 'ACC-005', 'accessories', 'Logitech', 'MX Master 3S', 'available', 2, 99.00, '2024-01-18',
 '{"connectivity": "Bluetooth, USB receiver", "features": "8000 DPI, MagSpeed wheel", "battery": "70 days"}',
 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop'),

('CalDigit TS4', 'ACC-006', 'accessories', 'CalDigit', 'TS4 Thunderbolt 4 Dock', 'available', 1, 399.00, '2024-02-25',
 '{"connectivity": "Thunderbolt 4", "ports": "18 ports including 2.5GbE, SD card reader"}',
 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=300&fit=crop'),

('Elgato Stream Deck', 'ACC-007', 'accessories', 'Elgato', 'Stream Deck MK.2', 'available', 4, 149.00, '2024-03-01',
 '{"connectivity": "USB", "features": "15 customizable LCD keys"}',
 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=300&fit=crop');

-- Insert Borrow Requests
INSERT INTO borrow_requests (device_id, user_id, approved_by, start_date, end_date, reason, status, created_at, updated_at) VALUES
-- Active borrowings (matching 'borrowed' equipment)
(2, 3, 1, '2025-12-01', '2026-01-15', 'Development work requiring macOS for iOS app testing', 'active', '2025-11-28 09:00:00', '2025-11-29 10:30:00'),
(3, 4, 1, '2025-12-10', '2025-12-31', 'Remote work setup for client project', 'active', '2025-12-08 14:00:00', '2025-12-09 11:00:00'),
(8, 8, 2, '2025-12-15', '2026-01-10', 'Product photography and social media content', 'active', '2025-12-13 10:00:00', '2025-12-14 09:00:00'),
(13, 6, 1, '2025-12-05', '2026-01-05', 'UI/UX design mockups and prototyping', 'active', '2025-12-03 11:00:00', '2025-12-04 15:00:00'),
(16, 6, 2, '2025-12-01', '2026-01-10', 'Extended monitor for design work', 'active', '2025-11-28 13:00:00', '2025-11-29 14:00:00'),
(23, 8, 1, '2025-12-01', '2025-12-25', 'Client calls and meetings', 'active', '2025-11-28 16:00:00', '2025-11-29 09:00:00'),

-- Pending requests
(1, 3, NULL, '2026-01-20', '2026-02-15', 'New project requiring high-performance laptop for ML model training', 'pending', '2026-01-05 09:30:00', '2026-01-05 09:30:00'),
(7, 5, NULL, '2026-01-15', '2026-01-30', 'Mobile app testing on latest iOS', 'pending', '2026-01-06 11:00:00', '2026-01-06 11:00:00'),
(12, 7, NULL, '2026-01-18', '2026-02-01', 'Design presentation to client', 'pending', '2026-01-07 14:00:00', '2026-01-07 14:00:00'),
(4, 4, NULL, '2026-01-22', '2026-02-10', 'Performance testing on Windows environment', 'pending', '2026-01-07 16:30:00', '2026-01-07 16:30:00'),

-- Approved (waiting to become active)
(10, 9, 1, '2026-01-12', '2026-01-25', 'Android app compatibility testing', 'approved', '2026-01-04 10:00:00', '2026-01-05 14:00:00'),
(5, 10, 2, '2026-01-14', '2026-01-28', 'HR presentation and training materials', 'approved', '2026-01-06 09:00:00', '2026-01-07 11:00:00'),

-- Historical returned requests
(1, 3, 1, '2025-10-01', '2025-10-20', 'Testing Windows environment for cross-platform development', 'returned', '2025-09-28 10:00:00', '2025-10-21 09:00:00'),
(4, 4, 2, '2025-11-01', '2025-11-15', 'Performance benchmarking', 'returned', '2025-10-28 14:00:00', '2025-11-16 10:00:00'),
(7, 5, 1, '2025-09-15', '2025-09-30', 'iOS 17 feature testing', 'returned', '2025-09-12 11:00:00', '2025-10-01 14:00:00'),
(12, 7, 2, '2025-10-10', '2025-10-25', 'Client presentation', 'returned', '2025-10-08 09:00:00', '2025-10-26 11:00:00'),
(17, 6, 1, '2025-11-15', '2025-11-30', 'Design review sprint', 'returned', '2025-11-12 13:00:00', '2025-12-01 10:00:00'),

-- Rejected requests
(9, 8, 1, '2025-12-20', '2026-01-05', 'Device needed for maintenance period', 'rejected', '2025-12-15 10:00:00', '2025-12-16 09:00:00');

-- Insert Return Requests for completed borrowings
INSERT INTO return_requests (borrow_request_id, return_date, device_condition, notes, created_at) VALUES
(13, '2025-10-21', 'excellent', 'Device returned in perfect condition', '2025-10-21 09:00:00'),
(14, '2025-11-16', 'good', 'Minor wear on keyboard, functioning perfectly', '2025-11-16 10:00:00'),
(15, '2025-10-01', 'excellent', 'All accessories included', '2025-10-01 14:00:00'),
(16, '2025-10-26', 'good', 'Screen protector has minor scratches', '2025-10-26 11:00:00'),
(17, '2025-12-01', 'excellent', 'Cleaned and ready for next user', '2025-12-01 10:00:00');
