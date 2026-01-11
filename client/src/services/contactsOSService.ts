// Service for syncing contacts with OS Contacts API
// Works independently of OS - only syncs if Contacts API is available

import { isContactsAPIAvailable } from './contactsPermissionService';
import type { Contact } from './contactsService';

// Save contact to OS if Contacts API is available
export async function saveContactToOS(contact: Contact): Promise<boolean> {
  if (!isContactsAPIAvailable()) {
    return false; // Not available, skip
  }

  try {
    const contactsManager = (navigator as any).contacts;
    
    // Check if contact already exists in OS
    const existingContacts = await contactsManager.select(['name', 'tel'], { multiple: false });
    
    // Format phone number (remove + and spaces)
    const phoneFormatted = contact.phone.replace(/[\s+]/g, '');
    
    // Check if this phone number already exists
    let exists = false;
    if (existingContacts && existingContacts.length > 0) {
      for (const osContact of existingContacts) {
        const osPhones = osContact.tel || [];
        for (const osPhone of osPhones) {
          if (osPhone.replace(/[\s+]/g, '') === phoneFormatted) {
            exists = true;
            break;
          }
        }
        if (exists) break;
      }
    }

    if (!exists) {
      // Create new contact in OS
      // Note: The Contacts API doesn't support creating contacts directly
      // We can only select existing contacts. This is a limitation of the API.
      // For now, we'll just log that we would save it
      console.log('Would save contact to OS:', contact.displayName, phoneFormatted);
      // In a real implementation, you might need to use a different API or prompt the user
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving contact to OS:', error);
    return false;
  }
}

// Get all contacts from OS and check which ones are registered on the app
export async function getOSContactsWithAppStatus(): Promise<Array<{
  name: string;
  phone: string;
  isRegistered: boolean;
  appContact?: Contact;
}>> {
  if (!isContactsAPIAvailable()) {
    return [];
  }

  try {
    const contactsManager = (navigator as any).contacts;
    const osContacts = await contactsManager.select(['name', 'tel'], { multiple: true });
    
    if (!osContacts || osContacts.length === 0) {
      return [];
    }

    // Format contacts and check registration status
    const formattedContacts: Array<{
      name: string;
      phone: string;
      isRegistered: boolean;
      appContact?: Contact;
    }> = [];

    for (const osContact of osContacts) {
      const name = osContact.name?.[0] || 'Sans nom';
      const phones = osContact.tel || [];
      
      for (const phone of phones) {
        const phoneFormatted = phone.replace(/[\s+]/g, '');
        
        // Check if registered on app (call backend)
        const isRegistered = await checkPhoneRegistered(phoneFormatted);
        
        formattedContacts.push({
          name,
          phone: phoneFormatted,
          isRegistered,
        });
      }
    }

    return formattedContacts;
  } catch (error) {
    console.error('Error getting OS contacts:', error);
    return [];
  }
}

// Check if a phone number is registered on the app
export async function checkPhoneRegistered(phone: string): Promise<boolean> {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${API_BASE_URL}/api/users/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.registered === true;
  } catch (error) {
    console.error('Error checking phone registration:', error);
    return false;
  }
}

// Sync app contacts to OS (when saving a contact in app)
export async function syncAppContactToOS(contact: Contact): Promise<void> {
  if (!isContactsAPIAvailable()) {
    return; // Skip if not available
  }

  // The Contacts API doesn't support creating contacts directly
  // We can only read/select contacts
  // This is a limitation of the Web Contacts API
  // In a real implementation, you might need to:
  // 1. Use a native app wrapper (PWA with native bridge)
  // 2. Prompt user to add contact manually
  // 3. Use a different API if available
  
  console.log('Note: Contacts API does not support creating contacts. Contact would be synced:', contact);
}

