<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value = 0;
  export let min = 0;
  export let max = 100;
  export let step = 1;
  export let label = '';

  const dispatch = createEventDispatcher<{ change: number }>();
  $: pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  function onInput(e: Event & { currentTarget: HTMLInputElement }) {
    value = Number(e.currentTarget.value);
    dispatch('change', value);
  }
</script>

<input class="slider" type="range" {min} {max} {step} {value} aria-label={label} on:input={onInput} style="--p:{pct}%" />

<style>
  .slider {
    -webkit-appearance: none; appearance: none; width: 100%; height: 18px; margin: 0;
    background: transparent; cursor: pointer;
  }
  .slider::-webkit-slider-runnable-track {
    height: 4px; border-radius: 4px;
    background: linear-gradient(to right, var(--accent) var(--p), var(--ink-4) var(--p));
  }
  .slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 14px; height: 14px; margin-top: -5px; border-radius: 50%;
    background: var(--text); border: 0; box-shadow: 0 0 0 0 var(--accent-soft);
    transition: transform 0.18s var(--ease), box-shadow 0.18s var(--ease);
  }
  .slider:hover::-webkit-slider-thumb { transform: scale(1.15); }
  .slider:active::-webkit-slider-thumb { transform: scale(1.25); box-shadow: 0 0 0 6px var(--accent-soft); }
</style>
