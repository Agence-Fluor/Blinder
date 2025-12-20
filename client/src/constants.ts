
import { Interest, Gender, UserProfile, SearchProfile } from './types';

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
  "69 - Rhône",
  "76 - Seine-Maritime",
  "34 - Hérault",
  "35 - Ille-et-Vilaine",
  "78 - Yvelines",
  "92 - Hauts-de-Seine",
  "93 - Seine-Saint-Denis",
  "94 - Val-de-Marne",
  "95 - Val-d'Oise"
];

export const GENDER_OPTIONS = [
  Gender.MALE,
  Gender.FEMALE,
];

export const FUN_WORDS = [
  "Pétillant", "Cosmique", "Mystère", "Sucre", "Tonnerre", 
  "Cactus", "Lune", "Soleil", "Bulle", "Jazz", "Disco", 
  "Nuage", "Éclair", "Velours", "Néon", "Zeste", "Indigo",
  "Bambou", "Cerise", "Horizon", "Vague", "Pixel", "Moka"
];

export const SEARCH_PROFILE_NAMES = [
  "Love", "Fun", "Work"
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  age: 25,
  gender: Gender.FEMALE,
  country: "FR",
  department: "75 - Paris",
  interests: [],
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
  }
];
