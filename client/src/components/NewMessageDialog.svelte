<!-- New Message Dialog Component -->
<script lang="ts">
  import { getAllContacts } from '../services/contactsService';
  import type { Contact } from '../services/contactsService';
  import { createChatSession } from '../services/chatService';
  import { navigate } from 'sv-router/generated';

  let { open, onSelect, onClose } = $props<{
    open: boolean;
    onSelect: (contact: Contact) => void;
    onClose: () => void;
  }>();

  let contacts = $state<Contact[]>([]);
  let searchQuery = $state('');
  let loading = $state(true);

  $effect(async () => {
    if (open) {
      loading = true;
      try {
        contacts = await getAllContacts();
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        loading = false;
      }
    }
  });

  const filteredContacts = $derived(
    contacts.filter(c => 
      c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    )
  );
</script>

{#if open}
  <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="bg-surface rounded-2xl p-6 max-w-md w-full border border-white/10">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-white">Nouveau message</h3>
        <button
          onclick={onClose}
          class="text-gray-400 hover:text-white transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Search Input -->
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Rechercher un contact..."
        class="w-full bg-background text-white p-3 rounded-lg border border-gray-700 focus:border-primary outline-none mb-4"
        autocomplete="off"
      />

      <!-- Contacts List -->
      <div class="max-h-64 overflow-y-auto space-y-2">
        {#if loading}
          <div class="text-center py-8 text-gray-400">Chargement...</div>
        {:else if filteredContacts.length === 0}
          <div class="text-center py-8 text-gray-400">Aucun contact trouvé</div>
        {:else}
          {#each filteredContacts as contact (contact.phone)}
            <button
              onclick={async () => {
                // Create chat session and navigate
                await createChatSession(contact.phone, contact.displayName);
                navigate('/chat');
                onClose();
              }}
              class="w-full bg-background/50 rounded-lg p-3 text-left hover:bg-background/70 transition flex items-center gap-3"
            >
              <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-white font-medium">{contact.displayName}</p>
                <p class="text-gray-400 text-sm">{contact.phone}</p>
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

