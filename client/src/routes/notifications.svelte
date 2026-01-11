<!-- Notifications Settings Page -->
<script lang="ts">
  import { navigate } from 'sv-router/generated';
  import { subscribeToPush } from '../services/webPushService';

  let status = $state<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle');
  let message = $state('');

  async function requestNotificationPermission() {
    status = 'requesting';
    message = '';

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Try to subscribe to push
        const subscription = await subscribeToPush();
        
        if (subscription) {
          status = 'granted';
          message = 'Notifications activées avec succès !';
        } else {
          status = 'error';
          message = 'Permission accordée mais abonnement push échoué. Vérifiez la configuration VAPID.';
        }
      } else if (permission === 'denied') {
        status = 'denied';
        message = 'Permission refusée. Vous pouvez l\'activer dans les paramètres du navigateur.';
      } else {
        status = 'denied';
        message = 'Permission non accordée.';
      }
    } catch (error) {
      status = 'error';
      message = `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
    }
  }

  // Check current permission status on mount
  $effect(() => {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        status = 'granted';
        message = 'Notifications déjà activées.';
      } else if (Notification.permission === 'denied') {
        status = 'denied';
        message = 'Notifications actuellement refusées.';
      }
    }
  });
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
      <h1 class="text-2xl font-bold text-white">Notifications</h1>
    </div>

    <!-- Content -->
    <div class="bg-surface rounded-2xl p-6 space-y-6">
      <div>
        <h2 class="text-lg font-semibold text-white mb-2">Autorisations de notifications</h2>
        <p class="text-gray-400 text-sm mb-4">
          Activez les notifications pour recevoir des alertes sur vos messages et demandes de connexion depuis d'autres appareils.
        </p>
      </div>

      <!-- Status Display -->
      {#if status === 'granted'}
        <div class="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
          <div class="flex items-center gap-2 text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-semibold">Notifications activées</span>
          </div>
          <p class="text-gray-300 text-sm mt-2">{message}</p>
        </div>
      {:else if status === 'denied'}
        <div class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
          <div class="flex items-center gap-2 text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="font-semibold">Notifications désactivées</span>
          </div>
          <p class="text-gray-300 text-sm mt-2">{message}</p>
        </div>
      {:else if status === 'error'}
        <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <div class="flex items-center gap-2 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-semibold">Erreur</span>
          </div>
          <p class="text-gray-300 text-sm mt-2">{message}</p>
        </div>
      {/if}

      <!-- Request Button -->
      <button
        onclick={requestNotificationPermission}
        disabled={status === 'requesting' || status === 'granted'}
        class="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition"
      >
        {#if status === 'requesting'}
          <span class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Demande en cours...
          </span>
        {:else if status === 'granted'}
          ✓ Notifications activées
        {:else}
          Activer les notifications
        {/if}
      </button>

      <!-- Info -->
      <div class="text-gray-400 text-xs space-y-2">
        <p>• Les notifications vous alertent des nouveaux messages</p>
        <p>• Vous recevrez aussi des alertes pour les demandes de connexion depuis d'autres appareils</p>
        <p>• Vous pouvez désactiver les notifications à tout moment dans les paramètres de votre navigateur</p>
      </div>
    </div>
  </div>
</div>

