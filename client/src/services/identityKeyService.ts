// Identity key service for ED25519 keys used for authentication

import { loadProfile } from './indexedDbService';

// Store identity keys in IndexedDB
const IDENTITY_KEY_STORE = 'identity_keys';

export interface IdentityKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
  publicKeyBytes: Uint8Array;
  createdAt: number;
}

let cachedIdentityKey: IdentityKeyPair | null = null;

// Generate or load identity key pair (ED25519)
export async function getOrCreateIdentityKey(): Promise<IdentityKeyPair> {
  if (cachedIdentityKey) {
    return cachedIdentityKey;
  }

  // Try to load from IndexedDB
  const profile = await loadProfile();
  if (!profile) {
    throw new Error('No profile found. Please complete onboarding first.');
  }

  const db = await openDB();
  const identityKeyData = await getFromDB(db, 'identity_key');

  if (identityKeyData) {
    // Import existing keys
    const publicKey = await crypto.subtle.importKey(
      'raw',
      identityKeyData.publicKeyBytes,
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    // For private key, we need to decrypt it if it's encrypted
    // For now, assume it's stored securely (non-extractable)
    // In production, decrypt from encrypted storage
    const privateKey = await crypto.subtle.importKey(
      'raw',
      identityKeyData.privateKeyBytes, // This should be decrypted
      { name: 'Ed25519' },
      false,
      ['sign']
    );

    cachedIdentityKey = {
      publicKey,
      privateKey,
      publicKeyBytes: identityKeyData.publicKeyBytes,
      createdAt: identityKeyData.createdAt,
    };
    return cachedIdentityKey;
  }

  // Generate new identity key pair
  const keyPair = await crypto.subtle.generateKey(
    { name: 'Ed25519' },
    true, // Extractable temporarily
    ['sign', 'verify']
  );

  // Export keys
  const publicKeyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
  const privateKeyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.privateKey));

  // Re-import as non-extractable
  const publicKey = await crypto.subtle.importKey(
    'raw',
    publicKeyBytes,
    { name: 'Ed25519' },
    false,
    ['verify']
  );

  const privateKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'Ed25519' },
    false,
    ['sign']
  );

  // Store in IndexedDB (encrypt private key in production)
  const createdAt = Date.now();
  await saveToDB(db, 'identity_key', {
    publicKeyBytes: Array.from(publicKeyBytes),
    privateKeyBytes: Array.from(privateKeyBytes), // TODO: Encrypt this
    createdAt,
  });

  // Zero sensitive data
  privateKeyBytes.fill(0);

  cachedIdentityKey = {
    publicKey,
    privateKey,
    publicKeyBytes,
    createdAt,
  };

  return cachedIdentityKey;
}

// Sign data with identity private key
export async function signWithIdentityKey(data: Uint8Array | string): Promise<{ signature: Uint8Array; publicKey: Uint8Array }> {
  const identityKey = await getOrCreateIdentityKey();
  
  const dataToSign = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  
  const signature = await crypto.subtle.sign(
    { name: 'Ed25519' },
    identityKey.privateKey,
    dataToSign
  );

  return {
    signature: new Uint8Array(signature),
    publicKey: identityKey.publicKeyBytes,
  };
}

// Verify signature with identity public key
export async function verifyIdentitySignature(
  data: Uint8Array | string,
  signature: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  const publicKeyCrypto = await crypto.subtle.importKey(
    'raw',
    publicKey,
    { name: 'Ed25519' },
    false,
    ['verify']
  );

  const dataToVerify = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  return crypto.subtle.verify(
    { name: 'Ed25519' },
    publicKeyCrypto,
    signature,
    dataToVerify
  );
}

// Get identity public key bytes
export async function getIdentityPublicKey(): Promise<Uint8Array> {
  const identityKey = await getOrCreateIdentityKey();
  return identityKey.publicKeyBytes;
}

// Helper functions for IndexedDB
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('blinder_db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDENTITY_KEY_STORE)) {
        db.createObjectStore(IDENTITY_KEY_STORE);
      }
    };
  });
}

async function getFromDB(db: IDBDatabase, key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IDENTITY_KEY_STORE], 'readonly');
    const store = transaction.objectStore(IDENTITY_KEY_STORE);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToDB(db: IDBDatabase, key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IDENTITY_KEY_STORE], 'readwrite');
    const store = transaction.objectStore(IDENTITY_KEY_STORE);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

