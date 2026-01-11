// Authentication service for managing login state and account switching

const STORAGE_KEY_CURRENT_PHONE = 'blinder_current_phone';
const STORAGE_KEY_LOGGED_OUT_PHONES = 'blinder_logged_out_phones';

// LoggedOutAccount is now just an array of phone numbers (strings)
export type LoggedOutAccount = string[];

// Get current logged-in phone
export function getCurrentPhone(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_CURRENT_PHONE);
}

// Set current logged-in phone
export function setCurrentPhone(phone: string): void {
  console.log('current_phone:', phone)
  if (typeof localStorage === 'undefined') 
    return;
  localStorage.setItem(STORAGE_KEY_CURRENT_PHONE, phone);
  
  // Remove from logged out list if it was there
  removeLoggedOutPhone(phone);
}

// Logout (temporary or permanent)
export function logout(phone: string, isTemporary: boolean = false): void {
  if (typeof localStorage === 'undefined') return;
  
  // Clear current phone if it matches
  const current = getCurrentPhone();
  if (current === phone) {
    localStorage.removeItem(STORAGE_KEY_CURRENT_PHONE);
  }
  
  // Add to logged out list (only if temporary, permanent logouts clear data)
  if (isTemporary) {
    const loggedOut = getLoggedOutPhones();
    if (!loggedOut.includes(phone)) {
      loggedOut.push(phone);
      localStorage.setItem(STORAGE_KEY_LOGGED_OUT_PHONES, JSON.stringify(loggedOut));
    }
  }
}

// Get list of logged out phones (array of phone numbers)
export function getLoggedOutPhones(): string[] {
  if (typeof localStorage === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEY_LOGGED_OUT_PHONES);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored) as string[];
  } catch {
    return [];
  }
}

// Remove phone from logged out list
export function removeLoggedOutPhone(phone: string): void {
  if (typeof localStorage === 'undefined') return;
  
  const loggedOut = getLoggedOutPhones().filter(p => p !== phone);
  localStorage.setItem(STORAGE_KEY_LOGGED_OUT_PHONES, JSON.stringify(loggedOut));
}

// Get temporarily logged out phones (same as getLoggedOutPhones now, kept for compatibility)
export function getTemporaryLoggedOutPhones(): string[] {
  return getLoggedOutPhones();
}

// Clear all data (permanent logout)
export async function clearAllData(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  
  const { clearAllData: clearIndexedDB } = await import('./indexedDbService');
  await clearIndexedDB();
  
  localStorage.removeItem(STORAGE_KEY_CURRENT_PHONE);
  localStorage.removeItem(STORAGE_KEY_LOGGED_OUT_PHONES);
}

