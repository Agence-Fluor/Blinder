// Simple password service for frontend-only authentication
// Password is stored locally in localStorage (not sent to backend)

const STORAGE_KEY_PASSWORD_PREFIX = 'blinder_password_';

// Save password for a phone number (frontend only)
export function savePassword(phone: string, password: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY_PASSWORD_PREFIX}${phone}`, password);
}

// Get password for a phone number
export function getPassword(phone: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(`${STORAGE_KEY_PASSWORD_PREFIX}${phone}`);
}

// Verify password for a phone number
export function verifyPassword(phone: string, password: string): boolean {
  const storedPassword = getPassword(phone);
  return storedPassword === password;
}

// Remove password for a phone number
export function removePassword(phone: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(`${STORAGE_KEY_PASSWORD_PREFIX}${phone}`);
}

// Check if password exists for a phone number
export function hasPassword(phone: string): boolean {
  return getPassword(phone) !== null;
}





