<!-- AvatarEditor.svelte - Component for editing virtual avatar -->
<script lang="ts">
  import { 
    type UserProfile, 
    Gender,
  } from '../types';
  import { 
    GENDER_OPTIONS,
  } from '../constants';
  import { 
    HAIR_TYPE_OPTIONS_MALE, 
    HAIR_TYPE_OPTIONS_FEMALE,
    HAIR_COLOR_OPTIONS,
    SKIN_OPTIONS,
  } from '../avatar';
  import { AvatarComponent } from 'avataaars-svelte';

  interface Props {
    profile: UserProfile;
    onClose: () => void;
  }

  let { profile = $bindable(), onClose }: Props = $props();

  // Reset hair style when gender changes
  $effect(() => {
    if (profile.gender) {
      const isMale = profile.gender === Gender.MALE;
      const currentHair = profile.avatarHair;
      const maleOptions = HAIR_TYPE_OPTIONS_MALE.map(h => h.value);
      const femaleOptions = HAIR_TYPE_OPTIONS_FEMALE.map(h => h.value);
      
      // If current hair style doesn't match the new gender, reset to default
      if (isMale && !maleOptions.includes(currentHair || '')) {
        profile.avatarHair = HAIR_TYPE_OPTIONS_MALE[0].value;
      } else if (!isMale && !femaleOptions.includes(currentHair || '')) {
        profile.avatarHair = HAIR_TYPE_OPTIONS_FEMALE[0].value;
      }
    }
  });

  // Derived reactive values for avatar props
  const topType = $derived(profile.avatarHair || (profile.gender === Gender.MALE ? HAIR_TYPE_OPTIONS_MALE[0].value : HAIR_TYPE_OPTIONS_FEMALE[0].value));
  const hairColor = $derived(profile.avatarHairColor || 'BrownDark');
  const skinColor = $derived(profile.avatarSkin || 'Light');
  const eyeType = $derived(profile.avatarEyes || 'Default');
</script>

<div class="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
  <div class="bg-surface rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-primary">Modifier l'avatar virtuel</h2>
      <button
        onclick={onClose}
        class="text-gray-400 hover:text-white transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Avatar Preview -->
    <div class="flex flex-col items-center mb-6">
      <div class="w-32 h-32 rounded-full overflow-hidden border-2 border-primary mb-4">
        <AvatarComponent
          avatarStyle="Circle"
          {topType}
          accessoriesType={profile.avatarAccessories || 'Blank'}
          {hairColor}
          facialHairType="Blank"
          facialHairColor=""
          clotheType="ShirtCrewNeck"
          clotheColor="Blue03"
          graphicType=""
          {eyeType}
          eyebrowType="Default"
          mouthType="Smile"
          {skinColor}
          style="width: 100%; height: 100%;"
        />
      </div>
      
      <div class="w-full space-y-4">
        <div>
          <label class="block text-gray-500 text-xs font-bold uppercase mb-2">Genre</label>
          <div class="grid grid-cols-2 gap-3">
            {#each GENDER_OPTIONS as g}
              <button 
                onclick={() => profile.gender = g}
                class={`py-3 rounded-xl border ${profile.gender === g ? 'border-primary bg-primary/20 text-primary' : 'border-gray-700 text-gray-400'}`}
              >
                {g}
              </button>
            {/each}
          </div>
        </div>
        
        <!-- Hair Type -->
        <div>
          <label for="hairType" class="block text-gray-500 text-xs font-bold uppercase mb-2">Style de cheveux</label>
          {#key profile.gender}
            <select 
              id="hairType"
              bind:value={profile.avatarHair}
              class="w-full bg-surface p-4 rounded-xl text-white text-lg border border-gray-700 focus:border-primary outline-none appearance-none"
            >
              {#each (profile.gender === Gender.MALE ? HAIR_TYPE_OPTIONS_MALE : HAIR_TYPE_OPTIONS_FEMALE) as hair}
                <option value={hair.value}>{hair.label}</option>
              {/each}
            </select>
          {/key}
        </div>

        <!-- Hair Color -->
        <div>
          <label for="hairColor" class="block text-gray-500 text-xs font-bold uppercase mb-2">Couleur de cheveux</label>
          <select 
            id="hairColor"
            bind:value={profile.avatarHairColor}
            class="w-full bg-surface p-4 rounded-xl text-white text-lg border border-gray-700 focus:border-primary outline-none appearance-none"
          >
            {#each HAIR_COLOR_OPTIONS as color}
              <option value={color.value}>{color.label}</option>
            {/each}
          </select>
        </div>

        <!-- Skin Type -->
        <div>
          <label for="skinColor" class="block text-gray-500 text-xs font-bold uppercase mb-2">Couleur de peau</label>
          <select 
            id="skinColor"
            bind:value={profile.avatarSkin}
            class="w-full bg-surface p-4 rounded-xl text-white text-lg border border-gray-700 focus:border-primary outline-none appearance-none"
          >
            {#each SKIN_OPTIONS as skin}
              <option value={skin.value}>{skin.label}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <div class="flex gap-3 mt-6">
      <button
        onclick={onClose}
        class="flex-1 bg-gray-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-600 transition"
      >
        Fermer
      </button>
    </div>
  </div>
</div>

