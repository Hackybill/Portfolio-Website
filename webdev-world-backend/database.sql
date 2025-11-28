-- ============================================================
-- DATABASE CREATION
-- ============================================================

CREATE DATABASE IF NOT EXISTS webdev_world;
USE webdev_world;

-- ============================================================
-- USERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    city VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- ============================================================
-- CONTACT MESSAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    topic VARCHAR(100) DEFAULT 'General',
    message TEXT NOT NULL,
    status ENUM('pending', 'read', 'replied') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- ============================================================
-- USER SESSIONS TABLE (Optional - for session management)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token(255)),
    INDEX idx_user (user_id)
);

-- ============================================================
-- USER ACTIVITY LOG TABLE (Optional - for tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
);

-- ============================================================
-- PASSWORD RESET TOKENS TABLE (Optional - for forgot password)
-- ============================================================

CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token)
);

-- ============================================================
-- SAMPLE DATA (for testing)
-- ============================================================

-- Insert sample user (password: "test123")
INSERT INTO users (full_name, email, username, password, city) VALUES 
('John Doe', 'john@example.com', 'johndoe', '$2a$10$XQ8c1qVCJ8eF7YZ6P3mHCeN9xR4KvN5YqL8tE2wN5xR4KvN5YqL8t', 'Jaipur'),
('Jane Smith', 'jane@example.com', 'janesmith', '$2a$10$XQ8c1qVCJ8eF7YZ6P3mHCeN9xR4KvN5YqL8tE2wN5xR4KvN5YqL8t', 'Ajmer');

-- Insert sample contact messages
INSERT INTO contact_messages (name, email, topic, message) VALUES 
('Alice Johnson', 'alice@example.com', 'General question', 'I love your website! How can I learn web development?'),
('Bob Williams', 'bob@example.com', 'Collaboration', 'Interested in collaborating on a project.'),
('Charlie Brown', 'charlie@example.com', 'Bug report', 'Found a small issue on the registration page.');

-- ============================================================
-- USEFUL QUERIES
-- ============================================================

-- Count total users
-- SELECT COUNT(*) as total_users FROM users;

-- Get recent contact messages
-- SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 10;

-- Find user by email
-- SELECT * FROM users WHERE email = 'john@example.com';

-- Get user activity
-- SELECT u.username, a.action, a.description, a.created_at 
-- FROM activity_log a 
-- JOIN users u ON a.user_id = u.id 
-- ORDER BY a.created_at DESC LIMIT 20;

-- ============================================================
-- ADMIN USER (Optional)
-- ============================================================

-- Create admin table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    role ENUM('admin', 'super_admin') DEFAULT 'admin',
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Additional indexes for better performance
CREATE INDEX idx_user_created ON users(created_at);
CREATE INDEX idx_user_active ON users(is_active);
CREATE INDEX idx_contact_email ON contact_messages(email);

-- ============================================================
-- STORED PROCEDURES (Optional)
-- ============================================================

DELIMITER //

-- Procedure to get user statistics
CREATE PROCEDURE GetUserStats()
BEGIN
    SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_registrations,
        COUNT(CASE WHEN DATE(last_login) = CURDATE() THEN 1 END) as today_logins,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users
    FROM users;
END //

-- Procedure to get contact message statistics
CREATE PROCEDURE GetContactStats()
BEGIN
    SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_messages,
        COUNT(CASE WHEN status = 'read' THEN 1 END) as read_messages,
        COUNT(CASE WHEN status = 'replied' THEN 1 END) as replied_messages
    FROM contact_messages;
END //

DELIMITER ;

-- ============================================================
-- TRIGGERS (Optional - for automatic logging)
-- ============================================================

DELIMITER //

-- Log user registration
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO activity_log (user_id, action, description)
    VALUES (NEW.id, 'USER_REGISTERED', CONCAT('User ', NEW.username, ' registered'));
END //

-- Log user login
CREATE TRIGGER after_user_login
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.last_login != OLD.last_login THEN
        INSERT INTO activity_log (user_id, action, description)
        VALUES (NEW.id, 'USER_LOGIN', CONCAT('User ', NEW.username, ' logged in'));
    END IF;
END //

DELIMITER ;

-- ============================================================
-- CLEANUP QUERIES (for maintenance)
-- ============================================================

-- Delete expired password reset tokens
-- DELETE FROM password_resets WHERE expires_at < NOW() OR used = TRUE;

-- Delete old activity logs (older than 90 days)
-- DELETE FROM activity_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Delete expired sessions
-- DELETE FROM user_sessions WHERE expires_at < NOW();