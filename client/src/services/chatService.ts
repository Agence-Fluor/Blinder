// Service for creating chat sessions with any phone number (bypasses matching)

import { sessions, activeChatId } from '../stores/app';
import { get } from 'svelte/store';
import type { ChatSession, MatchProfile } from '../types';
import { getContact } from './contactsService';
import { checkPhoneRegistered } from './contactsOSService';

// Create or get a chat session for any phone number
export async function createChatSession(phone: string, displayName?: string): Promise<string> {
  const currentSessions = get(sessions);
  
  // Check if session already exists
  const existingSession = currentSessions.find(s => s.matchId === phone);
  if (existingSession) {
    activeChatId.set(phone);
    
    // Check identity key when opening chat
    const { checkIdentityKeyOnChatOpen } = await import('./identityChangeService');
    const keyChanged = await checkIdentityKeyOnChatOpen(phone);
    if (keyChanged === true) {
      console.warn(`Identity key changed for ${phone}`);
      // TODO: Show notification to user
    }
    
    return phone;
  }

  // Get contact info if available
  const contact = await getContact(phone);
  const name = displayName || contact?.displayName || phone;
  
  // Check if user is registered
  const isRegistered = await checkPhoneRegistered(phone);

  // Check identity key when opening chat
  const { checkIdentityKeyOnChatOpen } = await import('./identityChangeService');
  const keyChanged = await checkIdentityKeyOnChatOpen(phone);
  if (keyChanged === true) {
    console.warn(`Identity key changed for ${phone}`);
    // TODO: Show notification to user
  }

  // Create a minimal match profile
  // For direct messages (no match), they appear in "matched" view (eye closed) with cartoon avatar
  // unless they are marked as real contact (met IRL)
  const matchProfile: MatchProfile = {
    id: phone,
    searchProfileId: '',
    searchProfileName: name,
    funWord: '',
    avatarUrl: '', // Not used anymore - Avatar component generates it
    age: 0,
    gender: 'ANY' as any,
    department: '',
    interests: [],
    isRealContact: contact?.isRealContact || false, // Only true if met IRL
    realPhotoUrl: contact?.realPhotoUrl,
    realName: contact?.realName,
  };

  // Create new session
  const newSession: ChatSession = {
    matchId: phone,
    match: matchProfile,
    messages: [],
    unread: false,
  };

  // Add to sessions
  sessions.update(list => [...list, newSession]);
  
  // Set as active
  activeChatId.set(phone);
  
  return phone;
}

// Re-export checkPhoneRegistered from contactsOSService
export { checkPhoneRegistered } from './contactsOSService';

