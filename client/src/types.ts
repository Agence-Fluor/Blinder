
export enum Gender {
  MALE = 'Homme',
  FEMALE = 'Femme'
}

export enum Interest {
  TRAVEL = 'Voyage',
  MUSIC = 'Musique',
  FOOD = 'Gastronomie',
  SPORT = 'Sport',
  TECH = 'Tech',
  ART = 'Art',
  NATURE = 'Nature',
  MOVIES = 'Cinéma',
  READING = 'Lecture',
  GAMING = 'Jeux Vidéo',
  FASHION = 'Mode',
  PHOTOGRAPHY = 'Photographie'
}

export interface UserProfile {
  age: number;
  gender: Gender;
  country: string; // Fixed to "FR"
  department: string;
  interests: Interest[];
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
  interests: Interest[]; 
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
  interests: Interest[];
}

export interface Message {
  id: string;
  senderId: string; // 'user' or matchId
  text: string;
  timestamp: number;
}

export interface ChatSession {
  matchId: string;
  match: MatchProfile;
  messages: Message[];
  unread: boolean;
}


export interface BubbleItem {
  id: string;
  label: string;
  color: string;
  children?: BubbleItem[];
  depth: number;
}

export interface SelectionState {
  selectedIds: string[];
  activeParentId: string | null;
}
