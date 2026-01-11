// Chat API service for encrypted messaging

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SendMessageRequest {
  destination_phone: string;
  encrypted_content: Uint8Array;
  message_id: string;
  message_type?: string;
}

export interface MessageData {
  id: number;
  encrypted_content: Uint8Array;
  message_id: string;
  timestamp: string;
  message_type?: string;
}

export interface GetMessagesRequest {
  phone: string;
  since?: string; // ISO 8601 timestamp
}

// Send encrypted message
export async function sendEncryptedMessage(
  destinationPhone: string,
  encryptedContent: Uint8Array,
  messageId: string,
  messageType: string = 'text'
): Promise<{ success: boolean; message_id: string; message: string }> {
  // Convert Uint8Array to base64 for transmission
  const base64Content = btoa(String.fromCharCode(...encryptedContent));

  const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      destination_phone: destinationPhone,
      encrypted_content: Array.from(encryptedContent), // Send as array for JSON
      message_id: messageId,
      message_type: messageType,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  return response.json();
}

// Get messages for phone number
export async function getMessages(
  phone: string,
  since?: string
): Promise<{ success: boolean; messages: MessageData[]; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/messages/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      since: since ? new Date(since).toISOString() : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get messages: ${response.statusText}`);
  }

  const result = await response.json();
  
  // Convert encrypted_content arrays back to Uint8Array
  result.messages = result.messages.map((msg: any) => ({
    ...msg,
    encrypted_content: new Uint8Array(msg.encrypted_content),
  }));

  return result;
}

