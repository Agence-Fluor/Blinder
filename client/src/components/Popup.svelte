<script>
  let { open = $bindable() } = $props();


  let closeOnBackdrop = $state(true);
  let closeOnEsc = $state(true);

  function close() {
    open = false;
  }

  function onKey(e) {
    if (closeOnEsc && e.key === "Escape") {
      close();
    }
  }
</script>

{#if open}
  <div
    class="popup-backdrop"
    tabindex="-1"
    on:click={() => closeOnBackdrop && close()}
    on:keydown={onKey}
  >
    <div class="popup-content" on:click|stopPropagation>
      <slot {close} />
    </div>
  </div>
{/if}

<style>
  .popup-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    display: grid;
    place-items: center;
    z-index: 1000;
  }

  .popup-content {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    min-width: 280px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
  }
</style>
