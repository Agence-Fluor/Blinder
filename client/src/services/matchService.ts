import { type UserProfile, type SearchProfile, type MatchProfile, Gender, Interest, Religion, BodyType, HairColor, SkinTone, EyeColor } from "../types";
import { FUN_WORDS, DEPARTMENTS } from "../constants";
import { generateAvatarUrl } from "../avatar"

// --- HELPERS ---
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- AVATAR MAPPING HELPERS ---

// Map French Enums to DiceBear Hex Codes or Values
const mapSkinColor = (skin: SkinTone | string): string => {
  switch (skin) {
    case SkinTone.PALE: return 'f8d25c'; // Pale Yellowish
    case SkinTone.LIGHT: return 'edb98a'; // Light
    case SkinTone.TANNED: return 'fd9841'; // Tanned
    case SkinTone.BROWN: return 'd08b5b'; // Brown
    case SkinTone.DARK: return '614335'; // Dark
    default: return 'edb98a';
  }
};

const mapHairColor = (hair: HairColor | string): string => {
  switch (hair) {
    case HairColor.BLACK: return '2c1b18';
    case HairColor.BROWN: return '4a312c';
    case HairColor.BLONDE: return 'b58143';
    case HairColor.RED: return 'c93305';
    case HairColor.GREY: return 'e8e1e1';
    case HairColor.COLORFUL: return 'f59797';
    default: return '4a312c';
  }
};

const getTopStyles = (gender: Gender | string, religion?: Religion | string): string[] => {
  // Religious Overrides
  if (religion === Religion.MUSLIM && gender === Gender.FEMALE) {
    return ['hijab'];
  }
  if (religion === Religion.MUSLIM && gender === Gender.MALE) {
    return ['turban', 'shortHairTheCaesar', 'shortHairTheCaesarSidePart']; 
  }
  if (religion === Religion.OTHER) {
     return ['turban', 'shortHair', 'longHairStraight'];
  }

  // Gender specific
  if (gender === Gender.MALE) {
    return [
      'shortHairDreads01', 'shortHairDreads02', 'shortHairFrizzle', 
      'shortHairShaggyMullet', 'shortHairShortCurly', 'shortHairShortFlat', 
      'shortHairShortRound', 'shortHairShortWaved', 'shortHairSides', 
      'shortHairTheCaesar', 'shortHairTheCaesarSidePart', 'winterHat1', 'winterHat2'
    ];
  } else if (gender === Gender.FEMALE) {
    return [
      'longHairBigHair', 'longHairBob', 'longHairBun', 'longHairCurly', 
      'longHairCurvy', 'longHairDreads', 'longHairFrida', 'longHairFro', 
      'longHairFroBand', 'longHairMiaWallace', 'longHairNotTooLong', 
      'longHairShavedSides', 'longHairStraight', 'longHairStraight2', 'longHairStraightStrand'
    ];
  } else {
    // Non-binary / Any
    return ['shortHairFrizzle', 'longHairBob', 'shortHairTheCaesar', 'longHairCurly', 'shortHairShaggyMullet'];
  }
};

// --- MOCK DATABASE ---
const PROFESSIONS = ["Architecte", "Développeur", "Médecin", "Artiste", "Étudiant", "Avocat", "Ingénieur", "Designer", "Professeur", "Entrepreneur"];
const BIOS = [
  "Passionné par la vie et les découvertes.",
  "Cherche quelqu'un pour partager des aventures.",
  "Amateur de café et de longues discussions.",
  "Explorateur urbain et rêveur.",
  "J'aime l'art, la musique et les voyages.",
  "Simple, honnête et curieux.",
  "La vie est trop courte pour s'ennuyer."
];

export const MOCK_USERS: MatchProfile[] = Array.from({ length: 50 }).map((_, i) => {
  const gender = Math.random() > 0.5 ? Gender.FEMALE : Gender.MALE;
  const age = getRandomInt(18, 55);
  const skin = getRandomItem(Object.values(SkinTone));
  const hair = getRandomItem(Object.values(HairColor));
  const religion = getRandomItem(Object.values(Religion));
  
  return {
    id: `u_${i}`,
    searchProfileId: '',
    searchProfileName: '',
    funWord: '',
    bio: getRandomItem(BIOS),
    avatarUrl: generateAvatarUrl(gender, skin, hair, `u_${i}`), 
    
    age,
    gender,
    department: getRandomItem(DEPARTMENTS),
    interests: [getRandomItem(Object.values(Interest)), getRandomItem(Object.values(Interest))],
    
    height: getRandomInt(155, 195),
    bodyType: getRandomItem(Object.values(BodyType)),
    hairColor: hair as HairColor,
    skinTone: skin as SkinTone,
    eyeColor: getRandomItem(Object.values(EyeColor)),
    religion: religion as Religion,
    
    profession: getRandomItem(PROFESSIONS),
    school: Math.random() > 0.7 ? "Université" : undefined,
    company: Math.random() > 0.7 ? "Tech Corp" : undefined
  };
});


// --- MATCHING ENGINE ---
export const generateMatchesForProfile = async (
  userProfile: UserProfile,
  searchProfile: SearchProfile
): Promise<MatchProfile[]> => {
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const scoredUsers = MOCK_USERS.map(candidate => {
    let score = 0;
    let maxScore = 0;
    const w = searchProfile.weights;

    // 1. Age (Range)
    maxScore += w.age;
    if (candidate.age >= searchProfile.minAge && candidate.age <= searchProfile.maxAge) {
      score += w.age;
    } else {
      const diff = Math.min(Math.abs(candidate.age - searchProfile.minAge), Math.abs(candidate.age - searchProfile.maxAge));
      if (diff < 5) score += w.age * 0.5;
    }

    // 2. Gender
    maxScore += w.gender;
    if (searchProfile.gender === 'ANY' || candidate.gender === searchProfile.gender) {
      score += w.gender;
    }

    // 3. Location
    maxScore += w.location;
    if (searchProfile.departments.includes(candidate.department)) {
      score += w.location;
    }

    // 4. Interests
    maxScore += w.interests;
    const sharedInterests = candidate.interests.filter(i => searchProfile.interests.includes(i));
    if (searchProfile.interests.length > 0) {
      score += (w.interests * (sharedInterests.length / searchProfile.interests.length));
    } else {
      score += w.interests;
    }

    // 5. Attributes Matching
    const checkAttr = (userVal: any, searchVal: any, weight: number) => {
      maxScore += weight;
      if (!searchVal || userVal === searchVal) score += weight;
    };

    checkAttr(candidate.bodyType, searchProfile.bodyType, w.bodyType);
    checkAttr(candidate.hairColor, searchProfile.hairColor, w.hairColor);
    checkAttr(candidate.skinTone, searchProfile.skinTone, w.skinTone);
    checkAttr(candidate.eyeColor, searchProfile.eyeColor, w.eyeColor);
    checkAttr(candidate.religion, searchProfile.religion, w.religion);
    checkAttr(candidate.profession, searchProfile.profession, w.profession);

    // Height
    maxScore += w.height;
    if (!searchProfile.height) {
      score += w.height;
    } else {
      const hDiff = Math.abs(candidate.height - searchProfile.height);
      if (hDiff < 5) score += w.height;
      else if (hDiff < 10) score += w.height * 0.5;
    }

    return { ...candidate };
  });

  // Filter and Format
  return scoredUsers
    .map(u => ({
      ...u,
      id: `${searchProfile.id}_${u.id}`,
      searchProfileId: searchProfile.id,
      searchProfileName: searchProfile.name,
      funWord: getRandomItem(FUN_WORDS)
    }));
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