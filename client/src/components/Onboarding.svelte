<script lang="ts">
  import { 
    type UserProfile, 
    Gender,
  } from '../types';
  import { 
    DEPARTMENTS, 
    GENDER_OPTIONS, 
  } from '../constants';
  import { generateAvatarUrl } from '../avatar';
  import { init_keys } from '../services/keyServices' 
  import BubbleSelector from "./BubbleSelector.svelte";
  import BackButton from "./BackButton.svelte";
  import { onMount } from "svelte";
    import { userProfile } from '../stores/app';
    import { BUBBLE_DATA } from '../bubble_data';

  //init_keys()

  let { 
    profile = $bindable<UserProfile>(), 
    onComplete 
  } = $props();


  let step = $state(0);
  let avatarUrl = $state("");

  $effect(() => {
    avatarUrl = generateAvatarUrl(
      profile.gender, 
      'Light', 
      'Brown', 
      '',
    );
  });

  function nextStep() {
    step++;
  }

  function prevStep() {
    step--;
  }

  let stepsCount = 3;///$state(3);



  const containerClass = "flex flex-col items-center justify-center min-h-screen bg-background p-6 animate-in fade-in duration-500 absolute inset-0 z-50";
  const titleClass = "text-2xl font-bold text-primary mb-2";
  const subtitleClass = "text-gray-400 text-sm mb-8 text-center max-w-m";
</script>

<div>

  {#if step > 0 && step !== 5}
    <BackButton onClick={prevStep} />
  {/if}


  {#if step === 0}
    <div class={containerClass}>
      <div class="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(209,107,134,0.4)]">
        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
        class="h-24 w-24 text-white" viewBox="5 0 272 142"
        preserveAspectRatio="xMidYMid meet">
          <g transform="translate(0.000000,142.000000) scale(0.100000,-0.100000)"
          fill="#d16b86" stroke="none">
          <path d="M495 1008 c-99 -49 -190 -99 -202 -111 -27 -24 -29 -54 -7 -85 26
          -37 65 -28 223 53 80 41 149 75 153 75 4 0 29 -24 57 -52 l50 -53 -92 -95
          c-167 -172 -179 -187 -179 -214 0 -35 29 -66 61 -66 20 0 59 32 171 145 126
          126 146 143 160 131 8 -8 43 -29 76 -48 l62 -33 -75 -170 c-82 -185 -84 -205
          -30 -235 51 -29 71 -5 155 186 l75 172 31 -9 c17 -5 59 -14 94 -20 l62 -11 0
          -177 c0 -173 1 -178 23 -199 29 -27 61 -28 87 -2 19 19 20 33 20 199 l0 178
          91 18 c50 9 94 13 98 9 5 -5 39 -80 76 -167 74 -172 95 -198 143 -181 14 5 33
          21 41 35 13 23 9 35 -60 194 -41 93 -75 172 -77 176 -2 4 6 10 16 14 11 3 47
          23 80 45 l61 39 140 -145 c147 -151 162 -161 209 -128 18 12 22 24 20 49 -2
          27 -27 59 -134 172 l-131 138 49 54 50 55 156 -78 c174 -86 205 -92 232 -43
          29 51 6 71 -205 179 -104 53 -200 97 -212 98 -14 0 -32 -13 -50 -37 -50 -66
          -147 -165 -201 -205 -66 -49 -198 -113 -277 -133 -287 -75 -611 43 -801 291
          -53 69 -71 85 -97 83 -7 0 -93 -41 -192 -91z"/>
          </g>
        </svg>
      </div>
      <h1 class="text-3xl font-bold text-white mb-2">Blinder</h1>
      <p class="text-gray-400 text-center mb-12">L'amour rend aveugle, pas vos données.</p>
      <button onclick={nextStep} class="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2">
        Commencer l'expérience
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <button onclick={nextStep} class="mt-8 bg-secondary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2">
        Importer mes clés
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  {:else}
    <div class="fixed inset-0 bg-background z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <!-- Progress Bar (Fixed) -->
      <div class="fixed top-0 left-0 right-0 z-[110] p-6 pt-4 backdrop-blur-2xl bg-background/80 border-b border-white/10">
        <div class="w-full h-1 bg-gray-800 rounded-full">
          <div class="h-full bg-primary rounded-full transition-all duration-300" style="width: {(step / stepsCount) * 100}%"></div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto no-scrollbar pt-16 px-6">
        <!-- Step 1: Identity -->
        {#if step === 1}
            <div class="flex flex-col items-center">
              <h2 class={titleClass}>Exportez vos clés</h2>
              <p class={subtitleClass}>Blinder est une application chiffrée de bout-en-bout.</p>
              <p>Nos serveurs n'ont pas accès à vos données. Vous pouvez exporter vos clés ailleurs au cas ou perderiez votre appareil.</p>

              <br/>
              <br/>
              <button class="mt-12 bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2">
                Exporter mes clés
              </button>
            </div>
        {:else if step == 2}
          <div class="flex flex-col items-center">
            <h2 class={titleClass}>Qui êtes-vous ?</h2>
            <p class={subtitleClass}>Commençons par les bases pour créer votre profil anonyme.</p>
            
            <div class="w-full space-y-6">
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

              <div>
                <label class="block text-gray-500 text-xs font-bold uppercase mb-2">Age</label>
                <input 
                  type="number" 
                  bind:value={profile.age}
                  class="w-full bg-surface p-4 rounded-xl text-white text-lg border border-gray-700 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label class="block text-gray-500 text-xs font-bold uppercase mb-2">Département</label>
                <select 
                  bind:value={profile.department}
                  class="w-full bg-surface p-4 rounded-xl text-white text-lg border border-gray-700 focus:border-primary outline-none appearance-none"
                >
                  {#each DEPARTMENTS as d}
                    <option value={d}>{d}</option>
                  {/each}
                </select>
              </div>
            </div>
          </div>
        <!-- Step 4: Interests -->
        {:else if step === 3}
          <BubbleSelector 
            onComplete={(ids) => {
              $userProfile.interests = ids
              onComplete()
            }}
            onBack={prevStep}
          >
            <div slot="progress" class="fixed top-0 left-0 right-0 z-[110] p-6 pt-4 backdrop-blur-2xl bg-background/80 border-b border-white/10">
              <div class="w-full h-1 bg-gray-800 rounded-full">
                <div class="h-full bg-primary rounded-full transition-all duration-300" style="width: {(step / stepsCount) * 100}%"></div>
              </div>
            </div>
          </BubbleSelector>
        {/if}
      </div>

      <div class="mt-6 flex gap-4">
       
        {#if step !== 3}
          <button onclick={nextStep} class="flex-1 py-4 rounded-xl font-bold text-white bg-primary shadow-lg active:scale-95 transition-transform">
            Suivant
          </button>
        {/if}
        
      </div>
    </div>
  {/if}
</div>