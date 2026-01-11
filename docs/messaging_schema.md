# Secure Messaging Database Schema

## Overview
This schema implements a privacy-preserving secure messaging protocol that stores **only destination phone numbers** and **encrypted content**, with **no sender information** or **relationship data**. The design supports multi-device messaging, Forward Confidentiality Security (FCS), and Post-Compromise Security (PCS) through encrypted session keys and key rotation.

## Privacy Principles

1. **Destination-Only Storage**: Only destination phone numbers are stored - no sender information
2. **No Relationship Tracking**: The server cannot determine who communicates with whom
3. **Encrypted Content Only**: All message content is encrypted - server never sees plaintext
4. **Device-Specific Encryption**: Session keys are encrypted per device for multi-device support
5. **Data Minimization**: Only essential routing and delivery metadata is stored

## Tables

### 1. `messages`
Stores encrypted messages with destination phone number only.

**Columns:**
- `id` (BIGSERIAL PRIMARY KEY) - Unique message identifier
- `destination_phone` (VARCHAR(20) NOT NULL) - **Only destination phone number** (no sender info)
- `encrypted_content` (BYTEA NOT NULL) - Encrypted message content (AES-GCM)
- `message_id` (TEXT NOT NULL) - Unique message identifier for ordering and replay protection
- `timestamp` (TIMESTAMP) - Message timestamp for ordering
- `created_at` (TIMESTAMP) - When message was stored
- `expires_at` (TIMESTAMP) - Optional message expiration (for ephemeral messages)
- `message_type` (VARCHAR(20)) - Message type: 'text', 'media', 'system', etc.

**Indexes:**
- `idx_messages_destination_phone` - Fast lookup by destination phone
- `idx_messages_destination_timestamp` - Fast lookup by destination and timestamp (for message history)
- `idx_messages_message_id` - Fast lookup by message_id (for deduplication)
- `idx_messages_expires_at` - Fast lookup of expiring messages

**Privacy Notes:**
- No foreign key to users table to avoid relationship tracking
- Messages are looked up by `destination_phone` only
- No sender information is stored

### 2. `device_session_keys`
Stores encrypted session keys per device for FCS/PCS support.

**Columns:**
- `id` (SERIAL PRIMARY KEY) - Unique session key record identifier
- `user_id` (INTEGER NOT NULL) - Foreign key to users.id
- `webauthn_credential_id` (INTEGER) - Foreign key to webauthn_credentials.id (device identifier)
- `session_key_id` (TEXT NOT NULL) - Unique identifier for this session key
- `encrypted_session_key` (BYTEA NOT NULL) - Session key encrypted with device-specific key
- `key_rotation_counter` (BIGINT) - Counter for key rotation (FCS/PCS)
- `created_at` (TIMESTAMP) - When this session key was created
- `expires_at` (TIMESTAMP) - When this session key expires (for automatic rotation)
- `is_active` (BOOLEAN) - Whether this session key is currently active

**Constraints:**
- Unique constraint on `(user_id, session_key_id, webauthn_credential_id)`
- Foreign key to `users(id)` with CASCADE DELETE
- Foreign key to `webauthn_credentials(id)` with CASCADE DELETE

**Indexes:**
- `idx_device_session_user_device` - Fast lookup by user and device
- `idx_device_session_active` - Fast lookup of active session keys per device
- `idx_device_session_key_id` - Fast lookup by session_key_id
- `idx_device_session_expires` - Fast lookup of expiring keys

**Privacy Notes:**
- Session keys are encrypted per device (using device-specific keys)
- Supports multi-device scenarios - each device has its own encrypted copy
- Key rotation enables FCS (past messages protected) and PCS (future messages protected)

### 3. `message_deliveries`
Tracks which devices have received which messages (multi-device support).

**Columns:**
- `id` (BIGSERIAL PRIMARY KEY) - Unique delivery record identifier
- `message_id` (BIGINT NOT NULL) - Foreign key to messages.id
- `webauthn_credential_id` (INTEGER NOT NULL) - Foreign key to webauthn_credentials.id (device)
- `delivered_at` (TIMESTAMP) - When message was delivered to this device
- `read_at` (TIMESTAMP) - When message was read (optional, for read receipts)
- `delivery_status` (VARCHAR(20)) - 'pending', 'delivered', 'failed'

**Constraints:**
- Unique constraint on `(message_id, webauthn_credential_id)`
- Foreign key to `messages(id)` with CASCADE DELETE
- Foreign key to `webauthn_credentials(id)` with CASCADE DELETE

**Indexes:**
- `idx_deliveries_message` - Fast lookup by message
- `idx_deliveries_device` - Fast lookup by device
- `idx_deliveries_status` - Fast lookup of pending deliveries

