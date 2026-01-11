-- Device session keys table - stores encrypted session keys per device for FCS/PCS
-- Session keys are encrypted with device-specific keys (derived from WebAuthn or device keys)
CREATE TABLE IF NOT EXISTS device_session_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    webauthn_credential_id INTEGER REFERENCES webauthn_credentials(id) ON DELETE CASCADE,
    session_key_id TEXT NOT NULL,  -- Unique identifier for this session key
    encrypted_session_key BYTEA NOT NULL,  -- Session key encrypted with device-specific key
    key_rotation_counter BIGINT NOT NULL DEFAULT 0,  -- Counter for key rotation (FCS/PCS)
    created_at TIMESTAMP NOT NULL DEFAULT now(),  -- When this session key was created
    expires_at TIMESTAMP,  -- When this session key expires (for automatic rotation)
    is_active BOOLEAN NOT NULL DEFAULT true,  -- Whether this session key is currently active
    UNIQUE(user_id, session_key_id, webauthn_credential_id)
);

-- Create indexes for efficient key lookup
CREATE INDEX IF NOT EXISTS idx_device_session_user_device ON device_session_keys(user_id, webauthn_credential_id);
CREATE INDEX IF NOT EXISTS idx_device_session_active ON device_session_keys(user_id, webauthn_credential_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_device_session_key_id ON device_session_keys(session_key_id);
CREATE INDEX IF NOT EXISTS idx_device_session_expires ON device_session_keys(expires_at) WHERE expires_at IS NOT NULL;

-- Note: Session keys are encrypted per device to support multi-device scenarios
-- Each device has its own encrypted copy of session keys

