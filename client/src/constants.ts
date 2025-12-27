
import { BubbleItem, Gender, UserProfile, SearchProfile } from './types';
import { BUBBLE_DATA } from './bubble_data'

export const DEPARTMENTS = [
  // Départements métropolitains (exemples, tu peux compléter tous)
  "Ain",
  "Aisne",
  "Allier",
  "Alpes-de-Haute-Provence",
  "Hautes-Alpes",
  "Alpes-Maritimes",
  "Ardèche",
  "Ardennes",
  "Ariège",
  "Aube",
  "Aude",
  "Aveyron",
  "Bouches-du-Rhône",
  "Calvados",
  "Cantal",
  "Charente",
  "Charente-Maritime",
  "Cher",
  "Corrèze",
  "Corse-du-Sud",
  "Haute-Corse",
  "Côte-d'Or",
  "Côtes-d'Armor",
  "Creuse",
  "Dordogne",
  "Doubs",
  "Drôme",
  "Eure",
  "Eure-et-Loir",
  "Finistère",
  "Gard",
  "Haute-Garonne",
  "Gers",
  "Gironde",
  "Hérault",
  "Ille-et-Vilaine",
  "Indre",
  "Indre-et-Loire",
  "Isère",
  "Jura",
  "Landes",
  "Loir-et-Cher",
  "Loire",
  "Haute-Loire",
  "Loire-Atlantique",
  "Loiret",
  "Lot",
  "Lot-et-Garonne",
  "Lozère",
  "Maine-et-Loire",
  "Manche",
  "Marne",
  "Haute-Marne",
  "Mayenne",
  "Meurthe-et-Moselle",
  "Meuse",
  "Morbihan",
  "Moselle",
  "Nièvre",
  "Nord",
  "Oise",
  "Orne",
  "Pas-de-Calais",
  "Puy-de-Dôme",
  "Pyrénées-Atlantiques",
  "Hautes-Pyrénées",
  "Pyrénées-Orientales",
  "Bas-Rhin",
  "Haut-Rhin",
  "Rhône",
  "Haute-Saône",
  "Saône-et-Loire",
  "Sarthe",
  "Savoie",
  "Haute-Savoie",
  "Paris",
  "Seine-Maritime",
  "Seine-et-Marne",
  "Yvelines",
  "Deux-Sèvres",
  "Somme",
  "Tarn",
  "Tarn-et-Garonne",
  "Var",
  "Vaucluse",
  "Vendée",
  "Vienne",
  "Haute-Vienne",
  "Vosges",
  "Yonne",
  "Territoire de Belfort",
  "Essonne",
  "Hauts-de-Seine",
  "Seine-Saint-Denis",
  "Val-de-Marne",
  "Val-d'Oise",

  // DOM
  "Guadeloupe",
  "Martinique",
  "Guyane",
  "La Réunion",
  "Mayotte",

  // COM
  "Saint-Pierre-et-Miquelon",
  "Wallis-et-Futuna",
  "Polynésie française",
  "Saint-Barthélemy",
  "Saint-Martin",

  // Nouvelle-Calédonie
  "Nouvelle-Calédonie"
];

// Tri alphabétique
DEPARTMENTS.sort((a, b) => a.localeCompare(b, 'fr'));

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
  department: "Ain",
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
    interests: [],
  },
  {
    id: 'sp_2',
    name: 'Fun',
    minAge: 20,
    maxAge: 35,
    gender: 'ANY',
    country: "FR",
    departments: ["75 - Paris"],
    interests: [],
  }
];
