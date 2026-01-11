-- Messages table - stores encrypted messages with destination phone number only
-- NO sender information is stored to prevent relationship tracking
CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    destination_phone VARCHAR(20) NOT NULL,  -- Only destination phone number (no sender info)
    encrypted_content BYTEA NOT NULL,  -- Encrypted message content (AES-GCM or similar)
    message_id TEXT NOT NULL,  -- Unique message identifier (for ordering and replay protection)
    timestamp TIMESTAMP NOT NULL DEFAULT now(),  -- Message timestamp for ordering
    created_at TIMESTAMP NOT NULL DEFAULT now(),  -- When message was stored
    expires_at TIMESTAMP,  -- Optional: message expiration (for ephemeral messages)
    message_type VARCHAR(20) DEFAULT 'text'  -- Message type: 'text', 'media', 'system', etc.
);

-- Create indexes for efficient message retrieval
CREATE INDEX IF NOT EXISTS idx_messages_destination_phone ON messages(destination_phone);
CREATE INDEX IF NOT EXISTS idx_messages_destination_timestamp ON messages(destination_phone, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id);
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at) WHERE expires_at IS NOT NULL;

-- Note: No foreign key to users table to avoid relationship tracking
-- Messages are looked up by destination_phone only

