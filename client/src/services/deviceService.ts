// Device registration and multi-device management service

import { subscribeToPush, type PushSubscription } from './webPushService';
import { connectWebSocket, onWebSocketMessage } from './websocketService';
import { exportAllData, importAllData, clearAllData } from './indexedDbService';
import { encryptData, decryptData } from './encryptionService';
// QR code login functions removed - using password-based authentication instead

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface RegisterFirstDeviceRequest {
  phone: string;
  device_id: string;
  push_subscription?: PushSubscription;
}

export interface RegisterDeviceRequest {
  phone: string;
  device_id: string;
  push_subscription?: PushSubscription;
}

// Register first device (onboarding or SMS recovery)
export async function registerFirstDevice(
  phone: string,
  deviceId: string
): Promise<{ success: boolean; deviceId: string; message: string }> {
  // Try to subscribe to push notifications
  let pushSubscription: PushSubscription | null = null;
  try {
    pushSubscription = await subscribeToPush();
  } catch (error) {
    // Push subscription failed, will use WebSocket fallback
    console.warn('Push subscription failed, using WebSocket fallback');
  }

  // If push is not available, connect WebSocket as fallback
  if (!pushSubscription) {
    try {
      await connectWebSocket(phone);
      // Listen for login requests via WebSocket
      onWebSocketMessage((message) => {
        if (message.type === 'login_request') {
          // Handle login request notification
          window.dispatchEvent(new CustomEvent('login-request', { detail: message.payload }));
        }
      });
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/devices/register-first`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      device_id: deviceId,
      push_subscription: pushSubscription,
    } as RegisterFirstDeviceRequest),
  });

  if (!response.ok) {
    throw new Error(`Failed to register device: ${response.statusText}`);
  }

  return response.json();
}

// Register additional device
export async function registerDevice(
  phone: string,
  deviceId: string
): Promise<{ success: boolean; deviceId: string; message: string }> {
  // Try to subscribe to push notifications
  let pushSubscription: PushSubscription | null = null;
  try {
    pushSubscription = await subscribeToPush();
  } catch (error) {
    console.warn('Push subscription failed, using WebSocket fallback');
  }

  // If push is not available, connect WebSocket as fallback
  if (!pushSubscription) {
    try {
      await connectWebSocket(phone);
      onWebSocketMessage((message) => {
        if (message.type === 'login_request') {
          window.dispatchEvent(new CustomEvent('login-request', { detail: message.payload }));
        }
      });
    } catch (error) {
      console.warn('WebSocket connection failed:', error);
    }
  }

  const response = await fetch(`${API_BASE_URL}/api/devices/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      device_id: deviceId,
      push_subscription: pushSubscription,
    } as RegisterDeviceRequest),
  });

  if (!response.ok) {
    throw new Error(`Failed to register device: ${response.statusText}`);
  }

  return response.json();
}

// sendLoginRequest removed - using password-based authentication instead

// Encrypt and export IndexedDB data for transfer to new device
export async function encryptAndExportData(
  password: string
): Promise<{ encrypted: ArrayBuffer; salt: Uint8Array; iv: Uint8Array }> {
  // Export all data from IndexedDB
  const data = await exportAllData();

  // Encrypt with password
  return encryptData(data, password);
}

// Decrypt and import IndexedDB data from old device
export async function decryptAndImportData(
  encrypted: ArrayBuffer,
  salt: Uint8Array,
  iv: Uint8Array,
  password: string
): Promise<void> {
  // Decrypt data
  const data = await decryptData(encrypted, salt, iv, password) as {
    profile: unknown;
    messages: Map<string, unknown[]>;
  };

  // Clear existing data
  await clearAllData();

  // Import decrypted data
  await importAllData(data);
}

// QR code login functions removed - using password-based authentication instead

