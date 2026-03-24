-- Create gift_transactions table for storing gift history
CREATE TABLE IF NOT EXISTS gift_transactions (
    id BIGSERIAL PRIMARY KEY,
    gift_id BIGINT NOT NULL,
    gift_name VARCHAR(255) NOT NULL,
    gift_value INTEGER NOT NULL,
    from_user_id VARCHAR(255) NOT NULL,
    from_username VARCHAR(255),
    to_user_id VARCHAR(255) NOT NULL,
    to_username VARCHAR(255),
    session_id VARCHAR(255),
    session_type VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gift_transactions_from_user ON gift_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_to_user ON gift_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_session ON gift_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_created_at ON gift_transactions(created_at DESC);

-- Add comment to table
COMMENT ON TABLE gift_transactions IS 'Stores history of all gifts sent during live sessions';
