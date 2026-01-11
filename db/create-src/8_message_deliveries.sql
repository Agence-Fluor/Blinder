-- Message deliveries table - tracks which devices have received which messages
-- This enables multi-device message delivery without storing sender information
CREATE TABLE IF NOT EXISTS message_deliveries (
    id BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    webauthn_credential_id INTEGER NOT NULL REFERENCES webauthn_credentials(id) ON DELETE CASCADE,
    delivered_at TIMESTAMP NOT NULL DEFAULT now(),  -- When message was delivered to this device
    read_at TIMESTAMP,  -- When message was read (optional, for read receipts)
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'pending', 'delivered', 'failed'
    UNIQUE(message_id, webauthn_credential_id)
);

-- Create indexes for efficient delivery tracking
CREATE INDEX IF NOT EXISTS idx_deliveries_message ON message_deliveries(message_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_device ON message_deliveries(webauthn_credential_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON message_deliveries(delivery_status, delivered_at) WHERE delivery_status = 'pending';

-- Note: This table links messages to devices (via webauthn_credentials) for multi-device delivery
-- No sender information is stored - only which devices of the destination user received the message

