<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let options: { value: string; label: string }[] = [];
  export let value = '';

  const dispatch = createEventDispatcher<{ change: string }>();
  $: index = Math.max(0, options.findIndex((o) => o.value === value));

  function pick(v: string) {
    value = v;
    dispatch('change', v);
  }
</script>

<div class="seg" role="radiogroup" style="--n:{options.length}; --i:{index}">
  <span class="thumb" aria-hidden="true"></span>
  {#each options as o}
    <button role="radio" aria-checked={value === o.value} class:active={value === o.value} on:click={() => pick(o.value)}>
      {o.label}
    </button>
  {/each}
</div>

<style>
  .seg {
    position: relative; display: inline-grid; grid-template-columns: repeat(var(--n), 1fr);
    padding: 3px; background: var(--ink); border: 1px solid var(--line-strong); border-radius: 10px;
  }
  .thumb {
    position: absolute; top: 3px; bottom: 3px; left: 3px;
    width: calc((100% - 6px) / var(--n));
    background: var(--ink-4); border-radius: 7px;
    transform: translateX(calc(var(--i) * 100%));
    transition: transform 0.32s var(--ease);
  }
  button {
    position: relative; z-index: 1; height: 28px; padding: 0 14px; border: 0; background: transparent;
    color: var(--muted); border-radius: 7px; white-space: nowrap; transition: color 0.2s var(--ease);
  }
  button.active { color: var(--text); }
</style>
