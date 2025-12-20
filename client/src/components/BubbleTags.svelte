<script lang="ts">
  import { BUBBLE_DATA } from "../bubble_data";
  import type { BubbleItem } from "../types";

  let {
    selectedIds = []
  } = $props();

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

  let labelMap = $state(new Map());
  
  $effect(() => {
    labelMap = buildLabelMap(BUBBLE_DATA);
  });
</script>

<div class="flex flex-wrap gap-2 justify-center">
  {#if selectedIds.length === 0}
    <span class="text-white/30 text-sm">Aucune</span>
  {:else}
    {#each selectedIds as id}
      <span class="text-xs font-bold px-3 py-1 bg-white/20 rounded-full text-white">
        {labelMap.get(id) || id}
      </span>
    {/each}
  {/if}
</div>

