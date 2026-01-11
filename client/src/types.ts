export interface BubbleItem {
  id: string;
  label: string;
  color: string;
  children?: BubbleItem[];
  depth: number;
}

export enum Gender {
  MALE = 'Homme',
  FEMALE = 'Femme'
}

export interface UserProfile {
  age: number;
  gender: Gender;
  country: string; // Fixed to "FR"
  department: string;
  interests: string[];
  // Avatar customization
  avatarHair?: string; // e.g., 'ShortHairShortFlat', 'LongHairStraight'
  avatarHairColor?: string; // e.g., 'black', 'brown', 'blonde'
  avatarEyes?: string; // e.g., 'Default', 'Happy', 'Wink'
  avatarEyeColor?: string; // e.g., 'Brown', 'Blue', 'Green'
  avatarAccessories?: string; // e.g., 'Blank', 'Prescription01', 'Sunglasses'
  avatarSkin?: string; // e.g., 'Light', 'Tanned', 'Brown'
  // Real profile photo (after IRL meeting)
  realPhotoUrl?: string;
  realName?: string;
}

// Users can have multiple search profiles
export interface SearchProfile {
  id: string;
  name: string;
  
  // Basic Criteria
  minAge: number;
  maxAge: number;
  gender: Gender | 'ANY';
  country: string;
  departments: string[];
  interests: string[]; 
}

export interface MatchProfile {
  id: string;
  searchProfileId: string;
  searchProfileName: string;
  funWord: string;
  avatarUrl: string;

  // Attributes
  age: number;
  gender: Gender;
  department: string;
  interests: string[];
}

export interface Message {
  id: string;
  senderId: string; // 'user' or matchId
  text: string;
  timestamp: number;
  attachment?: {
    id: string;
    type: 'image' | 'video' | 'audio' | 'pdf' | 'other';
    fileName: string;
    mimeType: string;
    size: number;
  };
}

export interface ChatSession {
  matchId: string;
  match: MatchProfile;
  messages: Message[];
  unread: boolean;
}

export interface SelectionState {
  selectedIds: string[];
  activeParentId: string | null;
}
