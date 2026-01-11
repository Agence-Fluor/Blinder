// Encryption service for IndexedDB data (profile + messages)
// Uses AES-GCM with PBKDF2 key derivation

// Derive AES key from password using PBKDF2
async function deriveAESKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 200_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt data (profile or messages) with password
export async function encryptData(
  data: unknown,
  password: string
): Promise<{ encrypted: ArrayBuffer; salt: Uint8Array; iv: Uint8Array }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const aesKey = await deriveAESKey(password, salt);
  const dataJson = JSON.stringify(data);
  const dataBytes = new TextEncoder().encode(dataJson);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    dataBytes
  );

  return { encrypted, salt, iv };
}

// Decrypt data with password
export async function decryptData(
  encrypted: ArrayBuffer,
  salt: Uint8Array,
  iv: Uint8Array,
  password: string
): Promise<unknown> {
  const aesKey = await deriveAESKey(password, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encrypted
  );

  const decryptedJson = new TextDecoder().decode(decrypted);
  return JSON.parse(decryptedJson);
}

// Generate a short code (6-8 characters) for manual entry
export function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Derive full password from short code using PBKDF2
// This creates a strong password from the short code
export async function derivePasswordFromCode(shortCode: string): Promise<string> {
  // Use a fixed salt for code derivation (not for encryption!)
  // This ensures the same code always produces the same password
  const fixedSalt = new TextEncoder().encode('blinder-code-derivation-salt-v1');
  
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(shortCode),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fixedSalt,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    baseKey,
    256 // 32 bytes = 256 bits
  );

  // Convert to base64url for easy transmission
  const bytes = new Uint8Array(derivedBits);
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  const base64 = btoa(binary);
  
  // Convert to base64url (URL-safe)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

