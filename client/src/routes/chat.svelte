<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import type { ChatSession, Message } from '../types';

  // stores & actions (your centralized rune-enabled stores)
  import {
    sessions,
    activeChatId,
    activeSession,
    refreshMatches,
    handleSendMessage
  } from '../stores/app';
  import { saveContact, getContact, getDisplayName } from '../services/contactsService';
  import { parseProfileShareQRCode } from '../services/profileShareService';
  import QRCodeScanner from '../components/QRCodeScanner.svelte';
  import AttachmentPicker from '../components/AttachmentPicker.svelte';
  import NewMessageDialog from '../components/NewMessageDialog.svelte';
  import { AvatarComponent } from 'avataaars-svelte';
  import { type Attachment, createPreview, type AttachmentPreview } from '../services/attachmentService';
  import type { Contact } from '../services/contactsService';
  import { createChatSession } from '../services/chatService';

  // local state using runes (Svelte 5)
  let messageInput = $state('');
  let chatContainer = $state<HTMLDivElement | null>(null);
  let showAddFriendQR = $state(false);
  let displayNames = $state<Map<string, string>>(new Map());
  let pendingAttachment = $state<Attachment | null>(null);
  let attachmentPreview = $state<AttachmentPreview | null>(null);
  let showNewMessageDialog = $state(false);
  let typingStatus = $state<Map<string, boolean>>(new Map());

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

  // Load display names for contacts
  $effect(async () => {
    const s = $activeSession;
    if (!s) return;
    
    // Try to get display name from contacts
    const contact = await getContact(s.matchId);
    if (contact) {
      displayNames.set(s.matchId, contact.displayName);
    }
  });

  // Handle adding friend via QR code
  async function handleAddFriendQR(qrData: string) {
    try {
      const data = parseProfileShareQRCode(qrData);
      if (!data) {
        alert('QR code invalide');
        return;
      }

      // Save contact with suggested display name
      await saveContact({
        phone: data.phone,
        displayName: data.displayName || data.phone,
        originalName: data.displayName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update display name in UI
      displayNames.set(data.phone, data.displayName || data.phone);
      
      showAddFriendQR = false;
      alert(`Contact ${data.displayName || data.phone} ajouté !`);
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Erreur lors de l\'ajout du contact');
    }
  }

  async function sendMessage() {
    const text = messageInput.trim();
    const attachment = pendingAttachment;
    
    if (!text && !attachment) return;

    // TODO: Update handleSendMessage to support attachments
    if (attachment) {
      // Send attachment with optional text
      await handleSendMessage(text || '', attachment);
      pendingAttachment = null;
      attachmentPreview = null;
    } else {
      // Send text only
      await handleSendMessage(text);
    }
    
    messageInput = '';
  }

  async function handleAttachmentSelect(attachment: Attachment) {
    pendingAttachment = attachment;
    // Create preview
    const preview = await createPreview(attachment);
    if (preview) {
      attachmentPreview = preview;
    }
  }

  function removeAttachment() {
    if (attachmentPreview?.url) {
      URL.revokeObjectURL(attachmentPreview.url);
      if (attachmentPreview.thumbnail) {
        URL.revokeObjectURL(attachmentPreview.thumbnail);
      }
    }
    pendingAttachment = null;
    attachmentPreview = null;
  }

  function openSession(id: string) {
    activeChatId.set(id);
  }

  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  onMount(async () => {
    // Check identity keys for all contacts on app start (when chat page loads)
    try {
      const { checkAllIdentityKeysOnAppStart } = await import('../services/identityChangeService');
      await checkAllIdentityKeysOnAppStart();
    } catch (error) {
      console.error('Error checking identity keys on app start:', error);
    }
    
    // Check if phone parameter is in URL (for direct messaging)
    const urlParams = new URLSearchParams(window.location.search);
    const phoneParam = urlParams.get('phone');
    
    if (phoneParam) {
      // Create session for this phone number
      await createChatSession(phoneParam);
      // Clean URL
      window.history.replaceState({}, '', '/chat');
    } else {
      // ensure matches are loaded when visiting the chat page
      await refreshMatches();
    }

    // Poll for new messages every 2 seconds
    const pollInterval = setInterval(async () => {
      const currentSessions = get(sessions);
      for (const session of currentSessions) {
        try {
          const { fetchAndDecryptMessages, getMessagingPrivateKey } = await import('../services/secureMessagingService');
          const privateKey = await getMessagingPrivateKey();
          const newMessages = await fetchAndDecryptMessages(session.match.id, session.matchId, privateKey);
          
          if (newMessages.length > 0) {
            // Update session with new messages
            const updatedSessions = [...get(sessions)];
            const sessionIdx = updatedSessions.findIndex(s => s.matchId === session.matchId);
            if (sessionIdx !== -1) {
              const existingIds = new Set(updatedSessions[sessionIdx].messages.map((m: any) => m.id));
              for (const msg of newMessages) {
                if (!existingIds.has(msg.id)) {
                  updatedSessions[sessionIdx].messages.push(msg);
                }
              }
              sessions.set(updatedSessions);
            }
          }
        } catch (error) {
          console.error(`Error polling messages for ${session.matchId}:`, error);
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  });

  // Cleanup preview URLs on unmount
  $effect(() => {
    return () => {
      if (attachmentPreview?.url) {
        URL.revokeObjectURL(attachmentPreview.url);
        if (attachmentPreview.thumbnail) {
          URL.revokeObjectURL(attachmentPreview.thumbnail);
        }
      }
    };
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
    <button onclick={() => activeChatId.set(null)} class="mr-3 text-gray-400">←</button>
    <div class="w-10 h-10 rounded-full overflow-hidden border border-primary">
      <AvatarComponent
        avatarStyle="Circle"
        topType="ShortHairShortFlat"
        accessoriesType="Blank"
        hairColor="BrownDark"
        facialHairType="Blank"
        facialHairColor=""
        clotheType="ShirtCrewNeck"
        clotheColor="Blue03"
        graphicType=""
        eyeType="Default"
        eyebrowType="Default"
        mouthType="Smile"
        skinColor="Pale"
        style="width: 100%; height: 100%;"
      />
    </div>
    <div class="ml-3 flex-1">
        <div class="font-semibold text-white">
          {displayNames.get($activeSession.matchId) || $activeSession.match.searchProfileName} {$activeSession.match.funWord}
        </div>
        <div class="text-xs text-gray-400">{$activeSession.match.age} ans ({$activeSession.match.department})</div>
    </div>

    <!-- Rename contact button -->
    <button 
      class="mr-2 text-gray-400 hover:text-primary transition" 
      onclick={async () => {
        const currentName = displayNames.get($activeSession.matchId) || $activeSession.match.searchProfileName;
        const newName = prompt('Renommer ce contact:', currentName);
        if (newName && newName.trim() && newName !== currentName) {
          try {
            await saveContact({
              phone: $activeSession.matchId,
              displayName: newName.trim(),
              originalName: $activeSession.match.searchProfileName,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            displayNames.set($activeSession.matchId, newName.trim());
          } catch (error) {
            console.error('Error saving contact:', error);
            alert('Erreur lors de la sauvegarde');
          }
        }
      }}
      title="Renommer ce contact"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>

    <button class="text-gray-400" onclick={() => {
      if (confirm("Are you sure?")) {
        alert("Match deleted");
      }
    }}>Supprimer</button>
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

    <form onsubmit={(e) => { e.preventDefault(); sendMessage(); }} class="p-4 bg-surface border-t border-white/10">
    <!-- Attachment Preview -->
    {#if attachmentPreview}
      <div class="mb-2 relative">
        {#if attachmentPreview.type === 'image'}
          <div class="relative inline-block max-w-xs">
            <img src={attachmentPreview.url} alt="Preview" class="max-w-full max-h-48 rounded-lg" />
            <button
              onclick={removeAttachment}
              class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        {:else if attachmentPreview.type === 'video'}
          <div class="relative inline-block max-w-xs">
            <video src={attachmentPreview.url} class="max-w-full max-h-48 rounded-lg" controls></video>
            <button
              onclick={removeAttachment}
              class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        {:else if attachmentPreview.type === 'audio'}
          <div class="bg-background rounded-lg p-3 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <div class="flex-1">
              <p class="text-white text-sm">{pendingAttachment?.fileName || 'Audio'}</p>
              {#if attachmentPreview.duration}
                <p class="text-gray-400 text-xs">{formatDuration(attachmentPreview.duration)}</p>
              {/if}
            </div>
            <button
              onclick={removeAttachment}
              class="text-red-500 hover:text-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <div class="flex items-center gap-2">
        <AttachmentPicker onSelect={handleAttachmentSelect} />
        <input
        type="text"
        placeholder="Envoyer un message..."
        bind:value={messageInput}
        class="flex-1 bg-background text-white p-2 rounded outline-none"
        autocomplete="off"
        onkeydown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
        />
        <button type="submit" class="px-4 py-2 bg-primary rounded text-white">Envoyer</button>
    </div>
    </form>
</div>
</div>
      {:else}
        <div class="pt-10 pb-24 min-h-screen">
          <!-- Header -->
          <div class="px-4 mb-6">
            <h1 class="text-2xl font-bold text-white">Messages</h1>
          </div>
            <!-- New Message Dialog -->
            <NewMessageDialog
              open={showNewMessageDialog}
              onSelect={(contact: Contact) => {
                // Open chat with selected contact
                // TODO: Create or find session for this contact
                console.log('Selected contact:', contact);
                showNewMessageDialog = false;
              }}
              onClose={() => showNewMessageDialog = false}
            />

            {#if showAddFriendQR}
              <div class="fixed inset-0 bg-background/90 z-50 flex items-center justify-center p-4">
                <div class="bg-surface rounded-lg p-6 max-w-sm w-full">
                  <h3 class="text-xl font-bold text-white mb-4">Scanner QR code pour ajouter un ami</h3>
                  <QRCodeScanner 
                    onScan={handleAddFriendQR}
                    onError={(error) => {
                      console.error('QR scan error:', error);
                    }}
                  />
                  <button
                    onclick={() => showAddFriendQR = false}
                    class="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            {/if}
            
            <!--a href="#" class="mr-4 float-right text-primary text-sm"> Profile chiffré pour 200/500 personnes. 12 matches. 38 incompatibles. 150 en attente.</a-->
<!-- Conversations List -->
<main class="p-4 flex-1 space-y-4">
    {#if $sessions.length === 0}
    <div class="text-gray-500 text-center mt-24 animate-pulse">Recherche de compatibilités...</div>
    {:else}
    {#each $sessions as session (session.matchId)}
        <article
        role="button"
        tabindex="0"
        onclick={() => openSession(session.matchId)}
        class="flex items-center p-4 bg-surface rounded-2xl shadow-sm cursor-pointer hover:bg-surface2/40 border border-white/5"
        >
        <div class="relative flex-shrink-0 w-14 h-14">
          <div class="w-full h-full rounded-full overflow-hidden border-2 border-primary">
            <AvatarComponent
              avatarStyle="Circle"
              topType="ShortHairShortFlat"
              accessoriesType="Blank"
              hairColor="BrownDark"
              facialHairType="Blank"
              facialHairColor=""
              clotheType="ShirtCrewNeck"
              clotheColor="Blue03"
              graphicType=""
              eyeType="Default"
              eyebrowType="Default"
              mouthType="Smile"
              skinColor="Pale"
              style="width: 100%; height: 100%;"
            />
          </div>
          {#if session.unread}
            <span class="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border border-surface"></span>
          {/if}
          {#if typingStatus.get(session.matchId)}
            <div class="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
              <div class="flex gap-0.5">
                <div class="w-1 h-1 bg-white rounded-full animate-bounce" style="animation-delay: 0s"></div>
                <div class="w-1 h-1 bg-white rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                <div class="w-1 h-1 bg-white rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
              </div>
            </div>
          {/if}
        </div>


        <div class="ml-4 flex-1 min-w-0 overflow-hidden">
          <div class="flex justify-between items-baseline min-w-0 overflow-hidden">
            <h3 class="text-white font-semibold truncate overflow-hidden break-words">
              {displayNames.get(session.matchId) || session.match.searchProfileName}
              <span class="text-gray-300 ml-1 italic text-sm">
                {session.match.funWord}
              </span>
            </h3>
          </div>

          <p class="text-gray-400 text-sm mt-1 line-clamp-2 overflow-hidden break-words">
            {#if typingStatus.get(session.matchId)}
              <span class="italic">En train d'écrire...</span>
            {:else if session.messages.length > 0}
              {session.messages[session.messages.length - 1].text}
            {:else}
              Aucun message
            {/if}
          </p>
        </div>

      </article>
    {/each}
    {/if}
</main>
</div>

{/if}
