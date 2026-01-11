// Service for handling IRL (In Real Life) meetings via QR code scan

import { saveContact, getContact } from './contactsService';
import { parseProfileShareQRCode, type ProfileShareData } from './profileShareService';
import { loadProfile, saveProfile } from './indexedDbService';
import { getCurrentPhone } from './authService';

export interface IRLMeetingData extends ProfileShareData {
  realPhotoUrl?: string; // Base64 encoded photo
  realName: string;
}

// Handle IRL meeting QR code scan
export async function handleIRLMeeting(qrData: string, photoFile?: File): Promise<void> {
  const profileData = parseProfileShareQRCode(qrData);
  if (!profileData) {
    throw new Error('Invalid QR code for IRL meeting');
  }

  // Convert photo to base64 if provided
  let photoUrl: string | undefined;
  if (photoFile) {
    const arrayBuffer = await photoFile.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    photoUrl = `data:${photoFile.type};base64,${base64}`;
  }

  // Update or create contact with real info
  const contact = await getContact(profileData.phone);
  if (contact) {
    // Update existing contact - transform to real contact
    await saveContact({
      ...contact,
      displayName: profileData.displayName || contact.displayName,
      realPhotoUrl: photoUrl,
      realName: profileData.displayName,
      isRealContact: true,
      updatedAt: Date.now(),
    });
  } else {
    // Create new contact
    await saveContact({
      phone: profileData.phone,
      displayName: profileData.displayName || profileData.phone,
      realPhotoUrl: photoUrl,
      realName: profileData.displayName,
      isRealContact: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  // Also update the session/match if it exists
  // This will be handled by the store when it refreshes
}

// Check if contact is a real contact (met IRL)
export async function isRealContact(phone: string): Promise<boolean> {
  const contact = await getContact(phone);
  return contact?.isRealContact === true;
}

