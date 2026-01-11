// Simplified identity key change detection service
// Checks identity keys locally by comparing with server keys
// No need to notify contacts - just check on chat open, app start, and message receive

import { getIdentityPublicKey } from './identityKeyService';
import { getCurrentPhone } from './authService';
import { loadProfile, saveProfile } from './indexedDbService';

// Store identity public keys per user (phone number)
const IDENTITY_KEYS_STORE = 'identity_keys';

interface StoredIdentityKey {
  phone: string;
  publicKey: Uint8Array;
  lastChecked: number;
}

// Get stored identity public key for a user
async function getStoredIdentityKey(phone: string): Promise<Uint8Array | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IDENTITY_KEYS_STORE], 'readonly');
    const store = transaction.objectStore(IDENTITY_KEYS_STORE);
    const request = store.get(phone);
    
    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        resolve(new Uint8Array(result.publicKey));
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Store identity public key for a user
async function storeIdentityKey(phone: string, publicKey: Uint8Array): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IDENTITY_KEYS_STORE], 'readwrite');
    const store = transaction.objectStore(IDENTITY_KEYS_STORE);
    
    const keyData: StoredIdentityKey = {
      phone,
      publicKey,
      lastChecked: Date.now(),
    };
    
    const request = store.put({
      phone,
      publicKey: Array.from(publicKey),
      lastChecked: Date.now(),
    });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Open IndexedDB
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('blinder_db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(IDENTITY_KEYS_STORE)) {
        const store = db.createObjectStore(IDENTITY_KEYS_STORE, { keyPath: 'phone' });
        store.createIndex('lastChecked', 'lastChecked', { unique: false });
      }
    };
  });
}

// Get identity public key from server for a user
async function getIdentityKeyFromServer(phone: string): Promise<Uint8Array | null> {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_BASE_URL}/api/users/identity-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (result.success && result.publicKey) {
      return new Uint8Array(result.publicKey);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching identity key from server:', error);
    return null;
  }
}

// Check if identity key has changed for a user
// Returns true if key changed, false if no change, null if error
export async function checkIdentityKeyChange(phone: string): Promise<boolean | null> {
  try {
    // Get stored key locally
    const storedKey = await getStoredIdentityKey(phone);
    
    // Get current key from server
    const serverKey = await getIdentityKeyFromServer(phone);
    
    if (!serverKey) {
      // Can't get key from server, can't check
      return null;
    }
    
    if (!storedKey) {
      // First time seeing this user, store their key
      await storeIdentityKey(phone, serverKey);
      return false; // No change (first time)
    }
    
    // Compare keys
    if (arraysEqual(storedKey, serverKey)) {
      // Update last checked time
      await storeIdentityKey(phone, serverKey);
      return false; // No change
    }
    
    // Key has changed!
    await storeIdentityKey(phone, serverKey);
    return true; // Change detected
  } catch (error) {
    console.error('Error checking identity key change:', error);
    return null;
  }
}

// Check identity keys for all contacts on app start
export async function checkAllIdentityKeysOnAppStart(): Promise<void> {
  const phone = getCurrentPhone();
  if (!phone) return;

  // Get all contacts from IndexedDB
  const { getAllContacts } = await import('./contactsService');
  const contacts = await getAllContacts();
  
  // Check each contact's identity key
  for (const contact of contacts) {
    try {
      const changed = await checkIdentityKeyChange(contact.phone);
      if (changed === true) {
        console.warn(`Identity key changed for ${contact.phone}`);
        // TODO: Show notification to user
      }
    } catch (error) {
      console.error(`Error checking identity key for ${contact.phone}:`, error);
    }
  }
}

// Check identity key when opening a chat
export async function checkIdentityKeyOnChatOpen(phone: string): Promise<boolean | null> {
  return await checkIdentityKeyChange(phone);
}

// Check identity key when receiving a message
export async function checkIdentityKeyOnMessageReceive(senderPhone: string): Promise<boolean | null> {
  return await checkIdentityKeyChange(senderPhone);
}

// Helper function
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
