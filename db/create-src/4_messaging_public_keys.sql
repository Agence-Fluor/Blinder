-- Messaging public keys table - stores X25519 public keys signed with ED25519 identity keys
-- Users publish their msg_pk signed with their id_sk for authentication
CREATE TABLE IF NOT EXISTS messaging_public_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    x25519_public_key BYTEA NOT NULL,  -- X25519 messaging public key (msg_pk)
    ed25519_signature BYTEA NOT NULL,  -- ED25519 signature of msg_pk (signed with id_sk)
    ed25519_public_key BYTEA NOT NULL,  -- ED25519 identity public key (id_pk) for verification
    key_version INTEGER NOT NULL DEFAULT 1,  -- Key version for key rotation
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    revoked_at TIMESTAMP,  -- When this key was revoked (for key rotation)
    is_active BOOLEAN NOT NULL DEFAULT true,  -- Whether this key is currently active
    UNIQUE(user_id, key_version)
);

-- Create indexes for efficient key lookup
CREATE INDEX IF NOT EXISTS idx_messaging_pk_user_active ON messaging_public_keys(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_messaging_pk_user_version ON messaging_public_keys(user_id, key_version);

-- Note: This table stores public keys that are used for X25519 key exchange
-- The ED25519 signature ensures authenticity - only the holder of id_sk can publish msg_pk
-- No relationship data is stored - keys are looked up by user_id (which maps to phone number)

