<!-- Security / Devices Management Page -->
<script lang="ts">
  import { navigate } from 'sv-router/generated';
  import { onMount } from 'svelte';
  import { getDevices, deleteDevice, type DeviceInfo } from '../services/devicesApiService';
  import { logout, clearAllData, getCurrentPhone } from '../services/authService';
  import { loadProfile } from '../services/indexedDbService';

  let devices = $state<DeviceInfo[]>([]);
  let loading = $state(true);
  let error = $state('');
  let phone = $state('');
  let deletingDeviceId = $state<string | null>(null);
  let showLogoutConfirm = $state(false);
  let logoutType: 'temporary' | 'permanent' | null = null;

  async function loadDevices() {
    loading = true;
    error = '';
    
    try {
      // Get phone from profile or current session
      const profile = await loadProfile();
      phone = (profile as any)?.phone || getCurrentPhone() || '';
      
      if (!phone) {
        error = 'Numéro de téléphone non trouvé';
        loading = false;
        return;
      }

      const result = await getDevices(phone);
      if (result.success) {
        devices = result.devices;
      } else {
        error = result.message;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Erreur lors du chargement des appareils';
    } finally {
      loading = false;
    }
  }

  async function handleDeleteDevice(credentialId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet appareil ?')) {
      return;
    }

    deletingDeviceId = credentialId;
    
    try {
      const result = await deleteDevice(phone, credentialId);
      if (result.success) {
        await loadDevices(); // Reload list
      } else {
        alert(`Erreur: ${result.message}`);
      }
    } catch (err) {
      alert(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      deletingDeviceId = null;
    }
  }

  async function handleLogout(isTemporary: boolean) {
    if (isTemporary) {
      logout(phone, true);
      alert('Déconnexion temporaire effectuée. Vous pourrez vous reconnecter depuis l\'écran d\'accueil.');
      navigate('/onboarding');
    } else {
      // Permanent logout - clear all data
      if (confirm('⚠️ ATTENTION: Cette action est irréversible. Toutes vos données locales seront supprimées. Continuer ?')) {
        await clearAllData();
        alert('Déconnexion définitive effectuée. Toutes les données ont été supprimées.');
        navigate('/onboarding');
      }
    }
    showLogoutConfirm = false;
  }

  onMount(() => {
    loadDevices();
  });

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Jamais';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }
</script>

<div class="pt-10 pb-24 px-4 min-h-screen">
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center mb-6">
      <button
        onclick={() => navigate('/profil')}
        class="mr-4 text-gray-400 hover:text-white transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-2xl font-bold text-white">Sécurité</h1>
    </div>

    <!-- Warning -->
    <div class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
      <div class="flex items-start gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="text-yellow-400 text-sm">
          <p class="font-semibold mb-1">⚠️ Attention</p>
          <p>Si tous vos appareils sont perdus ou supprimés, vous perdrez définitivement l'accès à vos données. Assurez-vous de conserver au moins un appareil actif.</p>
        </div>
      </div>
    </div>

    <!-- Devices List -->
    <div class="bg-surface rounded-2xl p-6 space-y-4">
      <h2 class="text-lg font-semibold text-white mb-4">Appareils enregistrés</h2>

      {#if loading}
        <div class="text-center py-8">
          <svg class="animate-spin h-8 w-8 mx-auto text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-gray-400 text-sm mt-4">Chargement...</p>
        </div>
      {:else if error}
        <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p class="text-red-400 text-sm">{error}</p>
        </div>
      {:else if devices.length === 0}
        <div class="text-center py-8">
          <p class="text-gray-400">Aucun appareil enregistré</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each devices as device (device.credential_id)}
            <div class="bg-background/50 rounded-lg p-4 border border-white/10">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <h3 class="font-semibold text-white">
                      {device.device_name || 'Appareil sans nom'}
                    </h3>
                    {#if device.is_current}
                      <span class="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">Actuel</span>
                    {/if}
                  </div>
                  <div class="text-gray-400 text-xs space-y-1">
                    <p>Créé le: {formatDate(device.created_at)}</p>
                    <p>Dernière utilisation: {formatDate(device.last_used_at)}</p>
                    <p class="text-gray-500 font-mono text-[10px] mt-2">ID: {device.credential_id.slice(0, 16)}...</p>
                  </div>
                </div>
                <button
                  onclick={() => handleDeleteDevice(device.credential_id)}
                  disabled={deletingDeviceId === device.credential_id}
                  class="ml-4 text-red-400 hover:text-red-300 disabled:opacity-50 transition"
                  title="Supprimer cet appareil"
                >
                  {#if deletingDeviceId === device.credential_id}
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  {/if}
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Logout Buttons -->
    <div class="mt-6 bg-surface rounded-2xl p-6 space-y-4">
      <h2 class="text-lg font-semibold text-white mb-4">Déconnexion</h2>
      
      <div class="space-y-3">
        <button
          onclick={() => { logoutType = 'temporary'; showLogoutConfirm = true; }}
          class="w-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500/30 transition"
        >
          Déconnexion temporaire
        </button>
        <p class="text-gray-400 text-xs">
          Vous pourrez vous reconnecter depuis l'écran d'accueil. Vos données restent sur cet appareil.
        </p>

        <div class="border-t border-white/10 my-4"></div>

        <button
          onclick={() => { logoutType = 'permanent'; showLogoutConfirm = true; }}
          class="w-full bg-red-500/20 border border-red-500/50 text-red-400 px-6 py-3 rounded-lg font-semibold hover:bg-red-500/30 transition"
        >
          Déconnexion définitive
        </button>
        <p class="text-gray-400 text-xs">
          ⚠️ Toutes vos données locales seront supprimées de manière irréversible.
        </p>
      </div>
    </div>
  </div>
</div>

<!-- Logout Confirmation Modal -->
{#if showLogoutConfirm}
  <div class="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
    <div class="bg-surface rounded-2xl p-6 max-w-sm w-full border border-white/10">
      <h3 class="text-xl font-bold text-white mb-4">
        {logoutType === 'temporary' ? 'Déconnexion temporaire' : 'Déconnexion définitive'}
      </h3>
      <p class="text-gray-300 text-sm mb-6">
        {#if logoutType === 'temporary'}
          Vous serez déconnecté mais pourrez vous reconnecter depuis l'écran d'accueil. Vos données restent sur cet appareil.
        {:else}
          ⚠️ Cette action est irréversible. Toutes vos données locales seront supprimées définitivement.
        {/if}
      </p>
      <div class="flex gap-3">
        <button
          onclick={() => showLogoutConfirm = false}
          class="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
        >
          Annuler
        </button>
        <button
          onclick={() => handleLogout(logoutType === 'temporary')}
          class="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          Confirmer
        </button>
      </div>
    </div>
  </div>
{/if}

