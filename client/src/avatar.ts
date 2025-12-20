// avatar.ts
export const mapSkinToGetAvataaarsSkin = (skin: string) => {
  switch (skin.toLowerCase()) {
    case 'light': return 'Pale';
    case 'tanned': return 'Tanned';
    case 'brown': return 'Brown';
    case 'dark': return 'DarkBrown';
    case 'yellow': return 'Yellow';
    default: return 'Light';
  }
};

export const mapHairToGetAvataaarsHair = (hair: string) => {
  switch (hair.toLowerCase()) {
    case 'black': return 'Black';
    case 'brown': return 'BrownDark';
    case 'blonde': return 'Blonde';
    case 'red': return 'Red';
    case 'gray': return 'SilverGray';
    default: return 'BrownDark';
  }
};

export const generateAvatarUrl = (gender: string, skin: string, hair: string, id: string) => {
  const seed = id.replace(/[^a-zA-Z0-9]/g, '');
  const hash = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const skinColor = mapSkinToGetAvataaarsSkin(skin);
  const hairColor = mapHairToGetAvataaarsHair(hair);

  const topOptions = ['ShortHairShortFlat', 'LongHairStraight', 'Hijab', 'Turban'];
  const topType = topOptions[hash % topOptions.length];

  const accessoriesType =
    hash % 5 === 0 ? 'Prescription02' : hash % 7 === 0 ? 'Sunglasses' : 'Blank';

  const clotheType = 'ShirtCrewNeck';
  const clotheColor = 'Blue03';

  const params = new URLSearchParams({
    topType,
    hairColor,
    accessoriesType,
    eyebrowType: 'Default',
    eyeType: 'Default',
    mouthType: 'Smile',
    skinColor,
    clotheType,
    clotheColor,
  });

  return `https://avataaars.io/?${params.toString()}`;
};
