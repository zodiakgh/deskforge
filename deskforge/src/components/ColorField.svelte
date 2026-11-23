<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value = '#ffb36b';
  export let allowEmpty = false;
  export let placeholder = '';

  const dispatch = createEventDispatcher<{ change: string }>();

  function set(v: string) {
    value = v;
    dispatch('change', v);
  }

  function commit(e: Event & { currentTarget: HTMLInputElement }) {
    const v = e.currentTarget.value.trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) set(v);
    else if (allowEmpty && v === '') set('');
    else e.currentTarget.value = value;
  }
</script>

<div class="color">
  <input class="field" type="color" value={value || placeholder || '#ffb36b'} on:input={(e) => set(e.currentTarget.value)} aria-label="Color" />
  <input class="field hex" type="text" {value} placeholder={placeholder || '#rrggbb'} maxlength="7" on:change={commit} aria-label="Hex color" />
</div>

<style>
  .color { display: inline-flex; gap: 8px; }
  .hex { width: 92px; }
</style>
