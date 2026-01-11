// Simplified identity key sync service
// Stores and syncs public keys per userId, pulls on conversation open and app start

import { getIdentityPublicKey } from './identityKeyService';
import { getCurrentPhone } from './authService';
import { loadProfile, saveProfile } from './indexedDbService';

const IDENTITY_KEYS_STORE = 'identity_keys_sync';

export interface IdentityKeyRecord {
  userId: string; // phone number
  publicKey: Uint8Array;
  lastUpdated: number;
}

// Store identity public key for a user
export async function storeIdentityPublicKey(userId: string, publicKey: Uint8Array): Promise<void> {
  const db = await openDB();
  const record: IdentityKeyRecord = {
    userId,
    publicKey,
    lastUpdated: Date.now(),
  };
  
  await saveToDB(db, userId, {
    userId,
    publicKey: Array.from(publicKey),
    lastUpdated: record.lastUpdated,
  });
}

// Get stored identity public key for a user
export async function getStoredIdentityPublicKey(userId: string): Promise<Uint8Array | null> {
  const db = await openDB();
  const data = await getFromDB(db, userId);
  
  if (!data) return null;
  
  return new Uint8Array(data.publicKey);
}

// Check if identity key has changed for a user
export async function checkIdentityKeyChange(userId: string): Promise<boolean> {
  const storedKey = await getStoredIdentityPublicKey(userId);
  if (!storedKey) {
    // First time seeing this user, store their key
    // We need to get it from somewhere - this would come from the backend
    return false;
  }
  
  // Get current key from backend (would be fetched when opening conversation)
  // For now, return false (no change detected)
  return false;
}

// Sync identity public key from backend
export async function syncIdentityPublicKeyFromBackend(
  userId: string,
  publicKey: Uint8Array
): Promise<boolean> {
  const storedKey = await getStoredIdentityPublicKey(userId);
  
  if (!storedKey) {
    // First time, store it
    await storeIdentityPublicKey(userId, publicKey);
    return false; // No change
  }
  
  // Compare keys
  if (arraysEqual(storedKey, publicKey)) {
    return false; // No change
  }
  
  // Key has changed!
  await storeIdentityPublicKey(userId, publicKey);
  return true; // Change detected
}

// Get current user's identity public key
export async function getCurrentUserIdentityPublicKey(): Promise<Uint8Array> {
  return await getIdentityPublicKey();
}

// Helper functions for IndexedDB
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('blinder_db', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDENTITY_KEYS_STORE)) {
        db.createObjectStore(IDENTITY_KEYS_STORE);
      }
    };
  });
}

async function getFromDB(db: IDBDatabase, key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IDENTITY_KEYS_STORE], 'readonly');
    const store = transaction.objectStore(IDENTITY_KEYS_STORE);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToDB(db: IDBDatabase, key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IDENTITY_KEYS_STORE], 'readwrite');
    const store = transaction.objectStore(IDENTITY_KEYS_STORE);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