**Privacy Notes:**
- Links messages to devices (via webauthn_credentials) for multi-device delivery
- No sender information is stored
- Only tracks which devices of the destination user received the message

### 4. `ephemeral_keys`
Stores temporary X25519 ephemeral public keys for key exchange (PCS re-keying).

**Columns:**
- `id` (SERIAL PRIMARY KEY) - Unique ephemeral key record identifier
- `destination_phone` (VARCHAR(20) NOT NULL) - Destination phone number (no sender info)
- `ephemeral_public_key` (BYTEA NOT NULL) - X25519 ephemeral public key
- `key_exchange_id` (TEXT NOT NULL UNIQUE) - Unique identifier for this key exchange
- `created_at` (TIMESTAMP) - When this key was created
- `expires_at` (TIMESTAMP NOT NULL) - When this key expires (e.g., 5 minutes)
- `used` (BOOLEAN) - Whether this key has been used in key exchange

**Constraints:**
- Unique constraint on `(destination_phone, key_exchange_id)`
- Unique constraint on `key_exchange_id`

**Indexes:**
- `idx_ephemeral_destination` - Fast lookup by destination and expiration
- `idx_ephemeral_key_exchange_id` - Fast lookup by key_exchange_id
- `idx_ephemeral_unused` - Fast lookup of unused, unexpired keys

**Privacy Notes:**
- Used for X25519 key exchange to establish new session keys (PCS)
- Stored temporarily and deleted after use or expiration
- No sender information is stored - only destination phone number

### 5. `messaging_public_keys`
Stores X25519 public keys signed with ED25519 identity keys for authentication.

**Columns:**
- `id` (SERIAL PRIMARY KEY) - Unique public key record identifier
- `user_id` (INTEGER NOT NULL) - Foreign key to users.id
- `x25519_public_key` (BYTEA NOT NULL) - X25519 messaging public key (msg_pk)
- `ed25519_signature` (BYTEA NOT NULL) - ED25519 signature of msg_pk (signed with id_sk)
- `ed25519_public_key` (BYTEA NOT NULL) - ED25519 identity public key (id_pk) for verification
- `key_version` (INTEGER NOT NULL) - Key version for key rotation
- `created_at` (TIMESTAMP) - When this key was published
- `revoked_at` (TIMESTAMP) - When this key was revoked (for key rotation)
- `is_active` (BOOLEAN) - Whether this key is currently active

**Constraints:**
- Unique constraint on `(user_id, key_version)`
- Foreign key to `users(id)` with CASCADE DELETE

**Indexes:**
- `idx_messaging_pk_user_active` - Fast lookup of active keys by user
- `idx_messaging_pk_user_version` - Fast lookup by user and version

**Privacy Notes:**
- Stores public keys used for X25519 key exchange
- ED25519 signature ensures authenticity - only holder of id_sk can publish msg_pk
- No relationship data is stored - keys are looked up by user_id (which maps to phone number)

## Relationships

```
users (1) ──< (many) webauthn_credentials
users (1) ──< (many) messaging_public_keys
users (1) ──< (many) device_session_keys
messages (1) ──< (many) message_deliveries
webauthn_credentials (1) ──< (many) message_deliveries
webauthn_credentials (1) ──< (many) device_session_keys
```

## Message Flow

1. **Message Sending:**
   - Sender encrypts message with session key
   - Sender stores message with `destination_phone` only (no sender info)
   - Server routes message to all devices of destination user

2. **Multi-Device Delivery:**
   - Server looks up destination user by phone number
   - Server finds all active devices (webauthn_credentials) for that user
   - Server creates delivery records for each device
   - Each device retrieves messages and decrypts with its device-specific session keys

3. **Key Exchange (PCS):**
   - Sender generates X25519 ephemeral key pair
   - Sender stores ephemeral public key with destination_phone
   - Destination retrieves ephemeral key and performs key exchange
   - New session key is established and encrypted per device

4. **Session Key Rotation (FCS/PCS):**
   - Session keys are rotated periodically
   - Old keys are marked inactive but retained for decrypting old messages
   - New keys are encrypted per device and stored in device_session_keys

## Security Properties

- **Forward Confidentiality Security (FCS)**: Past messages remain secure even if current session key is compromised (via key rotation)
- **Post-Compromise Security (PCS)**: Future messages remain secure after key compromise (via re-keying)
- **No Relationship Tracking**: Server cannot determine communication patterns
- **Multi-Device Support**: Each device has its own encrypted session keys
- **Authenticity**: ED25519 signatures ensure public keys are authentic

## Data Minimization

- No sender information stored
- No relationship tables
- Only destination phone numbers for routing
- Encrypted content only
- Minimal metadata (timestamp, message_id for ordering)

