// src/lib/stores/app.ts
import { writable, derived, get } from 'svelte/store';
import type {
  UserProfile, SearchProfile, ChatSession, Message
} from '../types';
import {
  DEFAULT_USER_PROFILE,
  DEFAULT_SEARCH_PROFILES
} from '../constants';
import { generateMatchesForProfile, generateChatResponse, getWelcomeMessage } from '../services/matchService';
import { generateAvatarUrl } from '../avatar';

// --- state stores ---
export const firstVisit = writable(true); // persist as you wish (localStorage)
export const showOnboarding = writable(true); // mirrored to firstVisit logic

export const userProfile = writable<UserProfile>({ ...DEFAULT_USER_PROFILE });
export const searchProfiles = writable<SearchProfile[]>(JSON.parse(JSON.stringify(DEFAULT_SEARCH_PROFILES)));
export const sessions = writable<ChatSession[]>([]);
export const activeChatId = writable<string | null>(null);
export const isEditingUser = writable(false);
export const editingSearchId = writable<string | null>(null);

// derived
export const activeSession = derived([sessions, activeChatId], ([$sessions, $activeChatId]) =>
  $sessions.find(s => s.matchId === $activeChatId)
);

export const userAvatar = derived(userProfile, $u =>
  generateAvatarUrl($u.gender, $u.skinTone, $u.hairColor, '')
);

// --- actions ---
export async function refreshMatches() {
  const up = get(userProfile);
  const sps = get(searchProfiles);
  const curSessions = [...get(sessions)];

  for (const sp of sps) {
    const matches = await generateMatchesForProfile(up, sp);
    for (const match of matches) {
      if (!curSessions.find(s => s.matchId === match.id)) {
        curSessions.push({
          matchId: match.id,
          match,
          messages: [{
            id: 'sys_1',
            senderId: match.id,
            text: getWelcomeMessage(match),
            timestamp: Date.now()
          }],
          unread: true
        });
      }
    }
  }

  curSessions.sort((a,b) => b.messages[b.messages.length-1].timestamp - a.messages[a.messages.length-1].timestamp);
  sessions.set(curSessions);
}

export async function handleSendMessage(text: string) {
  if (!text.trim()) return;
  const curSessions = [...get(sessions)];
  const aid = get(activeChatId);
  if (!aid) return;
  const idx = curSessions.findIndex(s => s.matchId === aid);
  if (idx === -1) return;

  const userMsg: Message = {
    id: Date.now().toString(),
    senderId: 'user',
    text,
    timestamp: Date.now()
  };
  curSessions[idx].messages = [...curSessions[idx].messages, userMsg];
  sessions.set(curSessions);

  // build conversation for model
  const conv = curSessions[idx].messages.map(m => ({ role: m.senderId === 'user' ? 'user' : 'model', text: m.text }));
  const aiText = await generateChatResponse(curSessions[idx].match, text, conv);

  const aiMsg: Message = {
    id: (Date.now()+1).toString(),
    senderId: curSessions[idx].matchId,
    text: aiText,
    timestamp: Date.now()
  };

  curSessions[idx].messages = [...curSessions[idx].messages, aiMsg];
  sessions.set(curSessions);
}

export function createSearchProfile() {
  const newId = `sp_${Date.now()}`;
  const newProfile: SearchProfile = {
    id: newId,
    name: 'Nouveau',
    minAge: 18,
    maxAge: 99,
    gender: 'ANY',
    country: 'FR',
    departments: [get(userProfile).department],
    interests: [],
    weights: {
      age:50, gender:50, location:50, interests:50,
      school:50, fieldOfStudy:50, company:50, profession:50,
      height:50, bodyType:50, religion:50,
      hairColor:30, skinTone:30, eyeColor:20
    }
  };
  searchProfiles.update(s => [...s, newProfile]);
  editingSearchId.set(newId);
}

export function deleteSearchProfile(id: string) {
  searchProfiles.update(s => s.filter(p => p.id !== id));
  editingSearchId.set(null);
}
