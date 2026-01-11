-- WebAuthn credentials table - stores WebAuthn public key credentials
CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,  -- Base64url encoded credential ID
    public_key BYTEA NOT NULL,  -- Public key (binary format)
    counter BIGINT NOT NULL DEFAULT 0,  -- Signature counter for replay protection
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    last_used_at TIMESTAMP,  -- Last time this credential was used
    device_name TEXT,  -- Optional: user-friendly device name
    UNIQUE(user_id, credential_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_webauthn_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credential_id ON webauthn_credentials(credential_id);

