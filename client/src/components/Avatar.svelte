<!-- Avatar.svelte - Wrapper component for avataaars-svelte -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { AvatarComponent } from 'avataaars-svelte';
  import { 
    HAIR_TYPE_OPTIONS_MALE,
    HAIR_TYPE_OPTIONS_FEMALE
  } from '../avatar';

  interface Props {
    // Props for generating avatar
    gender?: string;
    skin?: string;
    hairColor?: string;
    id?: string;
    hairType?: string;
    eyeType?: string;
    accessoriesType?: string;
    eyeColor?: string;
    // Legacy support: if avatarUrl is provided, use it as fallback
    avatarUrl?: string;
    // Styling
    className?: string;
    style?: string;
    size?: number; // Size in pixels
  }

  let {
    gender = 'ANY',
    skin = 'Light',
    hairColor = 'brown',
    id = '',
    hairType,
    eyeType,
    accessoriesType,
    eyeColor,
    avatarUrl,
    className = '',
    style = '',
    size = 100
  }: Props = $props();

  // Generate deterministic values from id
  const seed = id.replace(/[^a-zA-Z0-9]/g, '');
  const hash = seed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  // Use skin and hairColor directly (they should already be in avataaars format)
  const skinColor = skin || 'Light';
  const hairColorMapped = hairColor || 'BrownDark';

  // Use provided hairType or generate from hash based on gender
  let topType = hairType;
  if (!topType) {
    const isMale = gender === 'Homme' || gender === 'MALE';
    const options = isMale ? HAIR_TYPE_OPTIONS_MALE : HAIR_TYPE_OPTIONS_FEMALE;
    topType = options[hash % options.length].value;
  }

  // Use provided values or defaults
  const eye = eyeType || 'Default';
  const eyeColorMapped = eyeColor || 'Brown';
  const accessories = accessoriesType || 'Blank';
  const clotheType = 'ShirtCrewNeck';
  const clotheColor = 'Blue03';
  const eyebrowType = 'Default';
  const mouthType = 'Smile';
  const avatarStyle = 'Circle';

  let blobUrl = $state('');

  function handleBlob(blob: Blob) {
    blobUrl = URL.createObjectURL(blob);
  }

  // Cleanup blob URL on unmount
  onDestroy(() => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  });
</script>

{#if blobUrl}
  <img 
    src={blobUrl} 
    alt="Avatar" 
    class="rounded-full {className}"
    style="width: {size}px; height: {size}px; aspect-ratio: 1; object-fit: cover; {style}"
  />
{:else if avatarUrl && avatarUrl !== ''}
  <!-- Fallback to URL if provided (for backward compatibility) -->
  <img 
    src={avatarUrl} 
    alt="Avatar" 
    class="rounded-full {className}"
    style="width: {size}px; height: {size}px; aspect-ratio: 1; object-fit: cover; {style}"
  />
{:else}
  <!-- Render AvatarComponent and capture blob -->
  <div style="width: {size}px; height: {size}px; aspect-ratio: 1; {style}" class="rounded-full overflow-hidden bg-transparent {className}">
    <AvatarComponent
      getBlob={handleBlob}
      {avatarStyle}
      {topType}
      accessoriesType={accessories}
      hairColor={hairColorMapped}
      facialHairType="Blank"
      facialHairColor=""
      {clotheType}
      {clotheColor}
      graphicType=""
      eyeType={eye}
      {eyebrowType}
      {mouthType}
      skinColor={skinColor}
      style="width: 100%; height: 100%;"
    />
  </div>
{/if}

