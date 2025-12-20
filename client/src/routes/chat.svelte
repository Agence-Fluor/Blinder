<script lang="ts">
  import { onMount } from 'svelte';
  import type { ChatSession, Message } from '../types';

  // stores & actions (your centralized rune-enabled stores)
  import {
    sessions,
    activeChatId,
    activeSession,
    userAvatar,
    refreshMatches,
    handleSendMessage
  } from '../stores/app';

  // local state using runes (Svelte 5)
  let messageInput = $state('');
  let chatContainer = $state<HTMLDivElement | null>(null);

  // scroll to bottom whenever active session messages change
  $effect(() => {
    // when activeSession changes or its messages change, scroll
    const s = $activeSession;
    if (!chatContainer) return;
    // microtask to ensure DOM updated
    queueMicrotask(() => {
      if (!chatContainer) return;
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });
  });

  // mark session as read when opened
  $effect(() => {
    const aid = $activeChatId;
    if (!aid) return;

    // clear unread flag for the active session
    sessions.update(list => list.map(s => s.matchId === aid ? { ...s, unread: false } : s));
  });

  async function sendMessage() {
    if (!messageInput.trim()) return;
    // delegate the heavy lifting to the store action
    await handleSendMessage(messageInput.trim());
    messageInput = '';
  }

  function openSession(id: string) {
    activeChatId.set(id);
  }

  onMount(async () => {
    // ensure matches are loaded when visiting the chat page
    await refreshMatches();
  });
</script>

<style>
  .msg-user { background: linear-gradient(180deg,#d16b86,#c4556f); color: white; }
  .msg-ai { background: rgba(255,255,255,0.04); color: #e6e6e6; }
  /* small utilities */
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>

{#if $activeChatId && $activeSession}
      <div class="fixed inset-0 bg-background z-30 flex flex-col">

<!-- Chat View -->
<div class="flex-1 flex flex-col">
    <header class="h-16 bg-surface flex items-center px-4 border-b border-white/10">
    <button on:click={() => activeChatId.set(null)} class="mr-3 text-gray-400">←</button>
    <img src={$activeSession.match.avatarUrl} alt="avatar" class="w-10 h-10 rounded-full border border-primary" />
    <div class="ml-3">
        <div class="font-semibold text-white">{$activeSession.match.searchProfileName} {$activeSession.match.funWord}</div>
        <div class="text-xs text-gray-400">{$activeSession.match.age} ans ({$activeSession.match.department})</div>
    </div>

    <button class="ml-auto text-gray-400" on:click={() => {
      if (confirm("Are you sure?")) {
        alert("Match deleted");
      }
    }}>Supprimer ce match</button>
  </header>

    <div bind:this={chatContainer} class="flex-1 p-4 overflow-y-auto no-scrollbar bg-black/10 space-y-3">
    {#each $activeSession.messages as msg (msg.id)}
        <div class="flex {msg.senderId === 'user' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[75%] px-4 py-2 rounded-2xl text-sm {msg.senderId === 'user' ? 'msg-user rounded-br-none' : 'msg-ai rounded-bl-none'}">
            {msg.text}
        </div>
        </div>
    {/each}
    </div>

    <form on:submit|preventDefault={sendMessage} class="p-4 bg-surface border-t border-white/10">
    <div class="flex items-center gap-2">
        <input
        type="text"
        placeholder="Envoyer un message..."
        bind:value={messageInput}
        class="flex-1 bg-background text-white p-2 rounded outline-none"
        autocomplete="off"
        />
        <button type="submit" class="px-4 py-2 bg-primary rounded text-white">Envoyer</button>
    </div>
    </form>
</div>
</div>
{:else}
      <div class="pt-10 pb-24 px-4 min-h-screen">
            <h2 class="text-lg ml-4 font-semibold text-white inline-block">Messages</h2>
            <a href="#" class="mr-4 float-right text-primary text-sm"> Profile chiffré pour 200/500 personnes. 12 matches. 38 incompatibles. 150 en attente.</a>
<!-- Conversations List -->
<main class="p-4 flex-1 space-y-4">
    {#if $sessions.length === 0}
    <div class="text-gray-500 text-center mt-24 animate-pulse">Recherche de compatibilités...</div>
    {:else}
    {#each $sessions as session (session.matchId)}
        <article
        role="button"
        tabindex="0"
        on:click={() => openSession(session.matchId)}
        class="flex items-center p-4 bg-surface rounded-2xl shadow-sm cursor-pointer hover:bg-surface2/40 border border-white/5"
        >
        <div class="relative">
            <img src={session.match.avatarUrl} alt="avatar" class="w-14 h-14 rounded-full object-cover border-2 border-primary" />
            {#if session.unread}
            <span class="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border border-surface"></span>
            {/if}
        </div>

        <div class="ml-4 flex-1">
            <div class="flex justify-between items-baseline">
            <h3 class="text-white font-semibold">{session.match.searchProfileName} <span class="text-gray-300 ml-1 italic text-sm">{session.match.funWord}</span></h3>
            <span class="text-xs text-gray-500"></span>
            </div>
            <p class="text-gray-400 text-sm truncate mt-1">{session.messages[session.messages.length-1].text}</p>
        </div>
        </article>
    {/each}
    {/if}
</main>
</div>

{/if}
