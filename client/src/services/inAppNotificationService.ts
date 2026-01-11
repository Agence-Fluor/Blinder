// In-app notification service for when push notifications are not available

export interface InAppNotification {
  id: string;
  type: 'call' | 'missed_call' | 'message' | 'info';
  title: string;
  message: string;
  timestamp: number;
  data?: any;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class InAppNotificationManager {
  private notifications: InAppNotification[] = [];
  private listeners: Set<(notifications: InAppNotification[]) => void> = new Set();

  addNotification(notification: Omit<InAppNotification, 'id' | 'timestamp'>): string {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullNotification: InAppNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    this.notifications.unshift(fullNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notifyListeners();
    
    // Auto-remove after 10 seconds for call notifications
    if (notification.type === 'call') {
      setTimeout(() => {
        this.removeNotification(id);
      }, 10000);
    }

    return id;
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  clearAll(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  getAll(): InAppNotification[] {
    return [...this.notifications];
  }

  subscribe(listener: (notifications: InAppNotification[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.notifications); // Call immediately with current state
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.notifications));
  }
}

// Singleton instance
const notificationManager = new InAppNotificationManager();

// Add notification
export function addInAppNotification(
  notification: Omit<InAppNotification, 'id' | 'timestamp'>
): string {
  return notificationManager.addNotification(notification);
}

// Remove notification
export function removeInAppNotification(id: string): void {
  notificationManager.removeNotification(id);
}

// Clear all notifications
export function clearInAppNotifications(): void {
  notificationManager.clearAll();
}

// Get all notifications
export function getInAppNotifications(): InAppNotification[] {
  return notificationManager.getAll();
}

// Subscribe to notifications
export function subscribeToInAppNotifications(
  listener: (notifications: InAppNotification[]) => void
): () => void {
  return notificationManager.subscribe(listener);
}

