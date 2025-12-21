<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    type UserProfile, 
    type SearchProfile, 
    type ChatSession, 
    type MatchProfile, 
    type Message, 
    Gender,
  } from '../types';
  import { 
    DEPARTMENTS, 
    GENDER_OPTIONS,
    DEFAULT_USER_PROFILE, 
    DEFAULT_SEARCH_PROFILES 
  } from '../constants';
  import { generateMatchesForProfile, generateChatResponse, getWelcomeMessage } from '../services/matchService';
  import { generateAvatarUrl } from "../avatar"
  
  import RangeSlider from '../components/RangeSlider.svelte';
  import BubbleSelector from '../components/BubbleSelector.svelte';
  import BubbleTags from '../components/BubbleTags.svelte';

  import { userProfile } from "../stores/app"
    import { BUBBLE_DATA } from '../bubble_data';

  /*
  let _userProfile =  $state.from(userProfile);

  $effect(() => {
    userProfile.set(_userProfile)
  })
*/
  // --- STATE ---
  let searchProfiles: SearchProfile[] = $state(JSON.parse(JSON.stringify(DEFAULT_SEARCH_PROFILES)));
  let sessions: ChatSession[] = $state([]);
  let activeChatId: string | null = $state(null);

  // Modal/Edit State
  let editingSearchId: string | null = $state(null);
  let isEditingUser = $state(false);
  let isEditingInterests = $state(false);

  function handleInterestsComplete(ids: string[]) {
    isEditingInterests = false;
    $userProfile.interests = ids
  }

  // Derived / reactive
  let activeSession: ChatSession | undefined = $state(undefined);
  let userAvatar: string = $state('');

  $effect(() => {
	activeSession = sessions.find(s => s.matchId === activeChatId);
  });

  $effect(() => {
	userAvatar = generateAvatarUrl(
      $userProfile.gender,
      'Light',
      'Brown',
	  ''
	);
  });


  const handleCreateSearchProfile = () => {
    const newId = `sp_${Date.now()}`;
    const newProfile: SearchProfile = {
      id: newId,
      name: 'Nouveau',
      minAge: 18,
      maxAge: 99,
      gender: 'ANY',
      country: 'FR',
      departments: [$userProfile.department],
      interests: []
    };
    searchProfiles = [...searchProfiles, newProfile];
    editingSearchId = newId;
  };

  const handleDeleteSearchProfile = (id: string) => {
    searchProfiles = searchProfiles.filter(p => p.id !== id);
    editingSearchId = null;
  };

  import { getContext } from "svelte";
  import Popup from '../components/Popup.svelte';
  import QrContent from '../components/QrContent.svelte';

  let showQR = $state(false);
// --- ICONS (Inline for simplicity) ---
</script>

<Popup bind:open={showQR}>
   
  
      <div style="margin-top:1rem; text-align:right">
        <button onclick={close}>Close</button>
      </div>
  </Popup>

