// Service for secure synchronization between user's devices

import { loadProfile, saveProfile, loadMessages, saveMessages } from './indexedDbService';
import { getAllContacts, saveContact } from './contactsService';
import { getIdentityPublicKey, signWithIdentityKey, verifyIdentitySignature } from './identityKeyService';
import { uploadEncryptedData, downloadEncryptedData } from './deviceService';
import { getCurrentPhone } from './authService';
import { encryptData, decryptData } from './encryptionService';

export interface SyncData {
  profile: any;
  messages: Record<string, any[]>;
  contacts: any[];
  callHistory: any[];
  timestamp: number;
  signature: Uint8Array;
  identityPublicKey: Uint8Array;
}

// Sync all data to other devices
export async function syncToOtherDevices(): Promise<void> {
  const phone = getCurrentPhone();
  if (!phone) return;

  // Collect all data
  const profile = await loadProfile();
  const contacts = await getAllContacts();
  
  // Get all messages from IndexedDB
  const messages: Record<string, any[]> = {};
  // TODO: Iterate through all sessions and load messages
  // For now, we'll sync the active sessions
  
  // Get call history (if stored)
  const callHistory: any[] = []; // TODO: Load from IndexedDB

  // Create sync data
  const syncData: Omit<SyncData, 'signature' | 'identityPublicKey' | 'timestamp'> = {
    profile,
    messages,
    contacts,
    callHistory,
  };

  // Sign the sync data
  const dataString = JSON.stringify(syncData);
  const { signature, publicKey } = await signWithIdentityKey(dataString);

  const fullSyncData: SyncData = {
    ...syncData,
    timestamp: Date.now(),
    signature,
    identityPublicKey: publicKey,
  };

  // Encrypt sync data with a password derived from device credentials
  // Derive password from device credentials
  const password = await deriveSyncPassword();
  const encryptedResult = await encryptData(JSON.stringify(fullSyncData), password);
  // Combine encrypted data with salt and IV for transmission
  const encryptedData = {
    encrypted: Array.from(new Uint8Array(encryptedResult.encrypted)),
    salt: Array.from(encryptedResult.salt),
    iv: Array.from(encryptedResult.iv),
  };

  // Upload to server
  await uploadEncryptedData(phone, encryptedData);
}

// Sync data from server to this device
export async function syncFromServer(): Promise<void> {
  const phone = getCurrentPhone();
  if (!phone) return;

  try {
    // Download encrypted data from server
    const encryptedData = await downloadEncryptedData(phone);
    if (!encryptedData) {
      console.log('No sync data available');
      return;
    }

    // Decrypt with password
    const password = await deriveSyncPassword();
    const decryptedData = await decryptData(
      new Uint8Array(encryptedData.encrypted).buffer,
      new Uint8Array(encryptedData.salt),
      new Uint8Array(encryptedData.iv),
      password
    );
    const syncData: SyncData = typeof decryptedData === 'string' ? JSON.parse(decryptedData) : decryptedData as SyncData;

    // Verify signature
    const dataString = JSON.stringify({
      profile: syncData.profile,
      messages: syncData.messages,
      contacts: syncData.contacts,
      callHistory: syncData.callHistory,
      timestamp: syncData.timestamp,
    });

    const isValid = await verifyIdentitySignature(
      dataString,
      new Uint8Array(syncData.signature),
      new Uint8Array(syncData.identityPublicKey)
    );

    if (!isValid) {
      console.error('Invalid sync data signature!');
      throw new Error('Invalid signature on sync data');
    }

    // Verify identity key matches
    const currentIdentityKey = await getIdentityPublicKey();
    if (!arraysEqual(currentIdentityKey, new Uint8Array(syncData.identityPublicKey))) {
      console.warn('Identity key mismatch. This might be from a different account.');
      // Still sync, but warn user
    }

    // Apply synced data
    if (syncData.profile) {
      await saveProfile(syncData.profile, phone);
    }

    if (syncData.contacts) {
      for (const contact of syncData.contacts) {
        await saveContact(contact);
      }
    }

    if (syncData.messages) {
      for (const [sessionId, messages] of Object.entries(syncData.messages)) {
        await saveMessages(sessionId, messages, phone);
      }
    }

    // TODO: Save call history

    console.log('Sync completed successfully');
  } catch (error) {
    console.error('Error syncing from server:', error);
    throw error;
  }
}

// Derive sync password from device credentials
async function deriveSyncPassword(): Promise<string> {
  const phone = getCurrentPhone();
  if (!phone) {
    throw new Error('No phone number available');
  }

  // Use phone + device ID to derive password
  // Use device ID from localStorage
  const deviceId = localStorage.getItem('current_device_id') || 'default';
  const combined = `${phone}:${deviceId}`;

  // Derive a key using PBKDF2
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const key = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode('blinder-sync-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    key,
    256
  );

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
}

// Helper function
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

