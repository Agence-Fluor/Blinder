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
  import { userProfile } from '../stores/app';
  import { BUBBLE_DATA } from '../bubble_data';



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
    if (step == -1) {
      // todo: handle login
    } else {
      step++;
    }
  }

  function prevStep() {
    if (step == -1) {
     // si on etait sur page login -> retour au menu principal
     step = 0;
    } else {
      step--;
    }
  }

  let stepsCount = 6;///$state(3);



  const containerClass = "flex flex-col items-center justify-center min-h-screen bg-background p-6 animate-in fade-in duration-500 absolute inset-0 z-50";
  const titleClass = "text-2xl font-bold text-primary mb-2";
  const subtitleClass = "text-gray-400 text-sm mb-8 text-center max-w-m";


  import BlinderLogo from './BlinderLogo.svelte';
  import PhoneInput from './PhoneInput.svelte';
  import SmsCodeInput from './SmsCodeInput.svelte';

  let phoneInputDone = $state(false)
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


      <!--div class="w-20 h-10 bg-secondary rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(209,107,134,0.4)]">
      </div-->
      
 
      <div class="h-30">
        <BlinderLogo animate={step === 4}/>
      </div>

      {#if step === 0}

        <h1 class="text-3xl font-bold text-white mb-2">Blinder</h1>
        <p class="text-gray-400 text-center mb-12">L'amour rend aveugle, pas vos données.</p>

      {:else if step == -1}

          <div class="flex flex-col text-center">
            <PhoneInput bind:inputDone={phoneInputDone} show_only_france_label={false}/>
          </div>
          <label class="mt-4 font-semibold text-white" for="mot-de-passe">Mot de passe</label>
          <input
            type="password"
            name="mot-de-passe"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
          />

    
        {:else if step === 1}

          <div class="flex flex-col text-center">
            <PhoneInput bind:inputDone={phoneInputDone} />

            <!--input
              type="text"
              id="phone"
              value="+33 (0)"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
            -->
          
          
          </div>

        {:else if step === 2}

          <div class="flex flex-col text-center">

            <p>Nous venons de vous envoyer un code par SMS au +33 xx xx xx xx xx, merci de le saisir.</p>

            <label class="mt-2 font-semibold text-white" for="code">Code de confirmation</label>
            <SmsCodeInput />

            <i class="mt-4">Si vous n'avez rien reçu après quelques minutes, <a href="#" class="text-primary">cliquez-ici</a> pour le renvoyer.</i>

          </div>


        {:else if step === 3}
        <label class="font-semibold text-white" for="mot-de-passe">Mot de passe</label>
          <input
            type="password"
            name="mot-de-passe"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
          />

          <label class="mt-4 font-semibold text-white" for="mot-de-passe">Confirmation du mot de passe</label>
          <input
            type="password"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
          />

        {:else if step === 4}

          <div class="mt-5 h-1 bg-gray-800 rounded-full" style="width: 250px; ">
            <div class="h-full bg-primary rounded-full transition-all duration-300" style="width: {(1/3) * 100}%"></div>
          </div>
          <small class="mt-4">Génération des clés en cours...</small>

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
        {:else if step === 6}
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


        {#if 
          (step != 1) || phoneInputDone
        }
        <button onclick={async () => { 
          nextStep(); 
        }} class="mt-6 bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2">
            {#if step == 0}
              Commencer l'expérience
            {:else}
              Continuer
            {/if}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {/if}

        {#if step == 0}
        <button onclick={() => {step = -1}} class="mt-8 bg-secondary text-white px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-2">
          Se connecter
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {/if}


</div>