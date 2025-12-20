import { type UserProfile, type SearchProfile, type MatchProfile, Gender, Interest } from "../types";
import { FUN_WORDS, DEPARTMENTS } from "../constants";
import { generateAvatarUrl } from "../avatar"

// --- HELPERS ---
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- AVATAR MAPPING HELPERS ---



export const MOCK_USERS: MatchProfile[] = Array.from({ length: 50 }).map((_, i) => {
  const gender = Math.random() > 0.5 ? Gender.FEMALE : Gender.MALE;
  const age = getRandomInt(18, 55);
  
  return {
    id: `u_${i}`,
    searchProfileId: '',
    searchProfileName: '',
    funWord: '',
    avatarUrl: generateAvatarUrl(gender, 'Light', 'Brown', `u_${i}`), 
    
    age,
    gender,
    department: getRandomItem(DEPARTMENTS),
    interests: [getRandomItem(Object.values(Interest)), getRandomItem(Object.values(Interest))],
    
  };
});


// --- MATCHING ENGINE ---
export const generateMatchesForProfile = async (
  userProfile: UserProfile,
  searchProfile: SearchProfile
): Promise<MatchProfile[]> => {
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return MOCK_USERS
};

// --- CHAT LOGIC ---
const RESPONSES = [
  "C'est fascinant !",
  "Ah oui, vraiment ?",
  "J'adore cette façon de voir les choses.",
  "Tu as totalement raison.",
  "Raconte-m'en plus !",
  "Haha, excellent !",
  "Je ne m'y attendais pas du tout.",
  "Et sinon, tu aimes voyager ?",
  "C'est exactement ce que je cherchais ici."
];

export const generateChatResponse = async (match: MatchProfile, userText: string, history: any[]): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return getRandomItem(RESPONSES);
};

export const getWelcomeMessage = (match: MatchProfile): string => {
  return `(Personne rencontrée via le profil "${match.searchProfileName}" il a 5mn)`;
};