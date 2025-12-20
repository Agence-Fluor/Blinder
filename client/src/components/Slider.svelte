<script lang="ts">
  let {
    value = $bindable<number>(),
    min = 0,
    max = 100,
    label = 'Importance',
    unit = ''
  } = $props();

  // Calculate percentage for the progress bar
</script>

<div class="flex flex-col gap-1 mt-2">
  <div class="flex justify-between items-center text-[10px] text-gray-500 uppercase font-medium">
    <span class="text-xs text-gray-500 uppercase font-bold">{label}</span>
    <span>{value}{unit}</span>
  </div>
  <div class="relative w-full h-6 flex items-center">
    <div class="absolute w-full h-1 bg-gray-700 rounded z-0"></div>
    <div 
      class="absolute h-1 bg-primary rounded z-0"
      style="width: {((value - min) / (max - min)) * 100}%"
    ></div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      bind:value={value}
      class="custom-slider-thumb absolute w-full h-0 outline-none z-10 appearance-none"
    />
  </div>
</div>
