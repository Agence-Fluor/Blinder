<!-- Attachment Picker Component -->
<script lang="ts">
  import { processFile, processGIF, GIF_OPTIONS, type Attachment } from '../services/attachmentService';

  let { onSelect } = $props<{ onSelect: (attachment: Attachment) => void }>();

  let showGIFMenu = $state(false);
  let fileInput: HTMLInputElement | null = null;

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const attachment = await processFile(file);
      onSelect(attachment);
      // Reset input
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors du traitement du fichier');
    }
  }

  async function handleGIFSelect(gif: typeof GIF_OPTIONS[0]) {
    try {
      const attachment = await processGIF(gif.url, gif.label);
      onSelect(attachment);
      showGIFMenu = false;
    } catch (error) {
      console.error('Error processing GIF:', error);
      alert('Erreur lors du chargement du GIF');
    }
  }

  function openFilePicker() {
    fileInput?.click();
  }
</script>

<div class="flex items-center gap-2">
  <!-- File Input (hidden) -->
  <input
    bind:this={fileInput}
    type="file"
    accept="image/*,video/*,audio/*,.pdf"
    onchange={handleFileSelect}
    class="hidden"
  />

  <!-- Attachment Button -->
  <button
    onclick={openFilePicker}
    class="p-2 text-gray-400 hover:text-primary transition"
    title="Joindre un fichier"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  </button>

  <!-- GIF Button -->
  <button
    onclick={() => showGIFMenu = !showGIFMenu}
    class="p-2 text-gray-400 hover:text-primary transition"
    title="Envoyer un GIF"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </button>

  <!-- GIF Menu -->
  {#if showGIFMenu}
    <div class="absolute bottom-16 left-4 bg-surface border border-white/10 rounded-lg p-4 shadow-xl z-50 max-w-xs">
      <h3 class="text-white font-semibold mb-3 text-sm">Choisir un GIF</h3>
      <div class="grid grid-cols-3 gap-2">
        {#each GIF_OPTIONS as gif}
          <button
            onclick={() => handleGIFSelect(gif)}
            class="aspect-square bg-background rounded-lg overflow-hidden hover:scale-105 transition-transform border border-white/10"
            title={gif.label}
          >
            <img src={gif.url} alt={gif.label} class="w-full h-full object-cover" />
          </button>
        {/each}
      </div>
      <button
        onclick={() => showGIFMenu = false}
        class="mt-3 w-full text-gray-400 text-sm hover:text-white transition"
      >
        Fermer
      </button>
    </div>
  {/if}
</div>

