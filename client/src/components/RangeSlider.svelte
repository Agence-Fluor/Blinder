<script lang="ts">
  let {
    label = '',
    minValue = $bindable<number>(20),
    maxValue = $bindable<number>(80),
    min = 18,
    max = 100,
    units = ''
  } = $props();

  const minGap = 5; // Minimum gap between thumbs

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  // Convert percentage to value in min-max range
  const percentToValue = (percent: number) => Math.round(min + ((max - min) * percent) / 100);
  const valueToPercent = (value: number) => ((value - min) / (max - min)) * 100;

  // Drag handler factory
  function makeDragHandler(isMin: boolean) {
    return (e: MouseEvent) => {
      const slider = (e.currentTarget as HTMLElement).parentElement!;
      const onMouseMove = (ev: MouseEvent) => {
        const rect = slider.getBoundingClientRect();
        const percent = ((ev.clientX - rect.left) / rect.width) * 100;

        if (isMin) {
          minValue = clamp(Math.min(percent, maxValue - minGap), 0, 100);
        } else {
          maxValue = clamp(Math.max(percent, minValue + minGap), 0, 100);
        }
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
  }
</script>

<div class="flex flex-col gap-1 mt-2">

  <div class="flex justify-between items-center text-[10px] text-gray-500 uppercase font-medium">
    <span class="text-[10px] text-gray-400 uppercase font-bold mb-1 block">{label}</span>
    <span>{percentToValue(minValue)}{units} - {percentToValue(maxValue)}{units}</span>
  </div>

  <div class="relative w-full h-6 flex items-center">
    <!-- Full track -->
    <div class="absolute w-full h-1 bg-gray-700 rounded z-0"></div>

    <!-- Selected range -->
    <div
      class="absolute h-1 bg-primary rounded z-0"
      style="left: {minValue}%; width: {maxValue - minValue}%"
    ></div>

    <!-- Minimum thumb -->
    <div
      class="slider-thumb absolute top-1/2 transform -translate-y-1/2"
      style="left: {minValue}%;"
      on:mousedown={makeDragHandler(true)}
    ></div>

    <!-- Maximum thumb -->
    <div
      class="slider-thumb absolute top-1/2 transform -translate-y-1/2"
      style="left: {maxValue}%;"
      on:mousedown={makeDragHandler(false)}
    ></div>
  </div>
</div>

<style>
  /* Match your existing .custom-slider-thumb style */
  .slider-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: white;
    border: 0px solid #d16b86;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    margin-top: 0; /* Centered on track */
    z-index: 10;
  }
</style>
