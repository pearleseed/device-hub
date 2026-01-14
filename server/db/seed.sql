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
('QA', 'QA'),
('DEV', 'DEV'),
('CG', 'CG'),
('ADMIN', 'ADMIN'),
('STG', 'STG');

-- Insert Users
-- Password for all users is 'password123' (hashed using Argon2id)
-- Departments: 1=QA, 2=DEV, 3=CG, 4=ADMIN, 5=STG
INSERT INTO users (name, email, password_hash, department_id, role, avatar_url) VALUES
-- QA Department (Superuser and Admins)
('System Admin', 'superuser@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 1, 'superuser', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face'),
('Alex Johnson', 'alex.johnson@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 1, 'admin', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'),
('James Wilson', 'james.wilson@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 1, 'admin', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'),
-- DEV
('Sarah Chen', 'sarah.chen@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 2, 'user', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'),
('David Kim', 'david.kim@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 2, 'user', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'),
('Lisa Wang', 'lisa.wang@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 2, 'user', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'),
-- CG
('Michael Park', 'michael.park@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 3, 'user', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face'),
('Emma Rodriguez', 'emma.rodriguez@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 3, 'user', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'),
-- ADMIN
('Emily Davis', 'emily.davis@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 4, 'user', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'),
('Tom Anderson', 'tom.anderson@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 4, 'user', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face'),
-- STG
('Jennifer Lee', 'jennifer.lee@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 5, 'user', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face'),
('Robert Martinez', 'robert.martinez@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 5, 'user', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face'),
-- Additional QA
('Amanda Foster', 'amanda.foster@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 1, 'user', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face'),
('Kevin Brown', 'kevin.brown@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 1, 'user', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face'),
('Rachel Green', 'rachel.green@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 1, 'admin', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face'),
-- Additional DEV
('Daniel Thompson', 'daniel.thompson@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 2, 'user', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'),
('Michelle Wong', 'michelle.wong@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 2, 'user', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'),
('Chris Taylor', 'chris.taylor@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 2, 'admin', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'),
-- Additional CG
('Jessica Miller', 'jessica.miller@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 3, 'user', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'),
('Brian Clark', 'brian.clark@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 3, 'user', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'),
('Sophia Nguyen', 'sophia.nguyen@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 3, 'user', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'),
-- Additional DEV
('Andrew Scott', 'andrew.scott@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 2, 'user', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face'),
('Olivia Harris', 'olivia.harris@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 2, 'user', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'),
-- Additional CG
('Nathan Lee', 'nathan.lee@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 3, 'user', 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face'),
-- Additional ADMIN
('Victoria Adams', 'victoria.adams@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 4, 'user', 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face'),
('Marcus Johnson', 'marcus.johnson@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 4, 'admin', 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop&crop=face'),
-- Additional QA
('Peter Zhang', 'peter.zhang@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 1, 'user', 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop&crop=face'),
('Linda Chen', 'linda.chen@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 1, 'user', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face'),
-- Additional STG
('Grace Kim', 'grace.kim@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 5, 'admin', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop&crop=face'),
-- Additional QA
('Steven Wright', 'steven.wright@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 1, 'user', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'),
-- Additional DEV
('Amy Liu', 'amy.liu@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 2, 'user', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face'),
('Jason Park', 'jason.park@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 2, 'user', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'),
-- Additional CG
('Diana Ross', 'diana.ross@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 3, 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'),
('Ryan Cooper', 'ryan.cooper@company.com', '$argon2id$v=19$m=19456,t=2,p=1$VLjWR/Tpf/7gCZgNo4C25urAr+1PXoyeAPeF2Ub4auc$VDTkoJqYb8X3OnMvlmWQjnsek00Hq737pDIzRezR07w', 3, 'user', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face');

-- Insert Devices
INSERT INTO devices (name, asset_tag, category, brand, model, status, department_id, purchase_price, purchase_date, warranty_date, vendor, hostname, ip_address, mac_address, specs_json, image_url) VALUES
-- Laptops
('MacBook Pro 16"', 'LAP-001', 'laptop', 'Apple', 'MacBook Pro 16-inch (2024, M3 Pro)', 'available', 1, 2499.00, '2024-01-15', '2027-01-15', 'Apple Store Vietnam', 'MBP16-QA-001', '192.168.1.101', 'A4:83:E7:2B:5C:01', 
 '{"os": "macOS Sonoma 14.2", "processor": "Apple M3 Pro (12-core CPU, 18-core GPU)", "ram": "18GB Unified Memory", "storage": "512GB SSD", "display": "16.2\\" Liquid Retina XDR (3456x2234)", "battery": "22 hours video playback", "weight": "2.14 kg", "ports": "3x Thunderbolt 4, HDMI, SD card, MagSafe 3", "warranty": "1 year AppleCare", "serial_number": "C02XL0ABCD12"}',
 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop'),

('MacBook Pro 14"', 'LAP-002', 'laptop', 'Apple', 'MacBook Pro 14-inch (2024, M3)', 'borrowed', 1, 1999.00, '2024-02-10', '2027-02-10', 'Apple Store Vietnam', 'MBP14-QA-002', '192.168.1.102', 'A4:83:E7:2B:5C:02',
 '{"os": "macOS Sonoma 14.2", "processor": "Apple M3 (8-core CPU, 10-core GPU)", "ram": "16GB Unified Memory", "storage": "512GB SSD", "display": "14.2\\" Liquid Retina XDR (3024x1964)", "battery": "17 hours video playback", "weight": "1.55 kg", "ports": "3x Thunderbolt 4, HDMI, SD card, MagSafe 3", "warranty": "1 year AppleCare", "serial_number": "C02YM1BCDE23"}',
 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=300&fit=crop'),

('ThinkPad X1 Carbon', 'LAP-003', 'laptop', 'Lenovo', 'ThinkPad X1 Carbon Gen 11', 'borrowed', 2, 1849.00, '2024-01-20', '2027-01-20', 'FPT Shop', 'TPX1C-DEV-003', '192.168.1.103', 'B8:27:EB:3A:4D:03',
 '{"os": "Windows 11 Pro 23H2", "processor": "Intel Core i7-1365U (10 cores, 4.8GHz)", "ram": "16GB LPDDR5", "storage": "512GB PCIe Gen4 SSD", "display": "14\\" 2.8K OLED (2880x1800)", "battery": "15 hours", "weight": "1.12 kg", "ports": "2x Thunderbolt 4, 2x USB-A, HDMI 2.0b", "warranty": "3 years on-site", "serial_number": "PF3NXYZ1"}',
 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop'),

('Dell XPS 15', 'LAP-004', 'laptop', 'Dell', 'XPS 15 9530', 'available', 2, 1799.00, '2024-02-15', '2026-02-15', 'Dell Vietnam', 'DXPS15-DEV-004', '192.168.1.104', 'C0:3F:D5:6E:7F:04',
 '{"os": "Windows 11 Pro 23H2", "processor": "Intel Core i7-13700H (14 cores, 5.0GHz)", "ram": "32GB DDR5", "storage": "1TB PCIe Gen4 NVMe SSD", "display": "15.6\\" 3.5K OLED (3456x2160)", "battery": "13 hours", "weight": "1.86 kg", "graphics": "NVIDIA GeForce RTX 4050 6GB", "ports": "2x Thunderbolt 4, USB-C, SD card", "warranty": "1 year ProSupport", "serial_number": "DXPS15ABC1"}',
 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop'),

('MacBook Air M2', 'LAP-005', 'laptop', 'Apple', 'MacBook Air 13-inch (M2)', 'available', 3, 1199.00, '2024-01-10', '2027-01-10', 'Apple Store Vietnam', 'MBA-CG-005', '192.168.1.105', 'A4:83:E7:2B:5C:05',
 '{"os": "macOS Sonoma 14.2", "processor": "Apple M2 (8-core CPU, 8-core GPU)", "ram": "8GB Unified Memory", "storage": "256GB SSD", "display": "13.6\\" Liquid Retina (2560x1664)", "battery": "18 hours video playback", "weight": "1.24 kg", "ports": "2x Thunderbolt/USB 4, MagSafe 3", "warranty": "1 year AppleCare", "serial_number": "C02ZN2CDEF34"}',
 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=300&fit=crop'),

('HP EliteBook 840', 'LAP-006', 'laptop', 'HP', 'EliteBook 840 G10', 'maintenance', 4, 1549.00, '2023-11-05', '2026-11-05', 'HP Vietnam', 'HPEB-ADM-006', '192.168.1.106', 'D4:5D:64:8A:9B:06',
 '{"os": "Windows 11 Pro 23H2", "processor": "Intel Core i5-1345U (10 cores, 4.7GHz)", "ram": "16GB DDR5", "storage": "512GB PCIe NVMe SSD", "display": "14\\" FHD IPS (1920x1080)", "battery": "14 hours", "weight": "1.36 kg", "ports": "2x Thunderbolt 4, 2x USB-A, HDMI 2.0", "warranty": "3 years on-site", "serial_number": "5CG3HPELITE", "maintenance_notes": "Battery replacement scheduled"}',
 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop'),

-- Mobile Phones
('iPhone 15 Pro', 'MOB-001', 'mobile', 'Apple', 'iPhone 15 Pro', 'available', 1, 999.00, '2024-01-20', '2026-01-20', 'Apple Store Vietnam', NULL, NULL, NULL,
 '{"os": "iOS 17.2", "processor": "A17 Pro (6-core CPU, 6-core GPU)", "ram": "8GB", "storage": "256GB", "display": "6.1\\" Super Retina XDR (2556x1179)", "battery": "Up to 23 hours video", "camera": "48MP Main + 12MP Ultra Wide + 12MP Telephoto", "connectivity": "5G, Wi-Fi 6E, Bluetooth 5.3", "weight": "187g", "serial_number": "F2LXYZ123ABC", "imei": "35XXXXXXXXX1234"}',
 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'),

('iPhone 15 Pro Max', 'MOB-002', 'mobile', 'Apple', 'iPhone 15 Pro Max', 'borrowed', 4, 1199.00, '2024-02-01', '2026-02-01', 'Apple Store Vietnam', NULL, NULL, NULL,
 '{"os": "iOS 17.2", "processor": "A17 Pro (6-core CPU, 6-core GPU)", "ram": "8GB", "storage": "512GB", "display": "6.7\\" Super Retina XDR (2796x1290)", "battery": "Up to 29 hours video", "camera": "48MP Main + 12MP Ultra Wide + 12MP 5x Telephoto", "connectivity": "5G, Wi-Fi 6E, Bluetooth 5.3", "weight": "221g", "serial_number": "F2MABC456DEF", "imei": "35XXXXXXXXX5678"}',
 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=300&fit=crop'),

('Samsung Galaxy S24 Ultra', 'MOB-003', 'mobile', 'Samsung', 'Galaxy S24 Ultra', 'maintenance', 1, 1299.00, '2024-02-05', '2026-02-05', 'Samsung Vietnam', NULL, NULL, NULL,
 '{"os": "Android 14 (One UI 6.1)", "processor": "Snapdragon 8 Gen 3 (8-core, 3.3GHz)", "ram": "12GB", "storage": "256GB", "display": "6.8\\" Dynamic AMOLED 2X (3120x1440)", "battery": "5000mAh", "camera": "200MP Main + 12MP Ultra Wide + 50MP 5x + 10MP 3x", "connectivity": "5G, Wi-Fi 7, Bluetooth 5.3", "weight": "232g", "serial_number": "R5CTXYZ789", "imei": "35XXXXXXXXX9012", "maintenance_notes": "Screen repair in progress"}',
 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop'),

('Google Pixel 8 Pro', 'MOB-004', 'mobile', 'Google', 'Pixel 8 Pro', 'available', 2, 999.00, '2024-02-20', '2026-02-20', 'Cellphones', NULL, NULL, NULL,
 '{"os": "Android 14", "processor": "Google Tensor G3 (9-core)", "ram": "12GB", "storage": "128GB", "display": "6.7\\" LTPO OLED (2992x1344)", "battery": "5050mAh", "camera": "50MP Main + 48MP Ultra Wide + 48MP 5x Telephoto", "connectivity": "5G, Wi-Fi 7, Bluetooth 5.3", "weight": "213g", "serial_number": "GPIX8PABC123", "imei": "35XXXXXXXXX3456"}',
 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=300&fit=crop'),

('Samsung Galaxy S24', 'MOB-005', 'mobile', 'Samsung', 'Galaxy S24', 'available', 4, 799.00, '2024-03-01', '2026-03-01', 'Samsung Vietnam', NULL, NULL, NULL,
 '{"os": "Android 14 (One UI 6.1)", "processor": "Exynos 2400 (10-core, 3.2GHz)", "ram": "8GB", "storage": "128GB", "display": "6.2\\" Dynamic AMOLED 2X (2340x1080)", "battery": "4000mAh", "camera": "50MP Main + 12MP Ultra Wide + 10MP 3x Telephoto", "connectivity": "5G, Wi-Fi 6E, Bluetooth 5.3", "weight": "167g", "serial_number": "R5CTS24DEF456", "imei": "35XXXXXXXXX7890"}',
 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop'),

-- Tablets
('iPad Pro 12.9"', 'TAB-001', 'tablet', 'Apple', 'iPad Pro 12.9-inch (M2)', 'available', 3, 1099.00, '2024-01-25', '2026-01-25', 'Apple Store Vietnam', NULL, NULL, NULL,
 '{"os": "iPadOS 17.2", "processor": "Apple M2 (8-core CPU, 10-core GPU)", "ram": "8GB", "storage": "256GB", "display": "12.9\\" Liquid Retina XDR (2732x2048)", "battery": "10 hours", "camera": "12MP Wide + 10MP Ultra Wide", "connectivity": "Wi-Fi 6E, Bluetooth 5.3", "weight": "682g", "accessories": "Apple Pencil 2 compatible", "serial_number": "DMPXYZ123TAB"}',
 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'),

('iPad Pro 11"', 'TAB-002', 'tablet', 'Apple', 'iPad Pro 11-inch (M2)', 'borrowed', 3, 799.00, '2024-02-08', '2026-02-08', 'Apple Store Vietnam', NULL, NULL, NULL,
 '{"os": "iPadOS 17.2", "processor": "Apple M2 (8-core CPU, 10-core GPU)", "ram": "8GB", "storage": "128GB", "display": "11\\" Liquid Retina (2388x1668)", "battery": "10 hours", "camera": "12MP Wide + 10MP Ultra Wide", "connectivity": "Wi-Fi 6E, Bluetooth 5.3", "weight": "466g", "accessories": "Apple Pencil 2 compatible", "serial_number": "DMPXYZ456TAB"}',
 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'),

('Samsung Galaxy Tab S9 Ultra', 'TAB-003', 'tablet', 'Samsung', 'Galaxy Tab S9 Ultra', 'available', 3, 1199.00, '2024-03-10', '2026-03-10', 'Samsung Vietnam', NULL, NULL, NULL,
 '{"os": "Android 14 (One UI 6)", "processor": "Snapdragon 8 Gen 2 (8-core, 3.36GHz)", "ram": "12GB", "storage": "256GB", "display": "14.6\\" Dynamic AMOLED 2X (2960x1848)", "battery": "11200mAh", "camera": "13MP + 8MP Ultra Wide", "connectivity": "Wi-Fi 6E, Bluetooth 5.3", "weight": "732g", "accessories": "S Pen included", "serial_number": "R5CTTAB789XYZ"}',
 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=300&fit=crop'),

('iPad Air', 'TAB-004', 'tablet', 'Apple', 'iPad Air (M1)', 'available', 4, 599.00, '2023-12-15', '2025-12-15', 'Apple Store Vietnam', NULL, NULL, NULL,
 '{"os": "iPadOS 17.2", "processor": "Apple M1 (8-core CPU, 8-core GPU)", "ram": "8GB", "storage": "64GB", "display": "10.9\\" Liquid Retina (2360x1640)", "battery": "10 hours", "camera": "12MP Wide", "connectivity": "Wi-Fi 6, Bluetooth 5.0", "weight": "461g", "accessories": "Apple Pencil 2 compatible", "serial_number": "DMPAIR123ABC"}',
 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'),

-- Monitors
('Dell UltraSharp 27"', 'MON-001', 'monitor', 'Dell', 'UltraSharp U2723QE', 'borrowed', 3, 799.00, '2024-02-01', '2027-02-01', 'Dell Vietnam', NULL, NULL, NULL,
 '{"display": "27\\" 4K UHD IPS", "resolution": "3840x2160", "refresh_rate": "60Hz", "ports": "USB-C, HDMI, DisplayPort"}',
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop'),

('LG UltraWide 34"', 'MON-002', 'monitor', 'LG', '34WN80C-B', 'available', 2, 599.00, '2024-02-08', '2026-02-08', 'LG Vietnam', NULL, NULL, NULL,
 '{"display": "34\\" WQHD IPS Curved", "resolution": "3440x1440", "refresh_rate": "60Hz", "ports": "USB-C, HDMI"}',
 'https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=400&h=300&fit=crop'),

('Samsung Odyssey G7', 'MON-003', 'monitor', 'Samsung', 'Odyssey G7 32"', 'available', 2, 699.00, '2024-01-30', '2026-01-30', 'Samsung Vietnam', NULL, NULL, NULL,
 '{"display": "32\\" QHD VA Curved", "resolution": "2560x1440", "refresh_rate": "240Hz", "ports": "HDMI 2.0, DisplayPort 1.4"}',
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop'),

('Apple Studio Display', 'MON-004', 'monitor', 'Apple', 'Studio Display', 'available', 3, 1599.00, '2024-03-05', '2027-03-05', 'Apple Store Vietnam', NULL, NULL, NULL,
 '{"display": "27\\" 5K Retina", "resolution": "5120x2880", "refresh_rate": "60Hz", "ports": "Thunderbolt 3, USB-C"}',
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop'),

('ASUS ProArt', 'MON-005', 'monitor', 'ASUS', 'ProArt PA279CRV', 'available', 3, 899.00, '2024-02-20', '2027-02-20', 'ASUS Vietnam', NULL, NULL, NULL,
 '{"display": "27\\" 4K IPS", "resolution": "3840x2160", "refresh_rate": "60Hz", "ports": "USB-C, HDMI, DisplayPort"}',
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop'),

-- Accessories
('Magic Keyboard', 'ACC-001', 'accessories', 'Apple', 'Magic Keyboard with Touch ID', 'available', 1, 199.00, '2024-01-05', '2025-01-05', 'Apple Store Vietnam', NULL, NULL, NULL,
 '{"connectivity": "Bluetooth, USB-C", "features": "Touch ID, Backlit keys"}',
 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop'),

('Magic Mouse', 'ACC-002', 'accessories', 'Apple', 'Magic Mouse', 'available', 1, 99.00, '2024-01-05', '2025-01-05', 'Apple Store Vietnam', NULL, NULL, NULL,
 '{"connectivity": "Bluetooth", "features": "Multi-Touch surface"}',
 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop'),

('AirPods Pro', 'ACC-003', 'accessories', 'Apple', 'AirPods Pro (2nd Gen)', 'borrowed', 4, 249.00, '2024-01-12', '2025-01-12', 'Apple Store Vietnam', NULL, NULL, NULL,
 '{"connectivity": "Bluetooth 5.3", "features": "Active Noise Cancellation, Spatial Audio", "battery": "6 hours"}',
 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop'),

('Sony WH-1000XM5', 'ACC-004', 'accessories', 'Sony', 'WH-1000XM5', 'available', 2, 399.00, '2024-02-14', '2025-02-14', 'Sony Store', NULL, NULL, NULL,
 '{"connectivity": "Bluetooth 5.2", "features": "Industry-leading ANC, 30-hour battery", "battery": "30 hours"}',
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'),

('Logitech MX Master 3S', 'ACC-005', 'accessories', 'Logitech', 'MX Master 3S', 'available', 2, 99.00, '2024-01-18', '2026-01-18', 'Logitech Vietnam', NULL, NULL, NULL,
 '{"connectivity": "Bluetooth, USB receiver", "features": "8000 DPI, MagSpeed wheel", "battery": "70 days"}',
 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop'),

('CalDigit TS4', 'ACC-006', 'accessories', 'CalDigit', 'TS4 Thunderbolt 4 Dock', 'available', 1, 399.00, '2024-02-25', '2026-02-25', 'Amazon', NULL, NULL, NULL,
 '{"connectivity": "Thunderbolt 4", "ports": "18 ports including 2.5GbE, SD card reader"}',
 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=300&fit=crop'),

('Elgato Stream Deck', 'ACC-007', 'accessories', 'Elgato', 'Stream Deck MK.2', 'available', 4, 149.00, '2024-03-01', '2026-03-01', 'Tiki', NULL, NULL, NULL,
 '{"connectivity": "USB", "features": "15 customizable LCD keys"}',
 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=300&fit=crop'),

-- Additional Laptops
('Surface Laptop 5', 'LAP-007', 'laptop', 'Microsoft', 'Surface Laptop 5 15"', 'available', 5, 1499.00, '2024-03-15', '2026-03-15', 'Microsoft Store', 'SURFACE-STG-007', '192.168.1.107', 'E0:F8:47:6B:5C:07',
 '{"os": "Windows 11 Pro", "processor": "Intel Core i7-1255U", "ram": "16GB", "storage": "512GB SSD", "display": "15\\" PixelSense", "battery": "17 hours"}',
 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop'),

('ASUS ROG Zephyrus', 'LAP-008', 'laptop', 'ASUS', 'ROG Zephyrus G14', 'borrowed', 2, 1899.00, '2024-02-28', '2026-02-28', 'ASUS Store', 'ROG-DEV-008', '192.168.1.108', 'F4:8E:38:2B:5C:08',
 '{"os": "Windows 11", "processor": "AMD Ryzen 9 7940HS", "ram": "32GB", "storage": "1TB SSD", "display": "14\\" QHD+ 165Hz", "battery": "10 hours"}',
 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop'),

('MacBook Pro 16" M3 Max', 'LAP-009', 'laptop', 'Apple', 'MacBook Pro 16-inch (2024, M3 Max)', 'available', 2, 3499.00, '2024-04-01', '2027-04-01', 'Apple Store Vietnam', 'MBP16-DEV-009', '192.168.1.109', 'A4:83:E7:2B:5C:09',
 '{"os": "macOS Sonoma", "processor": "Apple M3 Max", "ram": "36GB", "storage": "1TB SSD", "display": "16.2\\" Liquid Retina XDR", "battery": "22 hours"}',
 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop'),

('ThinkPad T14s', 'LAP-010', 'laptop', 'Lenovo', 'ThinkPad T14s Gen 4', 'available', 1, 1649.00, '2024-03-20', '2027-03-20', 'Lenovo Store', 'TPT14S-QA-010', '192.168.1.110', 'B8:27:EB:3A:4D:10',
 '{"os": "Windows 11 Pro", "processor": "Intel Core i7-1365U", "ram": "16GB", "storage": "512GB SSD", "display": "14\\" 2.8K OLED", "battery": "13 hours"}',
 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop'),

('Dell Latitude 7440', 'LAP-011', 'laptop', 'Dell', 'Latitude 7440', 'borrowed', 2, 1399.00, '2024-04-10', '2026-04-10', 'Dell Vietnam', 'LAT7440-DEV-011', '192.168.1.111', 'C0:3F:D5:6E:7F:11',
 '{"os": "Windows 11 Pro", "processor": "Intel Core i5-1345U", "ram": "16GB", "storage": "256GB SSD", "display": "14\\" FHD+", "battery": "15 hours"}',
 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop'),

('HP ZBook Studio', 'LAP-012', 'laptop', 'HP', 'ZBook Studio G10', 'available', 3, 2799.00, '2024-03-25', '2027-03-25', 'HP Vietnam', 'ZBOOK-CG-012', '192.168.1.112', 'D4:5D:64:8A:9B:12',
 '{"os": "Windows 11 Pro", "processor": "Intel Core i9-13900H", "ram": "32GB", "storage": "1TB SSD", "display": "16\\" 4K OLED DreamColor", "battery": "10 hours"}',
 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop'),

-- Additional Mobile Phones
('iPhone 14', 'MOB-006', 'mobile', 'Apple', 'iPhone 14', 'available', 5, 699.00, '2024-01-15', '2026-01-15', 'Apple Store Vietnam', NULL, NULL, NULL,
 '{"os": "iOS 17", "processor": "A15 Bionic", "ram": "6GB", "storage": "128GB", "display": "6.1\\" Super Retina XDR", "battery": "Up to 20 hours"}',
 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop'),

('OnePlus 12', 'MOB-007', 'mobile', 'OnePlus', 'OnePlus 12', 'available', 2, 899.00, '2024-04-05', '2026-04-05', 'OnePlus Store', NULL, NULL, NULL,
 '{"os": "Android 14", "processor": "Snapdragon 8 Gen 3", "ram": "16GB", "storage": "256GB", "display": "6.82\\" LTPO AMOLED", "battery": "5400mAh"}',
 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=300&fit=crop'),

('Xiaomi 14 Pro', 'MOB-008', 'mobile', 'Xiaomi', 'Xiaomi 14 Pro', 'borrowed', 3, 999.00, '2024-03-28', '2026-03-28', 'Xiaomi Store', NULL, NULL, NULL,
 '{"os": "Android 14", "processor": "Snapdragon 8 Gen 3", "ram": "12GB", "storage": "256GB", "display": "6.73\\" LTPO AMOLED", "battery": "4880mAh"}',
 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop'),

('Samsung Galaxy Z Fold5', 'MOB-009', 'mobile', 'Samsung', 'Galaxy Z Fold5', 'available', 1, 1799.00, '2024-04-15', '2026-04-15', 'Samsung Vietnam', NULL, NULL, NULL,
 '{"os": "Android 14", "processor": "Snapdragon 8 Gen 2", "ram": "12GB", "storage": "256GB", "display": "7.6\\" Dynamic AMOLED 2X", "battery": "4400mAh"}',
 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop'),

('Google Pixel 8', 'MOB-010', 'mobile', 'Google', 'Pixel 8', 'available', 4, 699.00, '2024-04-20', '2026-04-20', 'Google Store', NULL, NULL, NULL,
 '{"os": "Android 14", "processor": "Google Tensor G3", "ram": "8GB", "storage": "128GB", "display": "6.2\\" OLED", "battery": "4575mAh"}',
 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=300&fit=crop'),

-- Additional Tablets
('iPad Mini', 'TAB-005', 'tablet', 'Apple', 'iPad Mini (6th Gen)', 'available', 3, 499.00, '2024-02-20', '2026-02-20', 'Apple Store Vietnam', NULL, NULL, NULL,
 '{"os": "iPadOS 17", "processor": "Apple A15 Bionic", "ram": "4GB", "storage": "64GB", "display": "8.3\\" Liquid Retina", "battery": "10 hours"}',
 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'),

('Microsoft Surface Pro 9', 'TAB-006', 'tablet', 'Microsoft', 'Surface Pro 9', 'borrowed', 1, 1599.00, '2024-03-12', '2026-03-12', 'Microsoft Store', NULL, NULL, NULL,
 '{"os": "Windows 11", "processor": "Intel Core i7-1255U", "ram": "16GB", "storage": "256GB", "display": "13\\" PixelSense Flow", "battery": "15.5 hours"}',
 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=300&fit=crop'),

('Samsung Galaxy Tab S9+', 'TAB-007', 'tablet', 'Samsung', 'Galaxy Tab S9+', 'available', 4, 999.00, '2024-04-08', '2026-04-08', 'Samsung Vietnam', NULL, NULL, NULL,
 '{"os": "Android 14", "processor": "Snapdragon 8 Gen 2", "ram": "12GB", "storage": "256GB", "display": "12.4\\" Dynamic AMOLED 2X", "battery": "10090mAh"}',
 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=300&fit=crop'),

('Lenovo Tab P12 Pro', 'TAB-008', 'tablet', 'Lenovo', 'Tab P12 Pro', 'available', 2, 699.00, '2024-03-30', '2026-03-30', 'Lenovo Store', NULL, NULL, NULL,
 '{"os": "Android 13", "processor": "Snapdragon 870", "ram": "8GB", "storage": "256GB", "display": "12.6\\" AMOLED", "battery": "10200mAh"}',
 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&h=300&fit=crop'),

-- Additional Monitors
('BenQ PD3220U', 'MON-006', 'monitor', 'BenQ', 'PD3220U', 'available', 3, 1299.00, '2024-04-01', '2027-04-01', 'BenQ Store', NULL, NULL, NULL,
 '{"display": "31.5\\" 4K UHD IPS", "resolution": "3840x2160", "refresh_rate": "60Hz", "ports": "Thunderbolt 3, USB-C, HDMI, DisplayPort"}',
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop'),

('Dell U3423WE', 'MON-007', 'monitor', 'Dell', 'UltraSharp U3423WE', 'borrowed', 2, 1099.00, '2024-03-18', '2027-03-18', 'Dell Vietnam', NULL, NULL, NULL,
 '{"display": "34\\" WQHD IPS Curved", "resolution": "3440x1440", "refresh_rate": "60Hz", "ports": "USB-C 90W, HDMI, DisplayPort"}',
 'https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=400&h=300&fit=crop'),

('LG 27GP950-B', 'MON-008', 'monitor', 'LG', '27GP950-B', 'available', 2, 899.00, '2024-04-12', '2026-04-12', 'LG Vietnam', NULL, NULL, NULL,
 '{"display": "27\\" 4K Nano IPS", "resolution": "3840x2160", "refresh_rate": "144Hz", "ports": "HDMI 2.1, DisplayPort 1.4"}',
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop'),

('ViewSonic VP2786-4K', 'MON-009', 'monitor', 'ViewSonic', 'VP2786-4K', 'available', 3, 749.00, '2024-03-22', '2026-03-22', 'ViewSonic Vietnam', NULL, NULL, NULL,
 '{"display": "27\\" 4K IPS", "resolution": "3840x2160", "refresh_rate": "60Hz", "ports": "USB-C 90W, HDMI, DisplayPort"}',
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop'),

('Samsung Odyssey OLED G9', 'MON-010', 'monitor', 'Samsung', 'Odyssey OLED G9 49"', 'available', 2, 1799.00, '2024-04-25', '2027-04-25', 'Samsung Vietnam', NULL, NULL, NULL,
 '{"display": "49\\" DQHD OLED Curved", "resolution": "5120x1440", "refresh_rate": "240Hz", "ports": "HDMI 2.1, DisplayPort 1.4, USB-C"}',
 'https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=400&h=300&fit=crop'),

-- Additional Accessories
('Keychron Q1 Pro', 'ACC-008', 'accessories', 'Keychron', 'Q1 Pro', 'available', 2, 199.00, '2024-03-10', '2026-03-10', 'Keychron Vietnam', NULL, NULL, NULL,
 '{"connectivity": "Bluetooth 5.1, USB-C", "features": "QMK/VIA, Hot-swappable, RGB"}',
 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop'),

('Bose QuietComfort Ultra', 'ACC-009', 'accessories', 'Bose', 'QuietComfort Ultra Headphones', 'borrowed', 4, 429.00, '2024-04-02', '2025-04-02', 'Bose Store', NULL, NULL, NULL,
 '{"connectivity": "Bluetooth 5.3", "features": "Immersive Audio, CustomTune", "battery": "24 hours"}',
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'),

('Logitech StreamCam', 'ACC-010', 'accessories', 'Logitech', 'StreamCam', 'available', 4, 169.00, '2024-03-15', '2026-03-15', 'Logitech Vietnam', NULL, NULL, NULL,
 '{"connectivity": "USB-C", "features": "1080p 60fps, Auto-focus, AI face tracking"}',
 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=300&fit=crop'),

('Apple Magic Trackpad', 'ACC-011', 'accessories', 'Apple', 'Magic Trackpad', 'available', 1, 149.00, '2024-02-28', '2025-02-28', 'Apple Store Vietnam', NULL, NULL, NULL,
 '{"connectivity": "Bluetooth, USB-C", "features": "Multi-Touch, Force Touch"}',
 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop'),

('Anker PowerConf S500', 'ACC-012', 'accessories', 'Anker', 'PowerConf S500', 'available', 5, 229.00, '2024-04-08', '2026-04-08', 'Anker Vietnam', NULL, NULL, NULL,
 '{"connectivity": "Bluetooth, USB-C", "features": "360° voice pickup, AI noise cancellation"}',
 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=300&fit=crop'),

('Samsung T7 Shield SSD', 'ACC-013', 'accessories', 'Samsung', 'T7 Shield 2TB', 'available', 2, 189.00, '2024-03-20', '2027-03-20', 'Samsung Vietnam', NULL, NULL, NULL,
 '{"connectivity": "USB 3.2 Gen 2", "features": "IP65 rated, 1050MB/s read speed"}',
 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=300&fit=crop'),

('Jabra Speak 750', 'ACC-014', 'accessories', 'Jabra', 'Speak 750', 'borrowed', 2, 349.00, '2024-04-15', '2026-04-15', 'Jabra Vietnam', NULL, NULL, NULL,
 '{"connectivity": "Bluetooth, USB", "features": "Full duplex audio, Link button for Microsoft Teams"}',
 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=300&fit=crop'),

('Razer Kiyo Pro', 'ACC-015', 'accessories', 'Razer', 'Kiyo Pro', 'available', 4, 199.00, '2024-03-28', '2026-03-28', 'Razer Vietnam', NULL, NULL, NULL,
 '{"connectivity": "USB 3.0", "features": "1080p 60fps, HDR, Adaptive light sensor"}',
 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=300&fit=crop'),

('Belkin Thunderbolt 4 Dock', 'ACC-016', 'accessories', 'Belkin', 'Thunderbolt 4 Dock Pro', 'available', 1, 449.00, '2024-04-20', '2026-04-20', 'Belkin Store', NULL, NULL, NULL,
 '{"connectivity": "Thunderbolt 4", "ports": "12 ports, 90W charging, Dual 4K support"}',
 'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400&h=300&fit=crop'),

('Rode NT-USB Mini', 'ACC-017', 'accessories', 'Rode', 'NT-USB Mini', 'available', 4, 99.00, '2024-04-05', '2026-04-05', 'Rode Vietnam', NULL, NULL, NULL,
 '{"connectivity": "USB", "features": "Studio-quality condenser, Headphone output"}',
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
(9, 8, 1, '2025-12-20', '2026-01-05', 'Device needed for maintenance period', 'rejected', '2025-12-15 10:00:00', '2025-12-16 09:00:00'),

-- Additional Active borrowings for new devices
(28, 22, 1, '2025-12-20', '2026-01-20', 'Game development testing on high-performance laptop', 'active', '2025-12-18 09:00:00', '2025-12-19 10:00:00'),
(31, 16, 2, '2025-12-22', '2026-01-15', 'Remote work setup for Operations team', 'active', '2025-12-20 11:00:00', '2025-12-21 14:00:00'),
(33, 19, 1, '2025-12-18', '2026-01-08', 'Sales demo device for client meetings', 'active', '2025-12-16 10:00:00', '2025-12-17 09:00:00'),
(36, 13, 2, '2025-12-25', '2026-01-20', 'Financial reporting and presentations', 'active', '2025-12-23 14:00:00', '2025-12-24 11:00:00'),
(42, 5, 1, '2025-12-28', '2026-01-25', 'Engineering team ultrawide monitor for code review', 'active', '2025-12-26 09:00:00', '2025-12-27 10:00:00'),
(44, 9, 2, '2025-12-30', '2026-01-18', 'Marketing campaign video calls', 'active', '2025-12-28 11:00:00', '2025-12-29 14:00:00'),
(49, 17, 1, '2026-01-02', '2026-01-25', 'Operations team conference calls', 'active', '2025-12-31 10:00:00', '2026-01-01 09:00:00'),

-- Additional Pending requests
(29, 23, NULL, '2026-01-25', '2026-02-20', 'High-end laptop for 3D rendering project', 'pending', '2026-01-08 09:00:00', '2026-01-08 09:00:00'),
(34, 20, NULL, '2026-01-20', '2026-02-05', 'Tablet for field sales presentations', 'pending', '2026-01-09 11:00:00', '2026-01-09 11:00:00'),
(38, 24, NULL, '2026-01-28', '2026-02-15', 'iPad Mini for travel and quick notes', 'pending', '2026-01-10 14:00:00', '2026-01-10 14:00:00'),
(45, 26, NULL, '2026-01-22', '2026-02-08', 'Webcam for remote training sessions', 'pending', '2026-01-10 16:00:00', '2026-01-10 16:00:00'),
(30, 27, NULL, '2026-02-01', '2026-02-28', 'Workstation laptop for data analysis', 'pending', '2026-01-11 09:30:00', '2026-01-11 09:30:00'),

-- Additional Approved requests
(32, 21, 1, '2026-01-15', '2026-02-01', 'OnePlus for Android development testing', 'approved', '2026-01-08 10:00:00', '2026-01-09 14:00:00'),
(37, 25, 2, '2026-01-18', '2026-02-10', 'Galaxy Tab for design mockup reviews', 'approved', '2026-01-09 09:00:00', '2026-01-10 11:00:00'),
(41, 28, 1, '2026-01-20', '2026-02-05', 'BenQ monitor for color-accurate design work', 'approved', '2026-01-10 10:00:00', '2026-01-11 14:00:00'),

-- Additional Historical returned requests
(27, 4, 1, '2025-08-01', '2025-08-20', 'Surface Laptop for HR onboarding presentations', 'returned', '2025-07-28 10:00:00', '2025-08-21 09:00:00'),
(32, 6, 2, '2025-09-01', '2025-09-15', 'OnePlus testing for app compatibility', 'returned', '2025-08-28 14:00:00', '2025-09-16 10:00:00'),
(35, 11, 1, '2025-08-15', '2025-08-30', 'iPad Mini for quick field notes', 'returned', '2025-08-12 11:00:00', '2025-08-31 14:00:00'),
(39, 14, 2, '2025-09-10', '2025-09-25', 'Tab P12 for warehouse inventory management', 'returned', '2025-09-08 09:00:00', '2025-09-26 11:00:00'),
(43, 7, 1, '2025-10-15', '2025-10-30', 'Gaming monitor for UI testing at high refresh rates', 'returned', '2025-10-12 13:00:00', '2025-10-31 10:00:00'),
(46, 18, 2, '2025-11-01', '2025-11-20', 'Keychron keyboard for ergonomic typing', 'returned', '2025-10-28 10:00:00', '2025-11-21 09:00:00'),
(48, 12, 1, '2025-11-10', '2025-11-25', 'Samsung SSD for large file transfers', 'returned', '2025-11-08 14:00:00', '2025-11-26 10:00:00'),

-- Additional Rejected requests
(29, 15, 1, '2025-11-20', '2025-12-05', 'Device reserved for executive use', 'rejected', '2025-11-15 10:00:00', '2025-11-16 09:00:00'),
(45, 10, 2, '2025-12-01', '2025-12-15', 'Webcam out of stock for maintenance', 'rejected', '2025-11-28 11:00:00', '2025-11-29 14:00:00');

-- Insert Return Requests for completed borrowings
INSERT INTO return_requests (borrow_request_id, return_date, device_condition, notes, created_at) VALUES
(13, '2025-10-21', 'excellent', 'Device returned in perfect condition', '2025-10-21 09:00:00'),
(14, '2025-11-16', 'good', 'Minor wear on keyboard, functioning perfectly', '2025-11-16 10:00:00'),
(15, '2025-10-01', 'excellent', 'All accessories included', '2025-10-01 14:00:00'),
(16, '2025-10-26', 'good', 'Screen protector has minor scratches', '2025-10-26 11:00:00'),
(17, '2025-12-01', 'excellent', 'Cleaned and ready for next user', '2025-12-01 10:00:00'),
-- Additional return requests
(26, '2025-08-21', 'excellent', 'Surface Laptop returned with all accessories', '2025-08-21 09:00:00'),
(27, '2025-09-16', 'good', 'Phone case has minor scratches', '2025-09-16 10:00:00'),
(28, '2025-08-31', 'excellent', 'iPad Mini in pristine condition', '2025-08-31 14:00:00'),
(29, '2025-09-26', 'good', 'Tablet stylus tip worn, replaced', '2025-09-26 11:00:00'),
(30, '2025-10-31', 'excellent', 'Monitor cleaned and calibrated', '2025-10-31 10:00:00'),
(31, '2025-11-21', 'excellent', 'Keyboard returned with original packaging', '2025-11-21 09:00:00'),
(32, '2025-11-26', 'good', 'SSD functioning perfectly, minor cosmetic wear', '2025-11-26 10:00:00');
