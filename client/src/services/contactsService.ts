// Contacts service for managing local contact names (stored in IndexedDB)

import { openDB } from './indexedDbService';

const DB_NAME = 'blinder_db';
const DB_VERSION = 1;
const CONTACTS_STORE = 'contacts';

// Contact interface
export interface Contact {
  phone: string;
  displayName: string; // Local display name
  originalName?: string; // Original name from match/profile
  createdAt: number;
  updatedAt: number;
  // IRL meeting info
  realPhotoUrl?: string;
  realName?: string;
  isRealContact?: boolean; // true if met IRL
}

// Open contacts store
async function openContactsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create contacts store if it doesn't exist
      if (!db.objectStoreNames.contains(CONTACTS_STORE)) {
        const store = db.createObjectStore(CONTACTS_STORE, { keyPath: 'phone' });
        store.createIndex('displayName', 'displayName', { unique: false });
      }
    };
  });
}

// Save or update contact
export async function saveContact(contact: Contact): Promise<void> {
  const db = await openContactsDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTACTS_STORE], 'readwrite');
    const store = transaction.objectStore(CONTACTS_STORE);
    
    const contactToSave = {
      ...contact,
      updatedAt: Date.now(),
    };
    
    const request = store.put(contactToSave);
    
    request.onsuccess = async () => {
      // Sync to OS if Contacts API is available
      try {
        const { syncAppContactToOS } = await import('./contactsOSService');
        await syncAppContactToOS(contactToSave);
      } catch (error) {
        console.warn('Could not sync contact to OS:', error);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// Get contact by phone
export async function getContact(phone: string): Promise<Contact | null> {
  const db = await openContactsDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTACTS_STORE], 'readonly');
    const store = transaction.objectStore(CONTACTS_STORE);
    const request = store.get(phone);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Get all contacts
export async function getAllContacts(): Promise<Contact[]> {
  const db = await openContactsDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTACTS_STORE], 'readonly');
    const store = transaction.objectStore(CONTACTS_STORE);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Delete contact
export async function deleteContact(phone: string): Promise<void> {
  const db = await openContactsDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CONTACTS_STORE], 'readwrite');
    const store = transaction.objectStore(CONTACTS_STORE);
    const request = store.delete(phone);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get display name for phone (returns local name or fallback)
export async function getDisplayName(phone: string, fallback: string): Promise<string> {
  const contact = await getContact(phone);
  return contact?.displayName || fallback;
}

