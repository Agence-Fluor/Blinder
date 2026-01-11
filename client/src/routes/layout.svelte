<script lang="ts">
  import { p, isActive, navigate } from 'sv-router/generated'
  import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

</script>

<div class="min-h-screen bg-background text-gray-100 font-sans selection:bg-primary selection:text-white">
  {@render children()}
</div>

{#if !isActive("/onboarding")}

  <div class="h-16">
  </div>

  <div class="fixed bottom-0 left-0 right-0 h-16 border-t border-white/5 flex justify-around items-center z-20 backdrop-blur-md bg-background/95">
    <button 
      onclick={() => navigate('/chat')} 
      class="flex flex-col items-center justify-center w-full h-full {isActive('/chat') ? 'text-primary' : 'text-gray-500'}"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span class="text-[10px] mt-1 font-medium">Messages</span>
    </button>
    <button 
      onclick={() => navigate('/appels')}
      class="flex flex-col items-center justify-center w-full h-full {isActive('/appels') ? 'text-primary' : 'text-gray-500'}"
      title="Appels"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
      <span class="text-[10px] mt-1 font-medium">Appels</span>
    </button>
    <button 
      onclick={() => navigate('/contacts')}
      class="flex flex-col items-center justify-center w-full h-full {isActive('/contacts') ? 'text-primary' : 'text-gray-500'}"
      title="Contacts"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span class="text-[10px] mt-1 font-medium">Contacts</span>
    </button>
    <button 
      onclick={() => navigate('/profil')}
      class="flex flex-col items-center justify-center w-full h-full {isActive('/profil') ? 'text-primary' : 'text-gray-500'}"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span class="text-[10px] mt-1 font-medium">Profil</span>
    </button>
  </div>

{/if}