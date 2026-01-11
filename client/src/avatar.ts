// avatar.ts
// Skin color options matching avataaars-svelte library
// Available values: Tanned, Yellow, Pale, Light, Brown, DarkBrown, Black
export const SKIN_OPTIONS = [
//  { value: 'Tanned', label: 'Hâlé' },
//  { value: 'Yellow', label: 'Jaune' },
  { value: 'Pale', label: 'Pâle' },
  { value: 'Light', label: 'Clair' },
  { value: 'Brown', label: 'Brun' },
//  { value: 'DarkBrown', label: 'Brun foncé' },
  { value: 'Black', label: 'Noir' },
];

/**
 * @deprecated Use AvatarComponent from 'avataaars-svelte' directly instead
 * This function is kept for backward compatibility but returns empty string
 */
export const generateAvatarUrl = (
  gender: string, 
  skin: string, 
  hairColor: string, 
  id: string,
  hairType?: string,
  eyeType?: string,
  accessoriesType?: string,
  eyeColor?: string
): string => {
  return '';
};

// Hair type options for customization (gender-specific)
// All available short hair styles from avataaars-svelte
export const HAIR_TYPE_OPTIONS_MALE = [
  { value: 'ShortHairShortFlat', label: 'Court plat' },
//  { value: 'ShortHairShortRound', label: 'Court rond' },
  { value: 'ShortHairShortWaved', label: 'Court ondulé' },
  { value: 'ShortHairShortCurly', label: 'Court haut' },
//  { value: 'ShortHairFrizzle', label: 'Court frisé' },
  { value: 'ShortHairSides', label: 'Côtés' },
//  { value: 'ShortHairTheCaesar', label: 'César' },
//  { value: 'ShortHairTheCaesarSidePart', label: 'César raie' },
  { value: 'ShortHairDreads01', label: 'Court frisé' },
  { value: 'ShortHairDreads02', label: 'Long frisé' },
  { value: 'ShortHairShaggyMullet', label: 'Mullet' },
];

export const HAIR_TYPE_OPTIONS_FEMALE = [
  { value: 'LongHairStraight', label: 'Lisse' },
  { value: 'LongHairCurly', label: 'Bouclé' },
  { value: 'LongHairBob', label: 'Carré' },
  { value: 'LongHairBun', label: 'Chignon' },
  { value: 'LongHairNotTooLong', label: 'Mi-long' },
];

// Hair color options - using direct avataaars-svelte values
export const HAIR_COLOR_OPTIONS = [
  { value: 'Black', label: 'Noir' },
  { value: 'BrownDark', label: 'Brun' },
  { value: 'Blonde', label: 'Blond' },
  { value: 'Red', label: 'Roux' },
  { value: 'SilverGray', label: 'Gris' },
];

// Eye type options for customization
export const EYE_TYPE_OPTIONS = [
  { value: 'Default', label: 'Normal' },
  { value: 'Happy', label: 'Heureux' },
  { value: 'Wink', label: 'Clin d\'œil' },
  { value: 'Close', label: 'Fermé' },
  { value: 'Cry', label: 'Pleure' },
];

// Eye color options
export const EYE_COLOR_OPTIONS = [
  { value: 'Brown', label: 'Marron' },
  { value: 'Blue', label: 'Bleu' },
  { value: 'Green', label: 'Vert' },
  { value: 'Gray', label: 'Gris' },
];

// Accessories (glasses) options
export const ACCESSORIES_OPTIONS = [
  { value: 'Blank', label: 'Aucun' },
  { value: 'Prescription01', label: 'Lunettes rondes' },
  { value: 'Prescription02', label: 'Lunettes carrées' },
  { value: 'Round', label: 'Lunettes rondes style' },
  { value: 'Sunglasses', label: 'Lunettes de soleil' },
  { value: 'Wayfarers', label: 'Wayfarers' },
];
