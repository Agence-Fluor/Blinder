<script lang="ts">
  import Bubble from "./Bubble.svelte";
  import { BUBBLE_DATA } from "../bubble_data";
  import type { BubbleItem } from "../types";

  let {
    selectedIds = $bindable([])
  } = $props();

  function buildLabelMap(items: BubbleItem[]) {
    const map = new Map<string, { label: string; color: string }>();
    function walk(nodes: BubbleItem[]) {
      for (const n of nodes) {
        map.set(n.id, { label: n.label, color: n.color });
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

<div class="flex flex-wrap justify-center gap-3">
  {#each selectedIds as id}
    {@const bubbleInfo = labelMap.get(id)}
    {#if bubbleInfo}
      <Bubble
        label={bubbleInfo.label}
        color={bubbleInfo.color}
        isSelected={true}
        isActive={true}
        size="sm"
      />
    {/if}
  {/each}
</div>

