-- Users table - stores user accounts
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE,  -- Phone number (e.g., +33123456789) - can be NULL initially
    fhe_pk TEXT,  -- Fully Homomorphic Encryption public key (optional, set after onboarding)
    msg_pk TEXT,  -- Messaging public key (optional, set after onboarding)
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    last_activity TIMESTAMP
);

-- Create index on phone for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
