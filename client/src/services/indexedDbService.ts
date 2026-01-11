// IndexedDB service for storing profile and messages
// Structure: profile store, messages store (JSON per session)
// All data is stored with a profile key (phone number)

import { getCurrentPhone } from './authService';

const DB_NAME = 'blinder_db';
const DB_VERSION = 3;

interface DBStores {
  profile: 'profile';
  messages: 'messages';
}

const STORES = {
  profile: 'profile',
  messages: 'messages',
  contacts: 'contacts',
} as const;

// Helper to get current phone or throw error
function getProfileKey(phone?: string | null): string {
  if (phone) return phone;
  const currentPhone = getCurrentPhone();
  if (!currentPhone) {
    throw new Error('No phone number available. User must be logged in or phone must be provided.');
  }
  return currentPhone;
}

// Open database
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create profile store
      if (!db.objectStoreNames.contains(STORES.profile)) {
        db.createObjectStore(STORES.profile);
      }

      // Create messages store (JSON per session)
      if (!db.objectStoreNames.contains(STORES.messages)) {
        const messagesStore = db.createObjectStore(STORES.messages);
        messagesStore.createIndex('sessionId', 'sessionId', { unique: false });
      }

      // Create contacts store
      if (!db.objectStoreNames.contains(STORES.contacts)) {
        const contactsStore = db.createObjectStore(STORES.contacts, { keyPath: 'phone' });
        contactsStore.createIndex('displayName', 'displayName', { unique: false });
      }
    };
  });
}

// Profile operations
export async function saveProfile(profile: unknown, phone?: string | null): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.profile], 'readwrite');
    const store = transaction.objectStore(STORES.profile);
    
    // Serialize profile to avoid Proxy object issues
    // Convert to plain object if it's a Svelte proxy
    // Use structuredClone if available, otherwise fallback to JSON
    let serializedProfile: unknown;
    try {
      if (typeof structuredClone !== 'undefined') {
        serializedProfile = structuredClone(profile);
      } else {
        serializedProfile = JSON.parse(JSON.stringify(profile));
      }
    } catch (error) {
      // If structuredClone fails, fallback to JSON
      try {
        serializedProfile = JSON.parse(JSON.stringify(profile));
      } catch (jsonError) {
        console.error('Error serializing profile:', jsonError);
        reject(new Error('Failed to serialize profile'));
        return;
      }
    }
    
    // Get phone from profile or parameter
    const profilePhone = (serializedProfile as any)?.phone || phone;
    if (!profilePhone) {
      reject(new Error('Profile must have a phone number'));
      return;
    }
    
    const request = store.put(serializedProfile, profilePhone);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadProfile(phone?: string | null): Promise<unknown | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.profile], 'readonly');
    const store = transaction.objectStore(STORES.profile);
    const profileKey = getProfileKey(phone);
    const request = store.get(profileKey);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Load profile by phone (for temporarily logged out accounts)
export async function loadProfileByPhone(phone: string): Promise<unknown | null> {
  return loadProfile(phone);
}

// Messages operations (by session, prefixed with profile phone)
export async function saveMessages(sessionId: string, messages: unknown[], phone?: string | null): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.messages], 'readwrite');
    const store = transaction.objectStore(STORES.messages);
    
    // Serialize messages to avoid Proxy object issues
    const serializedMessages = JSON.parse(JSON.stringify(messages));
    
    const profileKey = getProfileKey(phone);
    const prefixedSessionId = `${profileKey}:${sessionId}`;
    
    const request = store.put({ sessionId, messages: serializedMessages, profileKey }, prefixedSessionId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function loadMessages(sessionId: string, phone?: string | null): Promise<unknown[] | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.messages], 'readonly');
    const store = transaction.objectStore(STORES.messages);
    const profileKey = getProfileKey(phone);
    const prefixedSessionId = `${profileKey}:${sessionId}`;
    const request = store.get(prefixedSessionId);
    
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.messages : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function loadAllSessions(phone?: string | null): Promise<Map<string, unknown[]>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.messages], 'readonly');
    const store = transaction.objectStore(STORES.messages);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const result = request.result;
      const sessions = new Map<string, unknown[]>();
      const profileKey = getProfileKey(phone);
      
      for (const item of result) {
        // Only include sessions for the current profile
        if (item.profileKey === profileKey) {
        sessions.set(item.sessionId, item.messages);
        }
      }
      resolve(sessions);
    };
    request.onerror = () => reject(request.error);
  });
}

// Export all data for encryption (profile + all messages)
export async function exportAllData(phone?: string | null): Promise<{ profile: unknown; messages: Map<string, unknown[]> }> {
  const profile = await loadProfile(phone);
  const messages = await loadAllSessions(phone);
  return { profile, messages };
}

// Import all data after decryption
export async function importAllData(data: { profile: unknown; messages: Map<string, unknown[]> }, phone?: string | null): Promise<void> {
  if (data.profile) {
    // Data is already serialized from decryption, but ensure it's plain
    await saveProfile(data.profile, phone);
  }
  
  for (const [sessionId, messages] of data.messages.entries()) {
    // Messages are already serialized from decryption
    await saveMessages(sessionId, messages, phone);
  }
}

// Clear all data for a specific profile (or all if no phone provided)
export async function clearAllData(phone?: string | null): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    if (phone) {
      // Clear only data for this profile
      const transaction = db.transaction([STORES.profile, STORES.messages], 'readwrite');
      
      const profileStore = transaction.objectStore(STORES.profile);
      const profileRequest = profileStore.delete(phone);
      
      const messagesStore = transaction.objectStore(STORES.messages);
      const messagesRequest = messagesStore.openCursor();
      
      profileRequest.onsuccess = () => {
        // Now delete messages for this profile
        messagesRequest.onsuccess = (e: Event) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            if (cursor.value.profileKey === phone) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        messagesRequest.onerror = () => reject(messagesRequest.error);
      };
      profileRequest.onerror = () => reject(profileRequest.error);
    } else {
      // Clear all data
    const transaction = db.transaction([STORES.profile, STORES.messages], 'readwrite');
    
    const profileStore = transaction.objectStore(STORES.profile);
    const profileRequest = profileStore.clear();
    
    const messagesStore = transaction.objectStore(STORES.messages);
    const messagesRequest = messagesStore.clear();
    
    let completed = 0;
    const checkComplete = () => {
      completed++;
      if (completed === 2) resolve();
    };
    
    profileRequest.onsuccess = checkComplete;
    messagesRequest.onsuccess = checkComplete;
    profileRequest.onerror = () => reject(profileRequest.error);
    messagesRequest.onerror = () => reject(messagesRequest.error);
    }
  });
}