<div class="pt-10 pb-24 px-4 min-h-screen">
    <!-- PROFILE TAB -->
    <div class="space-y-4">
        
        <!-- User Profile Card -->
        <section>
            <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-white">Mon Profil Anonyme 
                
                <small> &nbsp;&nbsp;
                
                        <a href="#" class="text-primary text-sm" onclick={() => showQR = true}><i class="fa fa-share"></i> Partager</a>
 
                </small>
            </h2>
            <button 
                onclick={() => isEditingUser = !isEditingUser}
                class="mr-42 text-primary text-sm flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full"
            >
                <i class="fa-solid fa-download"></i>
                Exporter les clés
            </button>
            <button 
                onclick={() => isEditingUser = !isEditingUser}
                class="text-primary text-sm flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {isEditingUser ? 'OK' : 'Modifier'}
            </button>
            </div>
            
            <div class="bg-surface p-5 rounded-2xl shadow-lg border border-white/5">
            <!-- Automatic Avatar -->
            <div class="flex justify-center mb-6">
                <img 
                src={userAvatar} 
                alt="Mon Avatar" 
                class="w-24 h-24 rounded-full border-4 border-primary shadow-xl bg-background/50 object-cover"
                />
            </div>

            {#if isEditingUser}
                <div class="space-y-4 animate-in fade-in duration-300">

                <!-- General -->
                <h4 class="text-primary font-bold text-xs uppercase tracking-wider mt-4 mb-2 border-b border-white/10 pb-1">Général</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                    <label class="text-xs text-gray-500 uppercase font-bold">Age</label>
                    <input type="number" bind:value={$userProfile.age} class="w-full bg-background p-2 rounded text-white border border-gray-700 focus:border-primary outline-none mt-1" />
                    </div>
                    <div>
                    <label class="text-xs text-gray-500 uppercase font-bold">Localisation</label>
                    <select bind:value={$userProfile.department} class="w-full bg-background p-2 rounded text-white border border-gray-700 focus:border-primary outline-none mt-1 text-sm">
                        {#each DEPARTMENTS as d}<option value={d}>{d}</option>{/each}
                    </select>
                    </div>
                </div>

                <div>
                    <label class="text-xs text-gray-500 uppercase font-bold">Sexe</label>
                    <div class="flex gap-2 mt-1">
                    {#each GENDER_OPTIONS as g}
                        <button 
                        onclick={() => $userProfile.gender = g}
                        class={`px-3 py-1 rounded-full text-xs ${$userProfile.gender === g ? 'bg-primary text-white' : 'bg-background text-gray-400'}`}
                        >{g}</button>
                    {/each}
                    </div>
                </div>

                <!-- Interests -->
                <h4 class="text-primary font-bold text-xs uppercase tracking-wider mt-4 mb-2 border-b border-white/10 pb-1">Ma vie en 20 mots</h4>
                <div class="space-y-3">
                    <BubbleTags selectedIds={$userProfile.interests} />
                    <div class="flex justify-center">
                        <button
                            onclick={() => {
                                isEditingInterests = true;
                            }}
                            class="px-4 py-2 rounded-full text-sm border border-primary text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                        >
                            Modifier mes passions
                        </button>
                    </div>
                </div>
                </div>
            {:else}
                <!-- View Mode -->
                <div class="text-center space-y-2">
                <h3 class="text-2xl font-bold text-white">{$userProfile.age} ans</h3>
                <div class="text-sm text-gray-400">
                    {$userProfile.department}, {$userProfile.gender}
                </div>
                
                <div class="mt-4">
                    <BubbleTags selectedIds={$userProfile.interests} />
                </div>
                </div>
            {/if}
            </div>
        </section>

        <!-- Bubble Selector Modal -->
        {#if isEditingInterests}
            <BubbleSelector 
                initialSelectedIds={$userProfile.interests}
                onComplete={handleInterestsComplete}
                onBack={() => isEditingInterests = false}
            />
        {/if}

        <!-- Search Profiles Section -->
        <section>
            <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-white">Mes Profils de Recherche</h2>
            <button 
                onclick={handleCreateSearchProfile}
                class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
            </div>

            <div class="space-y-4">
            {#each searchProfiles as sp (sp.id)}
                <div class="bg-surface rounded-2xl shadow-lg border border-white/5 overflow-hidden transition-all">
                {#if editingSearchId === sp.id}
                    <div class="p-4 bg-surface2/50 border-l-4 border-primary">
                    <div class="flex justify-between items-center mb-6">
                        <input 
                        type="text" 
                        bind:value={sp.name}
                        class="bg-transparent border-b border-primary text-white font-bold text-lg outline-none w-2/3"
                        placeholder="Nom du profil..."
                        />
                        <button onclick={() => editingSearchId = null} class="text-primary text-sm font-bold bg-primary/10 px-3 py-1 rounded-full">OK</button>
                    </div>


                    <div class="space-y-6">
                        
                        <h4 class="text-primary font-bold text-xs uppercase tracking-wider mt-4 mb-2 border-b border-white/10 pb-1">Critères de base</h4>
                        <!-- Age -->
                        <div>
                        <RangeSlider 
                            label="age"
                            min={18} max={99} 
                            bind:minValue={sp.minAge} 
                            bind:maxValue={sp.maxAge} 
                        />
                        </div>

                        <!-- Genre -->
                        <div>
                        <label class="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Genre</label>
                        <select bind:value={sp.gender} class="w-full bg-surface p-2 rounded text-white text-sm border border-gray-700">
                            <option value="ANY">Peu importe</option>
                            {#each GENDER_OPTIONS as g}<option value={g}>{g}</option>{/each}
                        </select>
                        </div>

                        <!-- Location -->
                        <div>
                        <label class="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Localisation</label>
                        <div class="text-sm text-gray-400 italic mb-2">Lié au(x) département(s)</div>
                        </div>
                        <hr class="border-white/10" />

                        <!-- Interests -->
                        <div>
                            <label class="text-[10px] text-gray-400 uppercase font-bold mb-1 block">Intérêts</label>
                            <div class="flex flex-wrap gap-2 mb-2">
                                <div class="flex flex-wrap justify-center gap-2">
                                    {#each sp.interests as i}
                                    <span class="text-xs font-bold px-3 py-1 bg-white/20 rounded-full text-white">{i}</span>
                                    {/each}
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    <button 
                        onclick={() => handleDeleteSearchProfile(sp.id)}
                        class="text-red-400 text-xs mt-6 w-full text-center hover:text-red-300"
                    >
                        Supprimer ce profil
                    </button>
                    </div>
                {:else}
                    <!-- Collapsed Search Profile -->
                    <div 
                    onclick={() => editingSearchId = sp.id}
                    onkeydown={() => editingSearchId = sp.id}
                    role="button"
                    tabindex="0"
                    class="p-4 flex items-center justify-between cursor-pointer hover:bg-surface2/30"
                    >
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-surface2 flex items-center justify-center text-primary border border-white/5 overflow-hidden">
                        {#if sp.gender !== 'ANY'}
                            <img 
                            src={generateAvatarUrl(sp.gender, 'Light',  'Brown', sp.id)} 
                            class="w-full h-full object-cover" 
                            alt="avatar"
                            />
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        {/if}
                        </div>
                        <div>
                        <h3 class="text-primary font-bold text-lg">{sp.name}</h3>
                        <div class="text-gray-400 text-xs mt-1">
                            {sp.minAge}-{sp.maxAge} ans • {sp.gender === 'ANY' ? 'Tous' : sp.gender}
                        </div>
                        </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    </div>
                {/if}
                </div>
            {/each}
            </div>
        </section>
    </div>
</div>
    