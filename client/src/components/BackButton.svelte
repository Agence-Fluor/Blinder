<script lang="ts">
  let {
    onClick,
    label = "Retour"
  } = $props();
</script>

<div class="fixed top-16 left-6 z-[100]">
  <button
    onclick={onClick}
    class="backdrop-blur-xl bg-white/10 border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-2 text-white hover:bg-white/20 transition-all"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
    <span class="text-sm font-medium">{label}</span>
  </button>
</div>

