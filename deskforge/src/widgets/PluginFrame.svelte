<script lang="ts">
  import { onMount } from 'svelte';
  import type { PluginInfo } from '../lib/types';
  import { mountPlugin, notifySettings } from '../engine/pluginHost';

  export let info: PluginInfo;
  export let values: Record<string, unknown> = {};
  export let live = true;

  let iframe: HTMLIFrameElement;
  let ready = false;

  onMount(() => {
    if (!live) return;
    let unmount: (() => void) | undefined;
    let cancelled = false;
    mountPlugin(iframe, info, () => values)
      .then((u) => {
        if (cancelled) u();
        else { unmount = u; ready = true; }
      })
      .catch((e) => console.warn(`Could not load plugin ${info.manifest.id}`, e));
    return () => {
      cancelled = true;
      unmount?.();
    };
  });

  // Push live setting changes into the running plugin.
  $: if (ready) { values; notifySettings(info.manifest.id); }
</script>

{#if live}
  <iframe bind:this={iframe} title={info.manifest.name} sandbox="allow-scripts"></iframe>
{:else}
  <div class="placeholder">{info.manifest.name}</div>
{/if}

<style>
  iframe { width: 100%; height: 100%; border: 0; background: transparent; display: block; color-scheme: normal; }
  .placeholder { display: grid; place-items: center; height: 100%; color: var(--muted); font-size: min(12cqh, 5cqw); }
</style>
