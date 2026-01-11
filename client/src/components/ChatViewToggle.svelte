<!-- Chat View Toggle Component -->
<script lang="ts">
  let { viewMode, onToggle, onNewMessage } = $props<{
    viewMode: 'matched' | 'real';
    onToggle: (mode: 'matched' | 'real') => void;
    onNewMessage: () => void;
  }>();
</script>

<div class="flex items-center justify-between mb-4 px-4">
  <div class="flex items-center gap-2">
    <!-- Eye Closed Button (Matched Contacts) -->
    <button
      onclick={() => onToggle('matched')}
      class={`p-2 rounded-lg transition ${viewMode === 'matched' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
      title="Voir les contacts matchés"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    </button>

    <!-- Eye Open Button (Real Contacts) -->
    <button
      onclick={() => onToggle('real')}
      class={`p-2 rounded-lg transition ${viewMode === 'real' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:text-white'}`}
      title="Voir les vrais contacts"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="transform: rotate(180deg);">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    </button>
  </div>

  <!-- New Message Button -->
  <button
    onclick={onNewMessage}
    class="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition"
    title="Nouveau message"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M12 4v16m8-8H4" />
    </svg>
  </button>
</div>

