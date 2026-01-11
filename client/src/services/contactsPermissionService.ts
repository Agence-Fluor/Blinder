// Contacts permission service

export interface ContactsPermissionStatus {
  granted: boolean;
  denied: boolean;
  unavailable: boolean;
  message: string;
}

// Check if contacts API is available
export function isContactsAPIAvailable(): boolean {
  // Contacts API is not available on iOS Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  if (isIOS && isSafari) {
    return false;
  }
  
  return 'contacts' in navigator && 'ContactsManager' in window;
}

// Request contacts permission
export async function requestContactsPermission(): Promise<ContactsPermissionStatus> {
  if (!isContactsAPIAvailable()) {
    return {
      granted: false,
      denied: false,
      unavailable: true,
      message: 'L\'accès aux contacts n\'est pas disponible sur iOS pour le moment. Cette fonctionnalité sera disponible prochainement.',
    };
  }

  try {
    const contactsManager = (navigator as any).contacts;
    const permissions = await contactsManager.select(['name', 'tel'], { multiple: true });
    
    if (permissions && permissions.length > 0) {
      return {
        granted: true,
        denied: false,
        unavailable: false,
        message: 'Accès aux contacts autorisé',
      };
    } else {
      return {
        granted: false,
        denied: true,
        unavailable: false,
        message: 'Permission refusée',
      };
    }
  } catch (error: any) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return {
        granted: false,
        denied: true,
        unavailable: false,
        message: 'Permission refusée. Vous pouvez l\'activer dans les paramètres du navigateur.',
      };
    } else {
      return {
        granted: false,
        denied: false,
        unavailable: true,
        message: 'L\'accès aux contacts n\'est pas disponible sur votre appareil.',
      };
    }
  }
}

// Get contacts (if permission granted)
export async function getContacts(): Promise<Array<{ name: string; phone: string }>> {
  if (!isContactsAPIAvailable()) {
    return [];
  }

  try {
    const contactsManager = (navigator as any).contacts;
    const contacts = await contactsManager.select(['name', 'tel'], { multiple: true });
    
    return contacts.map((contact: any) => ({
      name: contact.name?.[0] || 'Sans nom',
      phone: contact.tel?.[0] || '',
    })).filter((c: any) => c.phone);
  } catch (error) {
    console.error('Error getting contacts:', error);
    return [];
  }
}

