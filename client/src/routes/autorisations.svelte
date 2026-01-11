<!-- Autorisations Page - Combines Camera and Notifications -->
<script lang="ts">
  import { navigate } from 'sv-router/generated';
  import { subscribeToPush } from '../services/webPushService';

  // Notifications state
  let notificationStatus = $state<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle');
  let notificationMessage = $state('');

  // Camera state
  let cameraStatus = $state<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle');
  let cameraMessage = $state('');
  let cameraAvailable = $state(false);

  // Check camera availability
  async function checkCameraAvailability(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
      return false;
    }
  }

  // Request notification permission
  async function requestNotificationPermission() {
    notificationStatus = 'requesting';
    notificationMessage = '';

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const subscription = await subscribeToPush();
        
        if (subscription) {
          notificationStatus = 'granted';
          notificationMessage = 'Notifications activées avec succès !';
        } else {
          notificationStatus = 'error';
          notificationMessage = 'Permission accordée mais abonnement push échoué. Vérifiez la configuration VAPID.';
        }
      } else if (permission === 'denied') {
        notificationStatus = 'denied';
        notificationMessage = 'Permission refusée. Vous pouvez l\'activer dans les paramètres du navigateur.';
      } else {
        notificationStatus = 'denied';
        notificationMessage = 'Permission non accordée.';
      }
    } catch (error) {
      notificationStatus = 'error';
      notificationMessage = `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
    }
  }

  // Request camera permission
  async function requestCameraPermission() {
    cameraStatus = 'requesting';
    cameraMessage = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      cameraStatus = 'granted';
      cameraMessage = 'Accès à la caméra autorisé !';
      
      stream.getTracks().forEach(track => track.stop());
      
      cameraAvailable = await checkCameraAvailability();
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        cameraStatus = 'denied';
        cameraMessage = 'Permission refusée. Vous pouvez l\'activer dans les paramètres du navigateur.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        cameraStatus = 'error';
        cameraMessage = 'Aucune caméra trouvée sur cet appareil.';
        cameraAvailable = false;
      } else {
        cameraStatus = 'error';
        cameraMessage = `Erreur: ${error.message || 'Erreur inconnue'}`;
      }
    }
  }

  // Check current status on mount
  $effect(async () => {
    // Check notifications
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        notificationStatus = 'granted';
        notificationMessage = 'Notifications déjà activées.';
      } else if (Notification.permission === 'denied') {
        notificationStatus = 'denied';
        notificationMessage = 'Notifications actuellement refusées.';
      }
    }

    // Check camera
    cameraAvailable = await checkCameraAvailability();
    
    if (cameraAvailable) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStatus = 'granted';
        cameraMessage = 'Accès à la caméra déjà autorisé.';
        stream.getTracks().forEach(track => track.stop());
      } catch (error: any) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          cameraStatus = 'denied';
          cameraMessage = 'Accès à la caméra actuellement refusé.';
        } else {
          cameraStatus = 'idle';
        }
      }
    } else {
      cameraStatus = 'error';
      cameraMessage = 'Aucune caméra détectée sur cet appareil.';
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
      <h1 class="text-2xl font-bold text-white">Autorisations</h1>
    </div>

    <!-- Notifications Section -->
    <div class="bg-surface rounded-2xl p-6 space-y-6 mb-6">
      <div>
        <h2 class="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notifications
        </h2>
        <p class="text-gray-400 text-sm mb-4">
          Activez les notifications pour recevoir des alertes sur vos messages et demandes de connexion depuis d'autres appareils.
        </p>
      </div>

      <!-- Notification Status -->
      {#if notificationStatus === 'granted'}
        <div class="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
          <div class="flex items-center gap-2 text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-semibold">Notifications activées</span>
          </div>
          <p class="text-gray-300 text-sm mt-2">{notificationMessage}</p>
        </div>
      {:else if notificationStatus === 'denied'}
        <div class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
          <div class="flex items-center gap-2 text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="font-semibold">Notifications désactivées</span>
          </div>
          <p class="text-gray-300 text-sm mt-2">{notificationMessage}</p>
        </div>
      {:else if notificationStatus === 'error'}
        <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <div class="flex items-center gap-2 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-semibold">Erreur</span>
          </div>
          <p class="text-gray-300 text-sm mt-2">{notificationMessage}</p>
        </div>
      {/if}

      <!-- Notification Button -->
      <button
        onclick={requestNotificationPermission}
        disabled={notificationStatus === 'requesting' || notificationStatus === 'granted'}
        class="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition"
      >
        {#if notificationStatus === 'requesting'}
          <span class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Demande en cours...
          </span>
        {:else if notificationStatus === 'granted'}
          ✓ Notifications activées
        {:else}
          Activer les notifications
        {/if}
      </button>
    </div>

    <!-- Camera Section -->
    <div class="bg-surface rounded-2xl p-6 space-y-6">
      <div>
        <h2 class="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Caméra
        </h2>
        <p class="text-gray-400 text-sm mb-4">
          Activez l'accès à la caméra pour scanner les codes QR lors de l'ajout d'amis ou de la connexion depuis un nouvel appareil.
        </p>
      </div>

      <!-- Camera Status -->
      {#if cameraStatus === 'granted'}
        <div class="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
          <div class="flex items-center gap-2 text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-semibold">Accès à la caméra autorisé</span>
          </div>
          <p class="text-gray-300 text-sm mt-2">{cameraMessage}</p>
          {#if cameraAvailable}
            <p class="text-gray-300 text-xs mt-1">✓ Caméra détectée et disponible</p>
          {/if}
        </div>
      {:else if cameraStatus === 'denied'}
        <div class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
          <div class="flex items-center gap-2 text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="font-semibold">Accès à la caméra refusé</span>
          </div>
          <p class="text-gray-300 text-sm mt-2">{cameraMessage}</p>
        </div>
      {:else if cameraStatus === 'error'}
        <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <div class="flex items-center gap-2 text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="font-semibold">Erreur</span>
          </div>
          <p class="text-gray-300 text-sm mt-2">{cameraMessage}</p>
        </div>
      {/if}

      <!-- Camera Button -->
      <button
        onclick={requestCameraPermission}
        disabled={cameraStatus === 'requesting' || cameraStatus === 'granted' || !cameraAvailable}
        class="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition"
      >
        {#if cameraStatus === 'requesting'}
          <span class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Demande en cours...
          </span>
        {:else if cameraStatus === 'granted'}
          ✓ Accès autorisé
        {:else if !cameraAvailable}
          Aucune caméra disponible
        {:else}
          Autoriser l'accès à la caméra
        {/if}
      </button>

      <!-- Info -->
      <div class="text-gray-400 text-xs space-y-2">
        <p>• La caméra est utilisée pour scanner les codes QR</p>
        <p>• Nécessaire pour ajouter des amis ou connecter un nouvel appareil</p>
        <p>• Vous pouvez révoquer l'accès à tout moment dans les paramètres du navigateur</p>
      </div>
    </div>
  </div>
</div>

