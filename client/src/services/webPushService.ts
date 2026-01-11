// WebPush service for multi-device notifications

// VAPID public key - TODO: Get from backend or environment
// For now, disable WebPush subscription if key is not available
const VAPID_PUBLIC_KEY = null; // Set to null to disable WebPush for now

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Check if service worker and push are supported
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported');
    return null;
  }

  // If VAPID key is not available, skip subscription
  if (!VAPID_PUBLIC_KEY || typeof VAPID_PUBLIC_KEY !== 'string' || VAPID_PUBLIC_KEY.trim() === '') {
    console.warn('VAPID public key not configured, skipping push subscription');
    return null;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Convert VAPID key to Uint8Array
      let applicationServerKey: Uint8Array;
      try {
        applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      } catch (error) {
        console.error('Invalid VAPID public key format:', error);
        return null;
      }
      
      // Subscribe to push
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // Convert subscription to our format
    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    if (!key || !auth) {
      throw new Error('Failed to get subscription keys');
    }

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64Url(key),
        auth: arrayBufferToBase64Url(auth),
      },
    };
  } catch (error) {
    // Don't throw error if user denies permission - just return null
    // The app will fallback to WebSocket
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      console.warn('Push notification permission denied, will use WebSocket fallback');
    } else {
      console.warn('Error subscribing to push:', error);
    }
    return null;
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
}

// Convert VAPID public key from base64url to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Convert ArrayBuffer to base64url
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Setup push notification listener in service worker
export function setupPushNotificationListener(
  onNotification: (data: { action: string; deviceId: string; password: string }) => void
): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
        onNotification(event.data.payload);
      }
    });
  }
}

