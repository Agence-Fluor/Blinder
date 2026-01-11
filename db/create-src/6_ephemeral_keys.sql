-- Ephemeral keys table - stores temporary X25519 ephemeral public keys for key exchange
-- These are used for establishing new session keys (PCS re-keying)
CREATE TABLE IF NOT EXISTS ephemeral_keys (
    id SERIAL PRIMARY KEY,
    destination_phone VARCHAR(20) NOT NULL,  -- Destination phone number (no sender info)
    ephemeral_public_key BYTEA NOT NULL,  -- X25519 ephemeral public key
    key_exchange_id TEXT NOT NULL UNIQUE,  -- Unique identifier for this key exchange
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    expires_at TIMESTAMP NOT NULL,  -- Ephemeral keys expire quickly (e.g., 5 minutes)
    used BOOLEAN NOT NULL DEFAULT false,  -- Whether this key has been used in key exchange
    UNIQUE(destination_phone, key_exchange_id)
);

-- Create indexes for efficient key lookup
CREATE INDEX IF NOT EXISTS idx_ephemeral_destination ON ephemeral_keys(destination_phone, expires_at);
CREATE INDEX IF NOT EXISTS idx_ephemeral_key_exchange_id ON ephemeral_keys(key_exchange_id);
CREATE INDEX IF NOT EXISTS idx_ephemeral_unused ON ephemeral_keys(destination_phone) WHERE used = false;

-- Note: Ephemeral keys are used for X25519 key exchange to establish new session keys
-- They are stored temporarily and deleted after use or expiration
-- No sender information is stored - only destination phone number

