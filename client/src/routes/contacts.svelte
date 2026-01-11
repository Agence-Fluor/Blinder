<!-- Contacts Page -->
<script lang="ts">
  import { navigate } from 'sv-router/generated';
  import { onMount } from 'svelte';
  import { getAllContacts, saveContact, type Contact } from '../services/contactsService';
  import { requestContactsPermission, isContactsAPIAvailable, getContacts as getDeviceContacts, type ContactsPermissionStatus } from '../services/contactsPermissionService';
  import { getOSContactsWithAppStatus } from '../services/contactsOSService';

  let contacts = $state<Contact[]>([]);
  let osContacts = $state<Array<{ name: string; phone: string; isRegistered: boolean; appContact?: Contact }>>([]);
  let loading = $state(true);
  let permissionStatus = $state<ContactsPermissionStatus | null>(null);
  let requestingPermission = $state(false);
  let showPermissionDialog = $state(false);
  let showOSContacts = $state(false);

  async function loadContacts() {
    loading = true;
    try {
      contacts = await getAllContacts();
      
      // Load OS contacts with app status if API is available
      if (isContactsAPIAvailable()) {
        try {
          osContacts = await getOSContactsWithAppStatus();
        } catch (error) {
          console.error('Error loading OS contacts:', error);
        }
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      loading = false;
    }
  }

  async function handleRequestPermission() {
    requestingPermission = true;
    try {
      permissionStatus = await requestContactsPermission();
      
      if (permissionStatus.granted) {
        // Import contacts from device
        const deviceContacts = await getDeviceContacts();
        
        // Save to our contacts store
        for (const deviceContact of deviceContacts) {
          // Check if already exists
          const existing = contacts.find(c => c.phone === deviceContact.phone);
          if (!existing) {
            await saveContact({
              phone: deviceContact.phone,
              displayName: deviceContact.name,
              originalName: deviceContact.name,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        }
        
        await loadContacts();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      requestingPermission = false;
      showPermissionDialog = false;
    }
  }

  onMount(() => {
    loadContacts();
    
    // Check if contacts API is available
    if (!isContactsAPIAvailable()) {
      permissionStatus = {
        granted: false,
        denied: false,
        unavailable: true,
        message: 'L\'accès aux contacts n\'est pas disponible sur iOS pour le moment.',
      };
    }
  });

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
</script>

<div class="pt-10 pb-24 px-4 min-h-screen">
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <h1 class="text-2xl font-bold text-white">Contacts</h1>
      </div>
      
      {#if isContactsAPIAvailable()}
        <button
          onclick={() => showPermissionDialog = true}
          class="text-primary text-sm font-medium hover:underline"
        >
          Importer depuis l'appareil
        </button>
      {/if}
    </div>

    <!-- Permission Status -->
    {#if permissionStatus?.unavailable}
      <div class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
        <div class="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="text-yellow-400 text-sm">
            <p class="font-semibold mb-1">Limitation iOS</p>
            <p>{permissionStatus.message}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Content -->
    <div class="bg-surface rounded-2xl p-6">
      {#if loading}
        <div class="text-center py-12">
          <svg class="animate-spin h-8 w-8 mx-auto text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-gray-400 text-sm mt-4">Chargement...</p>
        </div>
      {:else if contacts.length === 0}
        <div class="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p class="text-gray-400 text-lg mb-2">Aucun contact</p>
          <p class="text-gray-500 text-sm mb-4">Ajoutez des contacts en scannant des QR codes depuis le chat</p>
          {#if isContactsAPIAvailable()}
            <button
              onclick={() => showPermissionDialog = true}
              class="bg-primary text-white px-6 py-2 rounded-full font-semibold hover:bg-primary/90 transition"
            >
              Importer depuis l'appareil
            </button>
          {/if}
        </div>
      {:else}
        <!-- Toggle between app contacts and OS contacts -->
        <div class="mb-4 flex gap-2">
          <button
            onclick={() => showOSContacts = false}
            class={`px-4 py-2 rounded-lg text-sm font-medium transition ${!showOSContacts ? 'bg-primary text-white' : 'bg-background/50 text-gray-400'}`}
          >
            Contacts app ({contacts.length})
          </button>
          {#if isContactsAPIAvailable() && osContacts.length > 0}
            <button
              onclick={() => showOSContacts = true}
              class={`px-4 py-2 rounded-lg text-sm font-medium transition ${showOSContacts ? 'bg-primary text-white' : 'bg-background/50 text-gray-400'}`}
            >
              Contacts OS ({osContacts.length})
            </button>
          {/if}
        </div>

        {#if !showOSContacts}
          <!-- App Contacts -->
          <div class="space-y-3">
            {#each contacts as contact (contact.phone)}
              <div class="bg-background/50 rounded-lg p-4 border border-white/10">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <h3 class="font-semibold text-white mb-1">{contact.displayName}</h3>
                    <p class="text-gray-400 text-sm">+{contact.phone.replace('+', '')}</p>
                    {#if contact.originalName && contact.originalName !== contact.displayName}
                      <p class="text-gray-500 text-xs mt-1">Nom original: {contact.originalName}</p>
                    {/if}
                    <p class="text-gray-500 text-xs mt-2">Ajouté le {formatDate(contact.createdAt)}</p>
                  </div>
                  <div class="flex gap-2 ml-4">
                    <button
                      onclick={() => {
                        // Navigate to chat with this contact
                        navigate(`/chat?phone=${contact.phone}`);
                      }}
                      class="text-primary hover:text-primary/80 transition"
                      title="Ouvrir la conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                    <button
                      onclick={async () => {
                        navigate(`/appels?contact=${contact.phone}`);
                      }}
                      class="text-green-400 hover:text-green-300 transition"
                      title="Appeler"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <!-- OS Contacts -->
          <div class="space-y-3">
            {#each osContacts as osContact (osContact.phone)}
              <div class="bg-background/50 rounded-lg p-4 border border-white/10">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h3 class="font-semibold text-white">{osContact.name}</h3>
                      {#if osContact.isRegistered}
                        <span class="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">Sur l'app</span>
                      {:else}
                        <span class="bg-gray-500/20 text-gray-400 text-xs px-2 py-0.5 rounded-full">Pas sur l'app</span>
                      {/if}
                    </div>
                    <p class="text-gray-400 text-sm">+{osContact.phone}</p>
                  </div>
                  <div class="flex gap-2 ml-4">
                    {#if osContact.isRegistered}
                      <button
                        onclick={() => {
                          navigate(`/chat?phone=${osContact.phone}`);
                        }}
                        class="text-primary hover:text-primary/80 transition"
                        title="Ouvrir la conversation"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                    {:else}
                      <button
                        onclick={() => {
                          navigate(`/chat?phone=${osContact.phone}`);
                        }}
                        class="text-primary hover:text-primary/80 transition"
                        title="Envoyer un message (contact non inscrit)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<!-- Permission Dialog -->
{#if showPermissionDialog}
  <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="bg-surface rounded-2xl p-6 max-w-sm w-full border border-white/10">
      <h3 class="text-xl font-bold text-white mb-4">Importer les contacts</h3>
      
      {#if permissionStatus?.unavailable}
        <p class="text-gray-300 text-sm mb-6">
          {permissionStatus.message}
        </p>
      {:else}
        <p class="text-gray-300 text-sm mb-6">
          Autorisez l'accès à vos contacts pour les importer dans Blinder. Vos contacts restent privés et ne sont jamais partagés.
        </p>
      {/if}
      
      <div class="flex gap-3">
        <button
          onclick={() => showPermissionDialog = false}
          class="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Annuler
        </button>
        {#if !permissionStatus?.unavailable}
          <button
            onclick={handleRequestPermission}
            disabled={requestingPermission}
            class="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
          >
            {requestingPermission ? 'Import...' : 'Autoriser'}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
