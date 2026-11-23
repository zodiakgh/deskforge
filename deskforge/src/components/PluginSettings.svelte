<script lang="ts">
  import type { PluginManifest } from '../lib/types';
  import { settingsWithDefaults } from '../engine/pluginHost';
  import Toggle from './Toggle.svelte';

  export let manifest: PluginManifest;
  export let values: Record<string, unknown> = {};
  export let onChange: (key: string, value: unknown) => void = () => {};

  $: merged = settingsWithDefaults(manifest, values);
</script>

{#if manifest.settings?.length}
  <div class="rows">
    {#each manifest.settings as s}
      <div class="setting">
        <div class="label">{s.label}</div>
        {#if s.type === 'color'}
          <input class="field" type="color" value={String(merged[s.key])} on:input={(e) => onChange(s.key, e.currentTarget.value)} aria-label={s.label} />
        {:else if s.type === 'toggle'}
          <Toggle checked={Boolean(merged[s.key])} label={s.label} on:change={(e) => onChange(s.key, e.detail)} />
        {:else if s.type === 'number'}
          <input class="field" style="width:96px" type="number" min={s.min} max={s.max} step={s.step ?? 1} value={Number(merged[s.key])} on:input={(e) => onChange(s.key, Number(e.currentTarget.value))} aria-label={s.label} />
        {:else if s.type === 'select'}
          <select class="field" value={String(merged[s.key])} on:change={(e) => onChange(s.key, e.currentTarget.value)} aria-label={s.label}>
            {#each s.options as o}<option value={o}>{o}</option>{/each}
          </select>
        {:else}
          <input class="field" type="text" value={String(merged[s.key])} on:input={(e) => onChange(s.key, e.currentTarget.value)} aria-label={s.label} />
        {/if}
      </div>
    {/each}
  </div>
{:else}
  <p class="muted small">This plugin has no settings.</p>
{/if}
