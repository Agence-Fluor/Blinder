<!-- src/App.svelte -->
<script lang="ts">
	import "./styles.css";
  import 'sv-router/generated';
  import { Router } from 'sv-router';

  import { appInstalled } from "./stores/app"
  import { onMount } from "svelte";
  import InAppNotifications from "./components/InAppNotifications.svelte";

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', reg);
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
            // Handle push notification data
            console.log('Push notification received:', event.data.payload);
            // TODO: Handle login request notification
            // This would trigger the QR code encryption flow on old device
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
  }

  import '@khmyznikov/pwa-install';
  let pwaInstall;
  onMount(() => {
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isInstalled =
      window.navigator.standalone === true ||
      ["fullscreen", "standalone", "minimal-ui"].some(
          (displayMode) => window.matchMedia('(display-mode: ' + displayMode + ')').matches
      );
    if (isMobile && pwaInstall && typeof pwaInstall.showDialog === 'function' && !isInstalled) {
      pwaInstall.showDialog(true);
    }
  })
</script>

<pwa-install 
  manifest-url="/manifest.json" 
  name="Blinder"  
  description="L'amour rend aveugle - pas vos données. Essayez notre application de chat sécurisée et rencontrez de futurs collègues ou votre âme soeur."
  disable-close="true"
  disable-install-description="true"
  disable-chrome="true"
  disable-android-fallback="true"

  bind:this={pwaInstall}
>
</pwa-install>
<Router />
<InAppNotifications />
