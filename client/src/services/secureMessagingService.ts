// Secure messaging service for encrypted chat
// Uses ED25519 for identity/signatures and X25519 for key exchange

// Note: This is a simplified version - full implementation would:
// 1. Get destination's X25519 public key from backend (messaging_public_keys table)
// 2. Verify ED25519 signature
// 3. Perform X25519 key exchange
// 4. Encrypt with AES-GCM
// 5. Send to backend

import { sendEncryptedMessage, getMessages } from './chatApiService';
import { saveMessages, loadMessages } from './indexedDbService';

export interface EncryptedMessage {
  encryptedContent: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  signature: Uint8Array;
  messageId: string;
  timestamp: number;
}

// Derive session key from X25519 key exchange
async function deriveSessionKey(
  theirPublicKey: CryptoKey,
  myPrivateKey: CryptoKey
): Promise<CryptoKey> {
  // Derive bits using X25519
  const sharedSecret = await crypto.subtle.deriveBits(
    {
      name: 'X25519',
      public: theirPublicKey,
    },
    myPrivateKey,
    256
  );

  // Import as AES key
  return crypto.subtle.importKey(
    'raw',
    sharedSecret,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt and send message
export async function sendEncryptedChatMessage(
  plaintext: string,
  destinationPhone: string,
  sessionId: string, // matchId or phone
  messageType: string = 'text'
): Promise<void> {
  // Get destination's X25519 public key from backend
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  let destinationPublicKey: CryptoKey;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/messaging-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: destinationPhone }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.publicKey) {
        // Import the destination's public key
        destinationPublicKey = await crypto.subtle.importKey(
          'raw',
          new Uint8Array(result.publicKey),
          {
            name: 'X25519',
          },
          false,
          []
        );
      } else {
        throw new Error('No messaging key found for destination');
      }
    } else {
      throw new Error('Failed to fetch messaging key');
    }
  } catch (error) {
    console.error('Error fetching destination messaging key:', error);
    throw new Error('Cannot send message: destination messaging key not available');
  }

  // Generate ephemeral key pair for this message (FCS)
  const ephemeralKeyPair = await crypto.subtle.generateKey(
    {
      name: 'X25519',
    },
    true, // Extractable for key exchange
    ['deriveKey']
  ) as CryptoKeyPair;

  // Derive session key
  const sessionKey = await deriveSessionKey(destinationPublicKey, ephemeralKeyPair.privateKey);

  // Encrypt message
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintextBytes = new TextEncoder().encode(plaintext);
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    sessionKey,
    plaintextBytes
  );

  // Combine IV + encrypted content
  const ivArray = new Uint8Array(iv);
  const encryptedArray = new Uint8Array(encryptedContent);
  const combined = new Uint8Array(ivArray.length + encryptedArray.length);
  combined.set(ivArray, 0);
  combined.set(encryptedArray, ivArray.length);

  // Export ephemeral public key
  const ephemeralPublicKeyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', ephemeralKeyPair.publicKey));

  // Combine ephemeral key + encrypted content for transmission
  const finalEncrypted = new Uint8Array(ephemeralPublicKeyBytes.length + combined.length);
  finalEncrypted.set(ephemeralPublicKeyBytes, 0);
  finalEncrypted.set(combined, ephemeralPublicKeyBytes.length);

  const messageId = crypto.randomUUID();

  // Send to backend
  await sendEncryptedMessage(destinationPhone, finalEncrypted, messageId, 'text');

  // Also save locally in IndexedDB
  const { getCurrentPhone } = await import('./authService');
  const currentPhone = getCurrentPhone();
  if (!currentPhone) {
    console.warn('No current phone number available, skipping local save');
    return;
  }
  const localMessages = await loadMessages(sessionId, currentPhone) || [];
  localMessages.push({
    id: messageId,
    senderId: 'user',
    text: plaintext, // Store plaintext locally for display
    timestamp: Date.now(),
    encrypted: true,
  });
  await saveMessages(sessionId, localMessages, currentPhone);
}

// Decrypt message from sender
export async function decryptMessage(
  encryptedData: Uint8Array,
  myPrivateKey: CryptoKey // X25519 private key
): Promise<string> {
  // Extract ephemeral public key (first 32 bytes for X25519)
  const ephemeralPublicKeyBytes = encryptedData.slice(0, 32);
  const encryptedContent = encryptedData.slice(32);

  // Import ephemeral public key
  const ephemeralPublicKey = await crypto.subtle.importKey(
    'raw',
    ephemeralPublicKeyBytes,
    {
      name: 'X25519',
    },
    false,
    []
  );

  // Derive session key
  const sessionKey = await deriveSessionKey(ephemeralPublicKey, myPrivateKey);

  // Extract IV (first 12 bytes) and ciphertext
  const iv = encryptedContent.slice(0, 12);
  const ciphertext = encryptedContent.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    sessionKey,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

// Fetch and decrypt messages for a phone number
export async function fetchAndDecryptMessages(
  phone: string,
  sessionId: string,
  myPrivateKey: CryptoKey
): Promise<Array<{ id: string; text: string; timestamp: number; senderId: string }>> {
  try {
    // Get messages from backend
    const result = await getMessages(phone);
    
    if (!result.success || !result.messages.length) {
      return [];
    }

    // Check identity key when receiving messages
    const { checkIdentityKeyOnMessageReceive } = await import('./identityChangeService');
    const keyChanged = await checkIdentityKeyOnMessageReceive(phone);
    if (keyChanged === true) {
      console.warn(`Identity key changed for ${phone} (message received)`);
      // TODO: Show notification to user
    }

    // Decrypt each message
    const decryptedMessages = [];
    for (const msg of result.messages) {
      try {
        const plaintext = await decryptMessage(msg.encrypted_content, myPrivateKey);
        decryptedMessages.push({
          id: msg.message_id,
          text: plaintext,
          timestamp: new Date(msg.timestamp).getTime(),
          senderId: 'other', // TODO: Determine sender from message
        });
      } catch (error) {
        console.error('Error decrypting message:', error);
        // Skip messages that can't be decrypted
      }
    }

    // Save decrypted messages locally
    const { getCurrentPhone } = await import('./authService');
    const currentPhone = getCurrentPhone();
    if (!currentPhone) {
      throw new Error('No current phone number available');
    }
    const localMessages = await loadMessages(sessionId, currentPhone) || [];
    const existingIds = new Set(localMessages.map((m: any) => m.id));
    
    for (const msg of decryptedMessages) {
      if (!existingIds.has(msg.id)) {
        localMessages.push(msg);
      }
    }
    
    await saveMessages(sessionId, localMessages, currentPhone);

    return decryptedMessages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}


