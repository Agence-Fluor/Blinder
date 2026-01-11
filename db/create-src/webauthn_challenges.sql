-- WebAuthn challenges table - stores temporary challenges for registration and authentication
CREATE TABLE IF NOT EXISTS webauthn_challenges (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,  -- Phone number for the challenge
    challenge TEXT NOT NULL,  -- Base64url encoded challenge
    type VARCHAR(20) NOT NULL,  -- 'registration' or 'authentication'
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    expires_at TIMESTAMP NOT NULL,  -- When the challenge expires
    used BOOLEAN NOT NULL DEFAULT false,  -- Whether the challenge has been used
    user_id INTEGER REFERENCES users(id),  -- For authentication challenges, link to user
    credential_id TEXT  -- For authentication challenges, the credential ID being used
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_webauthn_challenge_phone_expires ON webauthn_challenges(phone, expires_at);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenge_code ON webauthn_challenges(challenge) WHERE used = false;

-- Clean up expired challenges periodically
-- Application logic will check expiration

