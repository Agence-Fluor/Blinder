-- OTP codes table - stores OTP codes for phone verification
CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,  -- 6-digit OTP code
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    expires_at TIMESTAMP NOT NULL,  -- OTP expires after 10 minutes
    used BOOLEAN NOT NULL DEFAULT false,  -- Whether the OTP has been used
    verified_at TIMESTAMP  -- When the OTP was verified
);

-- Create index on phone and expires_at for fast lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone_expires ON otp_codes(phone, expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_codes(code) WHERE used = false;

-- Clean up expired OTPs periodically (can be done with a scheduled job)
-- For now, we'll rely on application logic to check expiration

