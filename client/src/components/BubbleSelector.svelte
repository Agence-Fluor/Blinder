<script lang="ts">
  import { flip } from "svelte/animate";
  import Bubble from "./Bubble.svelte";
  import { BUBBLE_DATA } from "../bubble_data";
  import type { BubbleItem } from "../types";
  import BackButton from "./BackButton.svelte";
  import { onMount, onDestroy } from "svelte";

  let {
      onComplete,
      title = "Vos Passions",
      subtitle = "Sélectionnez au moins 3 intérêts.",
      initialSelectedIds = [],
      onBack
  } = $props();

  function handleBack() {
    if (onBack) {
      onBack();
    } else if (typeof onComplete === 'function') {
      onComplete([]);
    }
  }

  // Prevent body scroll when modal is open
  onMount(() => {
    document.body.style.overflow = 'hidden';
  });

  onDestroy(() => {
    document.body.style.overflow = '';
  });


  const descendantCache = new Map<string, string[]>();

  //const onFinish = $props<function<>>()m

  function getDescendants(bubble: BubbleItem): string[] {
    if (descendantCache.has(bubble.id)) return descendantCache.get(bubble.id)!;
    const ids: string[] = [];
    if (bubble.children) {
      for (const child of bubble.children) {
        ids.push(child.id, ...getDescendants(child));
      }
    }
    descendantCache.set(bubble.id, ids);
    return ids;
  }

  function buildLabelMap(items: BubbleItem[]) {
    const map = new Map<string, string>();
    function walk(nodes: BubbleItem[]) {
      for (const n of nodes) {
        map.set(n.id, n.label);
        if (n.children) walk(n.children);
      }
    }
    walk(items);
    return map;
  }

  // ---------------------- Reactive state ----------------------
  let selectedIds = $state([...initialSelectedIds]);
  let activePath = $state([]);
  let labelMap = $state(new Map());
  let levels = $state([]);

  // Update selectedIds when initialSelectedIds changes
  $effect(() => {
    selectedIds = [...initialSelectedIds];
  });

  // ---------------------- Initialize labelMap ----------------------
  $effect(() => {
    labelMap = buildLabelMap(BUBBLE_DATA);
  });

  // ---------------------- Compute levels ----------------------
  $effect(() => {
    const result: BubbleItem[][] = [BUBBLE_DATA];
    for (let i = 0; i < activePath.length; i++) {
      const parent = result[i]?.find((b) => b.id === activePath[i]);
      if (!parent?.children) break;
      result.push(parent.children);
    }
    levels = result;
  });

  // ---------------------- Handlers ----------------------
  function handleBubbleClick(bubble: BubbleItem, depth: number) {
    const isSelected = selectedIds.includes(bubble.id);
    const isActiveHere = activePath[depth] === bubble.id;

    // Update selection
    if (isSelected && isActiveHere) {
      const descendants = getDescendants(bubble);
      selectedIds = selectedIds.filter(
        (id) => id !== bubble.id && !descendants.includes(id)
      );
    } else if (!isSelected) {
      selectedIds = [...selectedIds, bubble.id];
    }

    // Update active path
    if (isSelected && isActiveHere) {
      activePath = activePath.slice(0, depth);
    } else {
      activePath = [...activePath.slice(0, depth), bubble.id];
    }
  }

  function resetSelection() {
    selectedIds = [];
    activePath = [];
  }
</script>

<div class="fixed inset-0 flex flex-col bg-background z-[100]" style="height: 100vh; height: 100dvh;">
  <!-- Back Button -->
  <BackButton onClick={handleBack} />
  
  <!-- Progress Bar Overlay (for onboarding) -->
  <slot name="progress" />

  <!-- Scrollable Content Area -->
  <div class="flex-1 overflow-y-auto pt-24 px-4" style="padding-bottom: calc(64px + 120px + 32px);">
    <!-- Title and Subtitle (scrollable) -->
    <div class="flex flex-col items-center justify-center py-6 px-6 mb-8">
      <h2 class="text-2xl font-bold text-primary mb-2">{title}</h2>
      <p class="text-gray-400 text-sm text-center max-w-md">{subtitle}</p>
    </div>

    <!-- Bubbles -->
    {#each levels as levelBubbles, levelIndex (levelIndex)}
      <div class="flex flex-wrap justify-center gap-6 mb-12" animate:flip>
        {#each levelBubbles as bubble (bubble.id)}
            <Bubble
                label={bubble.label}
                color={bubble.color}
                isSelected={selectedIds.includes(bubble.id)}
                isActive={true}
                size={levelIndex === 0 ? 'lg' : levelIndex === 1 ? 'md' : 'sm'}
                on:click={() => handleBubbleClick(bubble, levelIndex)}
            />

        {/each}
      </div>
    {/each}
  </div>

  <!-- Bottom Rectangle (no bar) -->
  <div class="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-[101]">
    <div class="backdrop-blur-xl bg-white/10 border border-white/20 p-6 rounded-3xl flex justify-between items-center gap-4">
      <div class="flex-1">
        <h3 class="text-xs uppercase text-white/40 mb-1">Sélections</h3>
        <div class="flex flex-wrap gap-2">
          {#if selectedIds.length === 0}
            <span class="text-white/30 text-sm">Aucune</span>
          {:else}
            {#each selectedIds as id}
              <span class="text-xs font-bold px-3 py-1 bg-white/20 rounded-full text-white">
                {labelMap.get(id)}
              </span>
            {/each}
          {/if}
        </div>
      </div>
      <div class="flex gap-3 items-center">
        <button onclick={resetSelection} class="text-xs text-white/40 hover:text-white underline transition-colors">
          Réinitialiser
        </button>
        <button
          onclick={() => { 
            if (typeof onComplete === 'function') {
              onComplete(selectedIds);
            }
          }}
          disabled={selectedIds.length === 0}
          class="px-6 py-3 rounded-xl font-bold transition-all {selectedIds.length > 0 ? 'bg-primary text-white hover:bg-primary/90' : 'bg-white/5 text-white/20 cursor-not-allowed'}"
        >
          Confirmer ({selectedIds.length})
        </button>
      </div>
    </div>
  </div>
</div>
