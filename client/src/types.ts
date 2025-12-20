
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

export enum Religion {
  AGNOSTIC = 'Agnostique',
  ATHEIST = 'Athée',
  CHRISTIAN = 'Chrétien(ne)',
  MUSLIM = 'Musulman(e)',
  JEWISH = 'Juif/Juive',
  BUDDHIST = 'Bouddhiste',
  HINDU = 'Hindouiste',
  SPIRITUAL = 'Spirituel(le)',
  OTHER = 'Autre'
}

export enum BodyType {
  SLIM = 'Mince',
  ATHLETIC = 'Athlétique',
  AVERAGE = 'Moyen',
  CURVY = 'Formes',
  PLUS_SIZE = 'Rondeurs'
}

export enum HairColor {
  BLACK = 'Noirs',
  BROWN = 'Bruns',
  BLONDE = 'Blonds',
  RED = 'Roux',
  GREY = 'Gris/Blanc',
  COLORFUL = 'Coloré'
}

export enum SkinTone {
  PALE = 'Très clair',
  LIGHT = 'Clair',
  TANNED = 'Mat',
  BROWN = 'Foncé',
  DARK = 'Très foncé'
}

export enum EyeColor {
  BROWN = 'Marrons',
  BLUE = 'Bleus',
  GREEN = 'Verts',
  HAZEL = 'Noisettes',
  GREY = 'Gris'
}

// User Profile is now anonymous but detailed
export interface UserProfile {
  age: number;
  gender: Gender;
  country: string; // Fixed to "FR"
  department: string;
  interests: Interest[];
  
  // Physical
  height: number; // in cm
  bodyType: BodyType;
  hairColor: HairColor;
  skinTone: SkinTone;
  eyeColor: EyeColor;

  // Identity & Social
  religion: Religion;
  profession: string;
  school: string;
  fieldOfStudy: string;
  company: string;
}

export interface SearchProfileWeights {
  age: number;
  gender: number;
  location: number;
  interests: number;
  
  // Physical Weights
  height: number;
  bodyType: number;
  hairColor: number;
  skinTone: number;
  eyeColor: number;

  // Identity Weights
  religion: number;
  profession: number;
  school: number;
  fieldOfStudy: number;
  company: number;
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

  // Advanced Criteria (Preferences)
  height?: number; 
  bodyType?: BodyType;
  hairColor?: HairColor;
  skinTone?: SkinTone;
  eyeColor?: EyeColor;
  
  religion?: Religion;
  school?: string;
  fieldOfStudy?: string;
  company?: string;
  profession?: string;

  // Importance weights (0-100)
  weights: SearchProfileWeights;
}

export interface MatchProfile {
  id: string;
  searchProfileId: string;
  searchProfileName: string;
  funWord: string;
  bio: string;
  avatarUrl: string;

  // Attributes
  age: number;
  gender: Gender;
  department: string;
  interests: Interest[];
  
  // Extended Attributes
  height: number;
  bodyType: BodyType;
  hairColor: HairColor;
  skinTone: SkinTone;
  eyeColor: EyeColor;
  religion: Religion;
  
  profession: string;
  school?: string;
  fieldOfStudy?: string;
  company?: string;
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
