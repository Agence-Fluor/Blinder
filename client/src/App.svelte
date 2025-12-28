<!-- src/App.svelte -->
<script lang="ts">
	import "./styles.css";
  import 'sv-router/generated';
  import { Router } from 'sv-router';

  import { appInstalled } from "./stores/app"
  import { onMount } from "svelte";

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      let reg = await navigator.serviceWorker.register('/sw.js')
    });
  }

  import '@khmyznikov/pwa-install';

    
  const _eventDispatcher = (_element: Element, name: string, message: string) => {
      const event  = new CustomEvent(name, {
          detail: {
            message
          }
      });
      console.log("dispatched")
      _element.dispatchEvent(event);
  }

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
