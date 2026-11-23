<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let checked = false;
  export let label = '';

  const dispatch = createEventDispatcher<{ change: boolean }>();

  function flip() {
    checked = !checked;
    dispatch('change', checked);
  }
</script>

<button class="toggle" class:on={checked} role="switch" aria-checked={checked} aria-label={label} on:click={flip}>
  <span class="knob"></span>
</button>

<style>
  .toggle {
    position: relative; flex: none; width: 40px; height: 22px; padding: 0;
    border-radius: 999px; border: 1px solid var(--line-strong); background: var(--ink-3);
    transition: background 0.25s var(--ease), border-color 0.25s var(--ease);
  }
  .knob {
    position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%;
    background: var(--muted);
    transition: transform 0.3s var(--ease), background 0.25s var(--ease), width 0.18s var(--ease);
  }
  .toggle:active .knob { width: 20px; }
  .on { background: var(--accent-soft); border-color: var(--accent); }
  .on .knob { transform: translateX(18px); background: var(--accent); }
  .on:active .knob { transform: translateX(14px); }
</style>
