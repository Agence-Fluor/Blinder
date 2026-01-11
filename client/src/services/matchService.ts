import { type UserProfile, type SearchProfile, type MatchProfile, Gender } from "../types";
import { FUN_WORDS, DEPARTMENTS, SEARCH_PROFILE_NAMES } from "../constants";
import { BUBBLE_DATA } from "../bubble_data"

// --- HELPERS ---
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- AVATAR MAPPING HELPERS ---



export const MOCK_USERS: MatchProfile[] = Array.from({ length: 50 }).map((_, i) => {
  const gender = Math.random() > 0.5 ? Gender.FEMALE : Gender.MALE;
  const age = getRandomInt(18, 55);

  const funWord = getRandomItem(FUN_WORDS);
  const searchProfileName = getRandomItem(SEARCH_PROFILE_NAMES);

  
  return {
    id: `u_${i}`,
    searchProfileId: '',
    searchProfileName: searchProfileName,
    funWord: funWord,
    avatarUrl: '', // Not used - AvatarComponent generates it directly 
    
    age,
    gender,
    department: getRandomItem(DEPARTMENTS),
    interests: [getRandomItem(BUBBLE_DATA).id],
    
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