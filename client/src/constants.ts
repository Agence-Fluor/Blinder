
import { Interest, Gender, UserProfile, SearchProfile, Religion, BodyType, HairColor, SkinTone, EyeColor } from './types';

export const DEPARTMENTS = [
  "75 - Paris",
  "13 - Bouches-du-Rhône",
  "69 - Rhône",
  "33 - Gironde",
  "31 - Haute-Garonne",
  "06 - Alpes-Maritimes",
  "59 - Nord",
  "44 - Loire-Atlantique",
  "67 - Bas-Rhin",
  "76 - Seine-Maritime",
  "34 - Hérault",
  "35 - Ille-et-Vilaine",
  "78 - Yvelines",
  "92 - Hauts-de-Seine",
  "93 - Seine-Saint-Denis",
  "94 - Val-de-Marne",
  "95 - Val-d'Oise"
];

export const INTERESTS_LIST = [
  Interest.TRAVEL,
  Interest.MUSIC,
  Interest.FOOD,
  Interest.SPORT,
  Interest.TECH,
  Interest.ART,
  Interest.NATURE,
  Interest.MOVIES,
  Interest.READING,
  Interest.GAMING,
  Interest.FASHION,
  Interest.PHOTOGRAPHY
];

export const GENDER_OPTIONS = [
  Gender.MALE,
  Gender.FEMALE,
];

export const RELIGION_OPTIONS = [
  Religion.AGNOSTIC,
  Religion.ATHEIST,
  Religion.CHRISTIAN,
  Religion.MUSLIM,
  Religion.JEWISH,
  Religion.BUDDHIST,
  Religion.HINDU,
  Religion.SPIRITUAL,
  Religion.OTHER
];

export const BODY_TYPE_OPTIONS = [
  BodyType.SLIM,
  BodyType.ATHLETIC,
  BodyType.AVERAGE,
  BodyType.CURVY,
  BodyType.PLUS_SIZE
];

export const HAIR_COLOR_OPTIONS = [
  HairColor.BLACK,
  HairColor.BROWN,
  HairColor.BLONDE,
  HairColor.RED,
  HairColor.GREY,
  HairColor.COLORFUL
];

export const SKIN_TONE_OPTIONS = [
  SkinTone.PALE,
  SkinTone.LIGHT,
  SkinTone.TANNED,
  SkinTone.BROWN,
  SkinTone.DARK
];

export const EYE_COLOR_OPTIONS = [
  EyeColor.BROWN,
  EyeColor.BLUE,
  EyeColor.GREEN,
  EyeColor.HAZEL,
  EyeColor.GREY
];

export const FUN_WORDS = [
  "Pétillant", "Cosmique", "Mystère", "Sucre", "Tonnerre", 
  "Cactus", "Lune", "Soleil", "Bulle", "Jazz", "Disco", 
  "Nuage", "Éclair", "Velours", "Néon", "Zeste", "Indigo",
  "Bambou", "Cerise", "Horizon", "Vague", "Pixel", "Moka"
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  age: 25,
  gender: Gender.FEMALE,
  country: "FR",
  department: "75 - Paris",
  interests: [Interest.TRAVEL, Interest.MUSIC, Interest.ART],
  height: 165,
  bodyType: BodyType.AVERAGE,
  hairColor: HairColor.BROWN,
  skinTone: SkinTone.LIGHT,
  eyeColor: EyeColor.BROWN,
  religion: Religion.AGNOSTIC,
  profession: "Marketing",
  school: "Sorbonne",
  fieldOfStudy: "Communication",
  company: "Startup"
};

const DEFAULT_WEIGHTS = {
  age: 80,
  gender: 100,
  location: 70,
  interests: 50,
  height: 30,
  bodyType: 40,
  hairColor: 20,
  skinTone: 20,
  eyeColor: 10,
  religion: 20,
  school: 30,
  fieldOfStudy: 30,
  company: 20,
  profession: 40
};

export const DEFAULT_SEARCH_PROFILES: SearchProfile[] = [
  {
    id: 'sp_1',
    name: 'Love',
    minAge: 24,
    maxAge: 30,
    gender: Gender.MALE,
    country: "FR",
    departments: ["75 - Paris"],
    interests: [Interest.TRAVEL],
    height: 175,
    bodyType: BodyType.ATHLETIC,
    hairColor: HairColor.BROWN,
    skinTone: undefined,
    eyeColor: undefined,
    religion: Religion.AGNOSTIC,
    school: "",
    fieldOfStudy: "",
    company: "",
    profession: "",
    weights: { ...DEFAULT_WEIGHTS, gender: 100, age: 90, interests: 60, religion: 50 }
  },
  {
    id: 'sp_2',
    name: 'Fun',
    minAge: 20,
    maxAge: 35,
    gender: 'ANY',
    country: "FR",
    departments: ["75 - Paris"],
    interests: [Interest.MUSIC, Interest.ART],
    height: undefined,
    bodyType: undefined,
    hairColor: undefined,
    skinTone: undefined,
    eyeColor: undefined,
    religion: undefined,
    school: "",
    fieldOfStudy: "",
    company: "",
    profession: "",
    weights: { ...DEFAULT_WEIGHTS, gender: 20, age: 40, interests: 90, religion: 0 }
  }
];
