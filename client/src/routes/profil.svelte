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
  import { AvatarComponent } from 'avataaars-svelte';

  
  import RangeSlider from '../components/RangeSlider.svelte';
  import BubbleSelector from '../components/BubbleSelector.svelte';
  import BubbleTags from '../components/BubbleTags.svelte';
  import AvatarEditor from '../components/AvatarEditor.svelte';

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
  let showAvatarEditor = $state(false);
  let showPhotoUpload = $state(false);

  function handleInterestsComplete(ids: string[]) {
    isEditingInterests = false;
    $userProfile.interests = ids
  }

  // Derived / reactive
  let activeSession: ChatSession | undefined = $state(undefined);
  // userAvatar is no longer needed - Avatar component generates it directly

  $effect(() => {
	activeSession = sessions.find(s => s.matchId === activeChatId);
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
  import { navigate } from 'sv-router/generated';
  import Popup from '../components/Popup.svelte';
  import QRCodeScanner from '../components/QRCodeScanner.svelte';
  import { generateProfileShareQRCode, parseProfileShareQRCode } from '../services/profileShareService';
  import { handleIRLMeeting } from '../services/irlMeetingService';
  import { getContact, saveContact } from '../services/contactsService';
  import { sessions as sessionsStore } from '../stores/app';
  import { get } from 'svelte/store';
  import { getMessagingPublicKey } from '../services/keyStorage';

  let showQR = $state(false);
  let qrMode = $state<'display' | 'scan'>('display');
  let profileShareQR = $state('');

  // Reset QR when closing
  $effect(() => {
    if (!showQR) {
      profileShareQR = '';
    }
  });
// --- ICONS (Inline for simplicity) ---
</script>

<Popup bind:open={showQR}>
  {#if qrMode === 'display'}
    <div class="p-4 bg-surface rounded-lg shadow-xl text-center">
      <h3 class="text-xl font-bold text-white mb-4">Partager mon profil</h3>
      <p class="text-gray-400 mb-6">Scannez ce QR code pour ajouter un ami ou transformer un contact.</p>
      {#if profileShareQR}
        <div class="p-4 bg-white rounded-lg mb-4">
          {@html profileShareQR}
        </div>
      {:else}
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      {/if}
      <div class="mt-4 flex gap-2 justify-center">
        <button 
          onclick={() => { qrMode = 'scan'; }}
          class="bg-primary text-white px-4 py-2 rounded-lg"
        >
          Scanner un QR code
        </button>
        <button 
          onclick={() => showQR = false} 
          class="bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          Fermer
        </button>
      </div>
    </div>
  {:else}
    <div class="p-4 bg-surface rounded-lg shadow-xl text-center">
      <h3 class="text-xl font-bold text-white mb-4">Scanner un QR code</h3>
      <p class="text-gray-400 mb-6">Scannez le QR code d'un contact pour l'ajouter ou le transformer.</p>
      <QRCodeScanner 
        onScan={async (qrData: string) => {
          try {
            const data = parseProfileShareQRCode(qrData);
            if (!data) {
              alert('QR code invalide');
              return;
            }

            // Check if contact already exists
            const existingContact = await getContact(data.phone);
            const currentSessions = get(sessionsStore);
            const existingSession = currentSessions.find(s => s.matchId === data.phone);

            if (existingContact || existingSession) {
              // Transform existing contact/match to real contact
              await handleIRLMeeting(qrData);
              alert(`Contact ${data.displayName || data.phone} transformé en contact réel !`);
            } else {
              // Add new contact
              await saveContact({
                phone: data.phone,
                displayName: data.displayName || data.phone,
                originalName: data.displayName,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
              alert(`Contact ${data.displayName || data.phone} ajouté !`);
            }
            
            showQR = false;
            qrMode = 'display';
          } catch (error) {
            console.error('Error handling QR scan:', error);
            alert('Erreur lors du traitement du QR code');
          }
        }}
        onError={(error) => {
          console.error('QR scan error:', error);
          alert('Erreur lors du scan du QR code');
        }}
      />
      <div class="mt-4 flex gap-2 justify-center">
        <button 
          onclick={() => { qrMode = 'display'; }}
          class="bg-primary text-white px-4 py-2 rounded-lg"
        >
          Afficher mon QR code
        </button>
        <button 
          onclick={() => { showQR = false; qrMode = 'display'; }} 
          class="bg-gray-700 text-white px-4 py-2 rounded-lg"
        >
          Annuler
        </button>
      </div>
    </div>
  {/if}
</Popup>

<!-- Generate QR code when displaying -->
{#if showQR && qrMode === 'display'}
  {#await (async () => {
    try {
      const phone = ($userProfile as any)?.phone || '';
      const msgPk = await getMessagingPublicKey();
      const { qrSvg } = await generateProfileShareQRCode(phone, msgPk, ($userProfile as any)?.name);
      profileShareQR = qrSvg;
    } catch (error) {
      console.error('Error generating profile share QR:', error);
      profileShareQR = 'Error generating QR code.';
    }
  })()}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
  {/await}
{/if}

<div class="pt-10 pb-24 px-4 min-h-screen">
    <!-- PROFILE TAB -->
    <div class="space-y-4">
        
        <!-- User Profile Card -->
        <section>
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold text-white">
                    Mon Profil Anonyme
                    <div class="flex items-center gap-2">
                        <button 
                            class="text-primary text-sm hover:text-primary/80 transition" 
                            onclick={() => { qrMode = 'display'; showQR = true; }}
                            title="Partager mon profil"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                        </button>
                        <button 
                            class="text-primary text-sm hover:text-primary/80 transition" 
                            onclick={() => { qrMode = 'scan'; showQR = true; }}
                            title="Scanner un QR code"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </button>
                    </div>
                </h2>
            
            </div>
            
            <div class="bg-surface p-5 rounded-2xl shadow-lg border border-white/5">
            <!-- Avatar Display: Two circles (cartoon + real photo) -->
            <div class="flex justify-center mb-6 gap-4">
                <!-- Cartoon Avatar -->
                <div class="relative cursor-pointer" onclick={() => showAvatarEditor = true}>
                    <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-xl">
                      <AvatarComponent
                        avatarStyle="Circle"
                        topType={$userProfile.avatarHair || 'ShortHairShortFlat'}
                        accessoriesType={$userProfile.avatarAccessories || 'Blank'}
                        hairColor={$userProfile.avatarHairColor || 'BrownDark'}
                        facialHairType="Blank"
                        facialHairColor=""
                        clotheType="ShirtCrewNeck"
                        clotheColor="Blue03"
                        graphicType=""
                        eyeType={$userProfile.avatarEyes || 'Default'}
                        eyebrowType="Default"
                        mouthType="Smile"
                        skinColor={$userProfile.avatarSkin || 'Light'}
                        style="width: 100%; height: 100%;"
                      />
                    </div>
                    <div class="absolute -bottom-1 -right-1 bg-primary text-white text-xs px-2 py-0.5 rounded-full border-2 border-background">
                        Virtuel
                    </div>
                </div>
                
                <!-- Real Photo (if available) -->
                <div class="relative cursor-pointer" onclick={() => showPhotoUpload = true}>
                    {#if ($userProfile as any).realPhotoUrl}
                        <img 
                        src={($userProfile as any).realPhotoUrl} 
                        alt="Photo réelle" 
                        class="w-24 h-24 rounded-full border-4 border-green-500 shadow-xl bg-background/50 object-cover"
                        />
                    {:else}
                        <div class="w-24 h-24 rounded-full border-4 border-gray-600 shadow-xl bg-background/50 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    {/if}
                    <div class="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full border-2 border-background">
                        Réel
                    </div>
                </div>
            </div>

            {#if isEditingUser}
                <div class="space-y-4 animate-in fade-in duration-300">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-primary font-bold text-xs uppercase tracking-wider border-b border-white/10 pb-1">Général</h4>
                        <button 
                            onclick={() => isEditingUser = false}
                            class="text-primary text-sm flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full hover:bg-primary/20 transition"
                        >
                            OK
                        </button>
                    </div>
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
                    <div class="flex items-center justify-center gap-2">
                        <h3 class="text-2xl font-bold text-white">{$userProfile.age} ans</h3>
                        <button 
                            onclick={() => isEditingUser = !isEditingUser}
                            class="text-primary hover:text-primary/80 transition"
                            title="Modifier le profil"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                    </div>
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
                        <div class="w-10 h-10 rounded-full bg-surface2 flex items-center justify-center text-primary border border-white/5 overflow-hidden relative">
                        {#if sp.gender === Gender.MALE}
                            <!-- Male icon -->
                            <i class="fas fa-mars text-lg"></i>
                        {:else if sp.gender === Gender.FEMALE}
                            <!-- Female icon -->
                            <i class="fas fa-venus text-lg"></i>
                        {:else}
                            <!-- Any/Unknown icon - superposed mars and venus -->
                            <span class="relative inline-block">
                                <i class="fas fa-venus text-lg"></i>
                                <i class="fas fa-mars text-xs absolute -top-1 -right-1 opacity-90"></i>
                            </span>
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


        <!-- Settings Footer -->
        <section class="mt-8 pb-8">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-semibold text-white">Paramètres</h2>
            </div>
            
            <!-- Settings Buttons -->
            <div class="space-y-3 flex flex-col items-center">
                <button
                    onclick={() => navigate('/autorisations')}
                    class="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-between gap-4"
                >
                    <span>Autorisations</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
                
                <button
                    onclick={() => navigate('/abonnement')}
                    class="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-between gap-4"
                >
                    <span>Abonnement</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
                
                <button
                    onclick={() => navigate('/securite')}
                    class="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-between gap-4"
                >
                    <span>Sécurité</span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </section>
    </div>
</div>

<!-- Avatar Editor Modal -->
{#if showAvatarEditor}
    <AvatarEditor 
        bind:profile={$userProfile} 
        onClose={() => showAvatarEditor = false} 
    />
{/if}

<!-- Photo Upload Modal -->
{#if showPhotoUpload}
    <div class="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4">
        <div class="bg-surface rounded-2xl p-6 max-w-md w-full">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-primary">Uploader une photo réelle</h2>
                <button
                    onclick={() => showPhotoUpload = false}
                    class="text-gray-400 hover:text-white transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div class="mb-6">
                <input
                    type="file"
                    accept="image/*"
                    id="photoUpload"
                    class="hidden"
                    onchange={(e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                            // TODO: Upload to backend
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const result = event.target?.result as string;
                                // For now, just store locally
                                ($userProfile as any).realPhotoUrl = result;
                                showPhotoUpload = false;
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                />
                <label
                    for="photoUpload"
                    class="block w-full bg-primary text-white px-6 py-3 rounded-xl font-bold text-center cursor-pointer hover:bg-primary/90 transition"
                >
                    <i class="fas fa-upload mr-2"></i>
                    Choisir une photo
                </label>
            </div>
            
            <button
                onclick={() => showPhotoUpload = false}
                class="w-full bg-gray-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-600 transition"
            >
                Annuler
            </button>
        </div>
    </div>
{/if}
    