<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const {
    label,
    color,
    isActive = true,
    isSelected = false,
    size = 'md'
  } = $props<{
    label: string;
    color: string;
    isActive?: boolean;
    isSelected?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }>();

  const dispatch = createEventDispatcher();

  const sizeClasses = {
    sm: 'w-24 h-24 text-sm',
    md: 'w-32 h-32 text-base',
    lg: 'w-40 h-40 text-lg'
  };
</script>

<div
  on:click={(e) => { e.stopPropagation(); dispatch('click'); }}
  class={`relative cursor-pointer flex items-center justify-center text-center p-4 rounded-full
    ${sizeClasses[size]}
    backdrop-blur-xl border-2 transition-all duration-500 shadow-2xl
    ${isSelected 
      ? `bg-gradient-to-br ${color} border-white text-white shadow-[0_0_30px_rgba(255,255,255,0.4)]`
      : isActive 
        ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
        : 'bg-white/5 border-white/10 text-white/50 opacity-40 grayscale pointer-events-none'}
  `}
>
  <span class="font-semibold drop-shadow-md select-none leading-tight">{label}</span>
  {#if isSelected}
    <div class="absolute -inset-2 rounded-full border border-white/40 animate-pulse pointer-events-none"></div>
  {/if}
</div>
