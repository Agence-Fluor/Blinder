<script lang="ts">
  import QRCode from "qrcode";
  import { generateProfileShareQRCode } from '../services/profileShareService';
  import { userProfile } from '../stores/app';
  import { get } from 'svelte/store';
  
  let { 
    phone = '',
    displayName = ''
  } = $props();
  
  let size = 256;
  let svg = $state('');
  let qrData = $state('');
  
  $effect(async () => {
    // Use provided phone or get from userProfile
    const userPhone = phone || (get(userProfile) as any)?.phone || '';
    const name = displayName || (get(userProfile) as any)?.name || '';
    
    if (userPhone) {
      try {
        const result = await generateProfileShareQRCode(userPhone, name);
        svg = result.qrSvg;
        qrData = result.qrData;
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }
  });
</script>

<div class="flex flex-col items-center p-6">
  <h2 class="text-xl font-bold text-white mb-4">Partager mon profil</h2>
  <p class="text-gray-400 text-sm mb-4 text-center">
    Scannez ce QR code pour ajouter ce contact à votre liste d'amis
  </p>
  
  {#if svg}
    <div class="p-4 bg-white rounded-lg mb-4">
      {@html svg}
    </div>
  {:else}
    <div class="p-8 border-2 border-dashed border-gray-700 rounded-lg">
      <p class="text-gray-400 text-sm">Génération du QR code...</p>
    </div>
  {/if}
  
  {#if displayName}
    <p class="text-gray-400 text-sm mt-2">
      Nom suggéré: <span class="text-primary font-semibold">{displayName}</span>
    </p>
  {/if}
</div>
  