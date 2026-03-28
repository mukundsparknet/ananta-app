-- Create mic_requests table
CREATE TABLE IF NOT EXISTS mic_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    requester_user_id VARCHAR(255) NOT NULL,
    host_user_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_requester_user_id (requester_user_id),
    INDEX idx_host_user_id (host_user_id),
    INDEX idx_status (status)
);

-- Create live_session_mic_users table for active mic users
CREATE TABLE IF NOT EXISTS live_session_mic_users (
    session_id BIGINT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (session_id, user_id),
    FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE
);