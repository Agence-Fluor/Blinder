<!-- QR Code Scanner Component with Camera -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  let { 
    onScan,
    onError = () => {}
  } = $props();

  let scanner: any = null;
  let scanning = $state(false);
  let errorMessage = $state('');
  let cameraAvailable = $state(false);
  let manualInput = $state('');
  let showManualInput = $state(false);

  // Check camera availability
  async function checkCameraAvailability(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
      return false;
    }
  }

  async function initScanner() {
    try {
      // Check if camera is available
      cameraAvailable = await checkCameraAvailability();
      
      if (!cameraAvailable) {
        errorMessage = 'Aucune caméra disponible';
        showManualInput = true;
        return;
      }

      // Dynamic import to avoid build issues
      const { Html5Qrcode } = await import('html5-qrcode');
      scanner = new Html5Qrcode('qr-reader');
      
      // Try to start scanning
      await startScanning();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Erreur lors de l\'initialisation du scanner';
      errorMessage = errMsg;
      onError(errMsg);
      showManualInput = true;
    }
  }

  async function startScanning() {
    if (!scanner || scanning) return;

    try {
      // Try back camera first (mobile), then front camera
      const facingMode = { facingMode: 'environment' };
      
      await scanner.start(
        facingMode,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          // Success callback
          onScan(decodedText);
          stopScanning();
        },
        (errorMessage: string) => {
          // Error callback (ignore most errors, they're just scanning attempts)
          // Only log if it's a real error
          if (errorMessage && !errorMessage.includes('NotFoundException')) {
            console.debug('QR scan attempt:', errorMessage);
          }
        }
      );
      
      scanning = true;
      errorMessage = '';
    } catch (error: any) {
      // If back camera fails, try front camera
      if (error && error.message && error.message.includes('environment')) {
        try {
          await scanner.start(
            { facingMode: 'user' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText: string) => {
              onScan(decodedText);
              stopScanning();
            },
            () => {}
          );
          scanning = true;
          errorMessage = '';
        } catch (frontError) {
          const errMsg = frontError instanceof Error ? frontError.message : 'Impossible d\'accéder à la caméra';
          errorMessage = errMsg;
          onError(errMsg);
          showManualInput = true;
        }
      } else {
        const errMsg = error instanceof Error ? error.message : 'Impossible de démarrer le scanner';
        errorMessage = errMsg;
        onError(errMsg);
        showManualInput = true;
      }
    }
  }

  async function stopScanning() {
    if (scanner && scanning) {
      try {
        await scanner.stop();
        scanning = false;
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  }

  function handleManualSubmit() {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      manualInput = '';
    }
  }

  function requestCameraPermission() {
    // Request camera permission by trying to access it
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        // Permission granted, stop the stream and start scanning
        stream.getTracks().forEach(track => track.stop());
        startScanning();
      })
      .catch((error) => {
        errorMessage = 'Permission caméra refusée. Utilisez la saisie manuelle.';
        showManualInput = true;
      });
  }

  onMount(() => {
    initScanner();
  });

  onDestroy(async () => {
    await stopScanning();
    if (scanner) {
      try {
        scanner.clear();
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });
</script>

<div class="flex flex-col items-center w-full">
  {#if scanning}
    <!-- Camera view -->
    <div id="qr-reader" class="w-full max-w-sm rounded-lg overflow-hidden border-2 border-primary"></div>
    
    <button
      onclick={stopScanning}
      class="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-full transition"
    >
      Arrêter le scan
    </button>
  {:else if errorMessage && !cameraAvailable}
    <!-- No camera available -->
    <div class="w-full max-w-sm p-8 border-2 border-dashed border-gray-700 rounded-lg text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      <p class="text-gray-400 text-sm mb-2">Aucune caméra disponible</p>
      <p class="text-gray-500 text-xs">Utilisez la saisie manuelle ci-dessous</p>
    </div>
  {:else if errorMessage}
    <!-- Camera error -->
    <div class="w-full max-w-sm p-8 border-2 border-dashed border-yellow-700 rounded-lg text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-yellow-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p class="text-yellow-400 text-sm mb-2">{errorMessage}</p>
      <button
        onclick={requestCameraPermission}
        class="mt-4 bg-primary text-white px-4 py-2 rounded-full text-sm"
      >
        Réessayer
      </button>
    </div>
  {:else}
    <!-- Initializing -->
    <div class="w-full max-w-sm p-8 border-2 border-dashed border-gray-700 rounded-lg text-center">
      <div class="animate-spin h-12 w-12 mx-auto text-primary mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <p class="text-gray-400 text-sm">Initialisation de la caméra...</p>
    </div>
  {/if}

  <!-- Manual input fallback (always available) -->
  <div class="mt-6 w-full max-w-sm">
    <button
      onclick={() => showManualInput = !showManualInput}
      class="w-full text-gray-400 text-sm underline hover:text-gray-300 transition mb-2"
    >
      {showManualInput ? 'Masquer' : 'Saisir le code manuellement'}
    </button>
    
    {#if showManualInput}
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={manualInput}
          onkeydown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
          placeholder="Code QR ou texte"
          class="flex-1 px-4 py-2 border border-gray-700 rounded-lg bg-surface text-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onclick={handleManualSubmit}
          disabled={!manualInput.trim()}
          class="bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Valider
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  #qr-reader {
    min-height: 300px;
  }
  
  #qr-reader video {
    width: 100%;
    height: auto;
  }
</style>
