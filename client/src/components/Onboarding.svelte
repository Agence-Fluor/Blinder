<script lang="ts">
  import { 
    type UserProfile, 
    Gender,
  } from '../types';
  import { 
    DEPARTMENTS, 
    GENDER_OPTIONS, 
  } from '../constants';
  import { 
    HAIR_TYPE_OPTIONS_MALE, 
    HAIR_TYPE_OPTIONS_FEMALE,
    HAIR_COLOR_OPTIONS,
    SKIN_OPTIONS,
  } from '../avatar';

  import BubbleSelector from "./BubbleSelector.svelte";
  import BackButton from "./BackButton.svelte";
  import { AvatarComponent } from 'avataaars-svelte';
  import { userProfile } from '../stores/app';
  import { sleep } from "../utils"
  import { getLoggedOutPhones, setCurrentPhone } from '../services/authService';
  import { navigate } from 'sv-router/generated';
  import { onMount, tick } from 'svelte'; 

  let { 
    profile = $bindable<UserProfile>(), 
    onComplete 
  } = $props();

  let step = $state(0);
  
  // Reset hair style when gender changes
  $effect(() => {
    if (profile.gender && step === 5) {
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
  // avatarUrl is no longer needed - Avatar component generates it directly
  
  let prevNums = $state<string[]>([]);
  
  // Load logged out phones on mount
  onMount(async () => {
    prevNums = getLoggedOutPhones();
    nextStep()
    await tick()
    nextStep()
    await tick()
    nextStep()
    await tick()
    nextStep()
    await tick()
    nextStep()
  });

  // Handle password login
  async function handlePasswordLogin() {
    if (!phoneNumber || !passwordInput || verifyingPassword) return;
    verifyingPassword = true;
    passwordError = '';
    
    try {
      if (verifyPassword(phoneNumber, passwordInput)) {
        // Password correct, proceed to chat
        setCurrentPhone(phoneNumber);
        navigate('/chat');
      } else {
        passwordError = 'Mot de passe incorrect';
      }
    } catch (error) {
      passwordError = error instanceof Error ? error.message : 'Erreur lors de la vérification';
      console.error('Error verifying password:', error);
    } finally {
      verifyingPassword = false;
    }
  }

  async function nextStep() {
    if (step === 1) {
      // When moving from phone input to OTP, send OTP
      if (phoneNumber && !sendingOtp) {
        sendingOtp = true;
        otpError = '';
        phoneAlreadyRegistered = false; // Reset when trying again
        try {
          // Check if phone number already exists
          const isRegistered = await checkPhoneRegistered(phoneNumber);
          
          if (isRegistered) {
            // Phone number exists, show warning but stay on same step
            phoneAlreadyRegistered = true;
            sendingOtp = false;
            return;
          }
          
          // Phone doesn't exist, proceed with normal onboarding
          const response = await sendOtp(phoneNumber);
          if (response.success) {
            step++;
          } else {
            otpError = response.message;
          }
        } catch (error) {
          otpError = error instanceof Error ? error.message : 'Failed to send OTP';
          console.error('Error sending OTP:', error);
        } finally {
          sendingOtp = false;
        }
      } else {
        step++;
      }
    } else if (step === 2) {

      passwordConfirm = ''
      passwordInput = ''

      // When moving from OTP input, verify OTP first
      if (otpCode && otpCode.length === 6 && !verifyingOtp) {
        verifyingOtp = true;
        otpError = '';
        try {
          const response = await verifyOtp(phoneNumber, otpCode);
          if (response.success) {
            step++;
          } else {
            otpError = response.message;
          }
        } catch (error) {
          otpError = error instanceof Error ? error.message : 'Failed to verify OTP';
          console.error('Error verifying OTP:', error);
        } finally {
          verifyingOtp = false;
        }
      }
    } else if (step === 3) {
      // When moving from password creation, validate and save password
      if (!passwordInput || passwordInput.length < 6) {
        passwordError = 'Le mot de passe doit contenir au moins 6 caractères';
        return;
      }
      if (passwordInput !== passwordConfirm) {
        passwordError = 'Les mots de passe ne correspondent pas';
        return;
      }
      
      savingPassword = true;
      passwordError = '';
      // Save password locally
      savePassword(phoneNumber, passwordInput);
      
      // Generate device ID (simple UUID)
      const deviceIdValue = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Register device
      const result = await registerFirstDevice(phoneNumber, deviceIdValue);
      
      // Save profile to IndexedDB with phone number
      await saveProfile(profile, phoneNumber);
      
      step++;
    }
      
        
    // Start key generation when moving to step 4
    if (step === 4) {
      generatingKeys = true;
      keyGenError = '';
      keyGenProgress = 'Génération des clés en cours...';
      keyGenProgressPercent = 0;
      
      
      console.log('[Onboarding] Starting key generation...');
      
      // Create worker at last moment
      let worker: Worker | null = null;
      const workerStartTime = performance.now();
      
      try {
        console.log('[Onboarding] Creating worker...');
        worker = new KeyGenWorker();
        const workerEndTime = performance.now();
        console.log(`[Onboarding] Worker created in ${(workerEndTime - workerStartTime).toFixed(2)}ms`);
      } catch (error) {
        console.error('[Onboarding] Failed to create worker:', error);
        keyGenError = 'Impossible de créer le worker';
        generatingKeys = false;
        return;
      }
      
      // Set up worker message handler
      worker.onmessage = (event) => {
        console.log('[Onboarding] Received worker message:', event.data);
        if (event.data && event.data.type === 'keys') {
          // Store keys in localStorage using keyStorage service
          console.log('[Onboarding] Received keys from worker, storing in localStorage...');
          storeKeys(event.data);
          console.log('[Onboarding] Keys stored successfully');
          
          // Stop progress simulation
          if (progressInterval !== null) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          
          // Move to next step
          keyGenProgress = 'Clés générées et stockées avec succès!';
          keyGenProgressPercent = 100;
          generatingKeys = false;
          worker.terminate();
          
          step += 1;

        } else if (event.data && event.data.type === 'error') {
          console.error('[Onboarding] Worker reported error:', event.data.error);
          keyGenError = event.data.error;
          generatingKeys = false;
          if (progressInterval !== null) {
            clearInterval(progressInterval);
            progressInterval = null;
          }
          if (worker) {
            worker.terminate();
          }
        }
      };
      
      worker.onerror = (error) => {
        console.error('[Onboarding] Worker error:', error);
        console.error('[Onboarding] Error details:', error.message, error.filename, error.lineno);
        keyGenError = 'Erreur lors de la génération des clés';
        generatingKeys = false;
        if (progressInterval !== null) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
      };

      console.log('[Onboarding] Worker created');
      console.log('[Onboarding] Worker:', worker);

      // Start key generation worker
      console.log('[Onboarding] Posting start message to worker...');
      worker.postMessage({
        type: 'start',
        userPassword: passwordInput,
      });
      console.log('[Onboarding] Start message posted');

      
      // Start progress simulation in parallel (on main thread)
      // Calculate total estimated time and divide equally among steps
      const totalEstimatedTimeMs = 7000; // 5 seconds
      const tickMs = 25;

      const KEY_GEN_STEP_NAMES = [
        "Génération des clés de chiffrement..."
      // "1815 : Naiscance d'Ada Lovalace, première codeuse de l'histoire.",
      // "1801 : J. M. Jacquard invente la CAO et s'imprime un Pull.",
      // "1767 : Le premier automate Jaquet-Droz respire et joue de l'orgue.",
      ];

      const numberOfSteps = KEY_GEN_STEP_NAMES.length;
      const timePerStepMs = totalEstimatedTimeMs / numberOfSteps;

      let totalElapsedTimeMs = 0;
      let currentStepIndex = 0;

      progressInterval = setInterval(() => {
        if (totalElapsedTimeMs >= totalEstimatedTimeMs) {
          keyGenProgressPercent = 100;
          keyGenProgress = KEY_GEN_STEP_NAMES[numberOfSteps - 1];
          clearInterval(progressInterval);
          progressInterval = null;
          return;
        }

        // Update step
        currentStepIndex = Math.min(
          Math.floor(totalElapsedTimeMs / timePerStepMs),
          numberOfSteps - 1
        );

        keyGenProgress = KEY_GEN_STEP_NAMES[currentStepIndex];

        // Linear progress
        const progress =
          (totalElapsedTimeMs / totalEstimatedTimeMs) * 100;
        keyGenProgressPercent = Math.min(Math.round(progress), 92);

        totalElapsedTimeMs += tickMs;
      }, tickMs) as unknown as number; 
    } else {
      step++;
    }
  }

  function prevStep() {
    if (step > 0) {
      step--;
    }
  }

  let stepsCount = 6;///$state(3);



  const containerClass = "flex flex-col items-center min-h-screen bg-background p-6 animate-in fade-in duration-500 fixed inset-0 z-50 overflow-y-auto";
  const titleClass = "text-2xl font-bold text-primary mb-2";
  const subtitleClass = "text-gray-400 text-sm mb-8 text-center max-w-m";


  import BlinderLogo from './BlinderLogo.svelte';
  import PhoneInput from './PhoneInput.svelte';
  import SmsCodeInput from './SmsCodeInput.svelte';
  import { sendOtp, verifyOtp } from '../services/onboardingApi';
  import { checkPhoneRegistered } from '../services/contactsOSService';
  import { registerFirstDevice } from '../services/deviceService';
  import { saveProfile } from '../services/indexedDbService';
  import { savePassword, verifyPassword, hasPassword } from '../services/passwordService';
  import KeyGenWorker from '../workers/keyGen.worker.ts?worker';
  import { storeKeys } from '../services/keyStorage';

  let phoneInputDone = $state(false);
  let phoneNumber = $state('');
  let otpCode = $state('');
  let otpInputDone = $state(false);
  let sendingOtp = $state(false);
  let verifyingOtp = $state(false);
  let otpError = $state('');
  let phoneAlreadyRegistered = $state(false);
  
  // Reset phoneAlreadyRegistered when phoneNumber changes
  $effect(() => {
    if (phoneNumber) {
      phoneAlreadyRegistered = false;
    }
  });


  // Password states
  let passwordInput = $state('');
  let passwordConfirm = $state('');
  let passwordError = $state('');
  let verifyingPassword = $state(false);
  let savingPassword = $state(false);

  // Key generation states
  let keyGenProgress = $state('Génération des clés en cours...');
  let keyGenProgressPercent = $state(0);
  let keyGenError = $state('');
  let generatingKeys = $state(false);
  let progressInterval: number | null = $state(null);
</script>


<!--div class="fixed inset-0 bg-background z-50 flex flex-col animate-in slide-in-from-right duration-300"-->

<div  class={containerClass}>
  <!-- Progress Bar (Fixed) -->
  {#if step != 0}
    <!--div class="fixed top-0 left-0 right-0 z-[110] p-6 pt-4 backdrop-blur-2xl bg-background/80 border-b border-white/10"-->

    <div class="fixed top-0 left-0 right-0 z-[110] p-6 pt-4 backdrop-blur-5 fadebar">
      <div class="w-full h-1 bg-gray-800 rounded-full">
        <div class="h-full bg-primary rounded-full transition-all duration-300" style="width: {(step / stepsCount) * 100}%"></div>
      </div>
    </div>
  {/if}  
  {#if step !== 0}
    <BackButton onClick={prevStep} />
  {/if}

  <div class="flex flex-col items-center w-full flex-1 {step === 5 ? 'pt-20' : 'justify-center'}">
      <!--div class="w-20 h-10 bg-secondary rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(209,107,134,0.4)]">
      </div-->
      
 
      <div class="h-30">
        <BlinderLogo animate={step === 4}/>
      </div>

      {#if step === 0}

        <h1 class="text-3xl font-bold text-white mb-2">Blinder</h1>
        <p class="text-gray-400 text-center mb-12">L'amour rend aveugle, pas vos données.</p>

      {:else if step == -1}
        <!-- Login Screen with Password -->
        <div class="flex flex-col items-center text-center">
          <h2 class={titleClass}>Se connecter</h2>
          <p class={subtitleClass}>Entrez votre numéro de téléphone et votre mot de passe</p>
          
          <div class="w-full max-w-sm mt-6 space-y-4">
            <div>
              <PhoneInput bind:inputDone={phoneInputDone} bind:phoneNumber={phoneNumber} />
            </div>
            
            <div>
              <label class="block text-gray-400 text-sm mb-2">Mot de passe</label>
              <input
                type="password"
                bind:value={passwordInput}
                placeholder="Entrez votre mot de passe"
                class="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-surface text-white"
              />
            </div>
          </div>
          
          {#if passwordError}
            <p class="mt-4 text-red-500 text-sm">{passwordError}</p>
          {/if}
          
          <button 
            onclick={handlePasswordLogin}
            disabled={!phoneInputDone || !passwordInput || verifyingPassword}
            class="mt-6 bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifyingPassword ? 'Connexion...' : 'Se connecter'}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

    
        {:else if step === 1}

          <div class="flex flex-col text-center">
            {#if phoneAlreadyRegistered}
              <div class="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg max-w-md mx-auto">
                <p class="text-yellow-400 text-sm mb-3">
                  <strong>Attention:</strong> Un compte existe déjà avec ce numéro de téléphone. Si vous souhaitez vous connecter, cliquer sur retour. Si vous souhaitez recréer votre compte, vous pouvez utiliser cette option, vous perdrez alors toutes vos données (messages, clés, etc.). 
                  Seuls vos contacts seront conservés (mais anonymisés). Vos contacts recevront une notification indiquant que vous avez renouvelé vos clés d'identité.
                </p>
              </div>
            {/if}
            
            <div class="w-full max-w-sm {phoneAlreadyRegistered ? 'mx-auto' : ''}">
              <PhoneInput bind:inputDone={phoneInputDone} bind:phoneNumber={phoneNumber} />
            </div>

            {#if !phoneAlreadyRegistered}
              <!--input
                type="text"
                id="phone"
                value="+33 (0)"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
              -->
                <br/><br/>
      <i class="mt-4 text-white">On est juste en France pour l'instant.</i>
            {/if}
          
          </div>

        {:else if step === 2}

          <div class="flex flex-col text-center">

            <p>Nous venons de vous envoyer un code par SMS au {phoneNumber}, merci de le saisir.</p>
            <div class="mt-4"></div>

            <SmsCodeInput bind:inputDone={otpInputDone} bind:codeValue={otpCode} />

            {#if otpError}
              <p class="mt-4 text-red-500 text-sm">{otpError}</p>
            {/if}

            <i class="mt-4">Si vous n'avez rien reçu après quelques minutes, <a href="#" class="text-primary" onclick={(e) => { e.preventDefault(); if (phoneNumber) sendOtp(phoneNumber); }}>cliquez-ici</a> pour le renvoyer.</i>

          </div>


        {:else if step === 3}
          <div class="flex flex-col items-center text-center">
            <h2 class={titleClass}>Créer votre mot de passe</h2>
            <p class={subtitleClass}>Choisissez un mot de passe pour sécuriser votre compte. Il sera stocké localement sur cet appareil.</p>
            
            <input
              type="tel"
              name="phone"
              value={phoneNumber}
              autocomplete="username"
              hidden
            />

            <div class="w-full max-w-sm mt-6 space-y-4">
              <div>
                <label class="block text-gray-400 text-sm mb-2">Mot de passe</label>
                <input
                  type="password"
                  name="password"
                  autocomplete="new-password"
                  bind:value={passwordInput}
                  placeholder="Entrez votre mot de passe"
                  class="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-surface text-white"
                />
              </div>
              
              <div>
                <label class="block text-gray-400 text-sm mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  name="password"
                  autocomplete="new-password"
                  bind:value={passwordConfirm}
                  placeholder="Confirmez votre mot de passe"
                  class="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-surface text-white"
                />
              </div>
            </div>
            
            {#if passwordError}
              <p class="mt-4 text-red-500 text-sm">{passwordError}</p>
            {/if}
          </div>

        {:else if step === 4}

          <div class="mt-5 h-1 bg-gray-800 rounded-full" style="width: 250px; ">
            <div class="h-full bg-primary rounded-full transition-all duration-300" style="width: {keyGenProgressPercent}%"></div>
          </div>
          <small class="mt-4 text-center">
            {keyGenProgress}
          </small>
          <small class="mt-2 text-gray-500 text-xs text-center">
            <!--{Math.round(keyGenProgressPercent)}%-->
          </small>
          {#if keyGenError}
            <!--<p class="mt-4 text-red-500 text-sm text-center max-w-sm">{keyGenError}</p>-->
          {/if}

          <!--
       {:else if step === 5}
            <div class="flex flex-col items-center">
              <h2 class={titleClass}>Exportez vos clés</h2>
              <p class={subtitleClass}>Blinder est une application chiffrée de bout-en-bout.</p>
              <p>Nos serveurs n'ont pas accès à vos données. Vous pouvez exporter vos clés ailleurs au cas ou perderiez votre appareil.</p>

              <br/>
              <br/>
              <button class="mt-12 bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2">
                Exporter mes clés
              </button>
            </div>-->
        {:else if step == 5}
          <div class="flex flex-col items-center w-full max-w-md pb-12">
            <h2 class={titleClass}>Qui êtes-vous ?</h2>
            <p class={subtitleClass}>Commençons par les bases pour créer votre profil anonyme.</p>
            
            <div class="w-full space-y-6 mt-4">

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

              <!-- Avatar Preview -->
              <div class="flex flex-col items-center">
                <label class="block text-gray-500 text-xs font-bold uppercase mb-2">Avatar</label>
                <div class="w-32 h-32 rounded-full overflow-hidden border-2 border-primary mb-4">
                  <AvatarComponent
                    avatarStyle="Circle"
                    topType={profile.avatarHair || (profile.gender === Gender.MALE ? HAIR_TYPE_OPTIONS_MALE[0].value : HAIR_TYPE_OPTIONS_FEMALE[0].value)}
                    accessoriesType={profile.avatarAccessories || 'Blank'}
                    hairColor={profile.avatarHairColor || 'BrownDark'}
                    facialHairType="Blank"
                    facialHairColor=""
                    clotheType="ShirtCrewNeck"
                    clotheColor="Blue03"
                    graphicType=""
                    eyeType={profile.avatarEyes || 'Default'}
                    eyebrowType="Default"
                    mouthType="Smile"
                    skinColor={profile.avatarSkin || 'Light'}
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


                  <!-- Eye Type --
                  <div>
                    <label class="block text-gray-500 text-xs font-bold uppercase mb-2">Type d'yeux</label>
                    <div class="grid grid-cols-3 gap-2">
                      {#each EYE_TYPE_OPTIONS as eye}
                        <button 
                          onclick={() => profile.avatarEyes = eye.value}
                          class={`py-2 rounded-lg border text-sm ${profile.avatarEyes === eye.value ? 'border-primary bg-primary/20 text-primary' : 'border-gray-700 text-gray-400'}`}
                        >
                          {eye.label}
                        </button>
                      {/each}
                    </div>
                  </div>

                  !-- Eye Color --
                  <div>
                    <label class="block text-gray-500 text-xs font-bold uppercase mb-2">Couleur des yeux</label>
                    <div class="grid grid-cols-2 gap-2">
                      {#each EYE_COLOR_OPTIONS as color}
                        <button 
                          onclick={() => profile.avatarEyeColor = color.value}
                          class={`py-2 rounded-lg border text-sm ${profile.avatarEyeColor === color.value ? 'border-primary bg-primary/20 text-primary' : 'border-gray-700 text-gray-400'}`}
                        >
                          {color.label}
                        </button>
                      {/each}
                    </div>
                  </div>
                --
                  !-- Accessories (Glasses) --
                  <div>
                    <label class="block text-gray-500 text-xs font-bold uppercase mb-2">Lunettes</label>
                    <div class="grid grid-cols-3 gap-2">
                      {#each ACCESSORIES_OPTIONS as acc}
                        <button 
                          onclick={() => profile.avatarAccessories = acc.value}
                          class={`py-2 rounded-lg border text-sm ${profile.avatarAccessories === acc.value ? 'border-primary bg-primary/20 text-primary' : 'border-gray-700 text-gray-400'}`}
                        >
                          {acc.label}
                        </button>
                      {/each}
                    </div>
                  </div>
                  -->
                </div>
              </div>
            </div>
          </div>
        <!-- Step 4: Interests -->
        {:else if step === 6}
          <BubbleSelector 
            onComplete={(ids) => {
              $userProfile.interests = ids


              setCurrentPhone(phoneNumber);
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


        {#if step === 1 && phoneAlreadyRegistered}
          <!-- Separate button for already registered phone -->
          <button 
            onclick={async () => {
              if (!phoneNumber || sendingOtp) return;
              sendingOtp = true;
              otpError = '';
              try {
                const response = await sendOtp(phoneNumber);
                if (response.success) {
                  // Move to OTP verification step (step 2)
                  step = 2;
                } else {
                  otpError = response.message;
                }
              } catch (error) {
                otpError = error instanceof Error ? error.message : 'Erreur lors de l\'envoi du code';
                console.error('Error sending OTP:', error);
              } finally {
                sendingOtp = false;
              }
            }}
            disabled={!phoneInputDone || sendingOtp}
            class="mt-6 bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingOtp ? 'Envoi en cours...' : 'Recevoir le code SMS'}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {#if otpError}
            <p class="mt-4 text-red-500 text-sm">{otpError}</p>
          {/if}
        {:else if 
          step != -1
          && step != 4
        }
        <button 
          type="submit"
          onclick={async () => { 
            await nextStep(); 
          }} 
          disabled={( step == -1 && (!phoneInputDone || !passwordInput)) || (step == 1 && !phoneInputDone) || (step === 2 && (!otpInputDone || otpCode.length !== 6)) || (step === 3 && (!passwordInput || passwordInput !== passwordConfirm || passwordInput.length < 6))}
          class="mt-6 bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {#if step == 0}
              {#if prevNums.length}
                Créer un nouveau compte
              {:else}
                Commencer l'expérience
              {/if}
            {:else if step === 1}
              {sendingOtp ? 'Envoi en cours...' : 'Continuer'}
            {:else if step === 2}
              {verifyingOtp ? 'Vérification...' : 'Continuer'}
            {:else if step === 3}
              {savingPassword ? 'Enregistrement...' : 'Continuer'}
            {:else}
              Continuer
            {/if}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {/if}

        {#if step == 0}

        {#each prevNums as num}
          <button onclick={() => {setCurrentPhone(num); navigate('/chat');}} class="mt-8 bg-secondary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2">
            Se reconnecter avec le {num}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        {/each}

        <button onclick={() => {step = -1; phoneNumber = ''; passwordInput = ''; phoneInputDone = false;}} class="mt-8 bg-secondary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2">
          Se connecter {#if prevNums.length}avec un autre numéro{/if}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

      {/if}
  </div>

</div>