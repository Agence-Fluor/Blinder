<script lang="ts">
  import { p, isActive, navigate } from 'sv-router/generated'
  import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

</script>


<div class="min-h-screen bg-background text-gray-100 font-sans selection:bg-primary selection:text-white pb-safe">
{@render children()}
</div>

{#if !isActive("/onboarding")}

  <div class="h-16">
  </div>


  <div class="fixed bottom-0 left-0 right-0 h-16 border-t border-white/5 flex justify-around items-center z-20 pb-safe  backdrop-blur-md">
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