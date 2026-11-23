<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import PageHeader from '../components/PageHeader.svelte';
  import Toggle from '../components/Toggle.svelte';
  import Segmented from '../components/Segmented.svelte';
  import Icon from '../components/Icon.svelte';
  import { mutate, mutateProfile, profile } from '../stores/config';
  import { plugins } from '../stores/plugins';
  import { SHADERS } from '../engine/shaders';
  import { fileName } from '../lib/desktop';
  import type { WallpaperKind } from '../lib/types';

  const kinds = [
    { value: 'shader', label: 'Shader' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'html', label: 'Web page' },
    { value: 'plugin', label: 'Plugin' },
    { value: 'none', label: 'Plain' }
  ];

  const filters: Record<string, { name: string; extensions: string[] }> = {
    image: { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'] },
    video: { name: 'Videos', extensions: ['mp4', 'webm', 'mov', 'm4v'] },
    html: { name: 'Web pages', extensions: ['html', 'htm'] }
  };

  const thumbs: Record<string, string> = {
    aurora: 'radial-gradient(120% 90% at 20% 110%, var(--accent), transparent 60%), linear-gradient(180deg,#0a0d22,#142046)',
    plasma: 'conic-gradient(from 210deg at 50% 50%, #1a1038, var(--accent), #1a1038, #2b3f8a, #1a1038)',
    grid: 'repeating-linear-gradient(90deg, transparent 0 14px, color-mix(in srgb, var(--accent) 55%, transparent) 14px 15px) bottom/100% 52% no-repeat, linear-gradient(180deg,#0a0a1c,#1d1238)'
  };

  $: wp = $profile.wallpaper;
  $: wallpaperPlugins = $plugins.filter((p) => p.manifest.type === 'wallpaper');

  async function browse() {
    const filter = filters[wp.kind];
    if (!filter) return;
    const picked = await open({ multiple: false, filters: [filter] });
    if (typeof picked === 'string') mutateProfile((p) => (p.wallpaper.path = picked));
  }

  function enablePlugin(id: string) {
    mutate((c) => {
      c.plugins[id] = { enabled: true, settings: c.plugins[id]?.settings ?? {} };
    });
    mutateProfile((p) => (p.wallpaper.pluginId = id));
  }
</script>

<PageHeader title="Wallpaper" subtitle="Choose what plays behind your desktop icons.">
  <span class="muted small">Show on desktop</span>
  <Toggle label="Show on desktop" checked={wp.enabled} on:change={(e) => mutateProfile((p) => (p.wallpaper.enabled = e.detail))} />
</PageHeader>

<div class="stack">
  <Segmented options={kinds} value={wp.kind} on:change={(e) => mutateProfile((p) => (p.wallpaper.kind = e.detail as WallpaperKind))} />

  {#if wp.kind === 'shader'}
    <div class="grid">
      {#each SHADERS as s}
        <button class="thumb" class:sel={wp.shaderId === s.id} on:click={() => mutateProfile((p) => (p.wallpaper.shaderId = s.id))}>
          <span class="art" style="background:{thumbs[s.id]}"></span>
          <span class="name">{s.name}</span>
        </button>
      {/each}
    </div>
    <p class="muted small">Shaders react to your music and use your accent color.</p>
  {:else if wp.kind === 'image' || wp.kind === 'video' || wp.kind === 'html'}
    <div class="setting">
      <div class="label">
        <h3>{wp.path ? fileName(wp.path) : 'No file selected'}</h3>
        <p>{wp.kind === 'html' ? 'A local web page, shown in a sandbox.' : wp.kind === 'video' ? 'Looped and muted. mp4 or webm work best.' : 'PNG, JPG, WebP or GIF.'}</p>
      </div>
      <button class="btn" on:click={browse}><Icon name="folder" size={16} /> Browse</button>
    </div>
    {#if wp.kind !== 'html'}
      <div class="setting">
        <div class="label"><h3>Fit</h3><p>Cover fills the screen. Contain shows the whole picture.</p></div>
        <Segmented
          options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }]}
          value={wp.fit}
          on:change={(e) => mutateProfile((p) => (p.wallpaper.fit = e.detail === 'contain' ? 'contain' : 'cover'))}
        />
      </div>
    {/if}
  {:else if wp.kind === 'plugin'}
    {#if wallpaperPlugins.length}
      <div class="grid">
        {#each wallpaperPlugins as p}
          <button class="thumb" class:sel={wp.pluginId === p.manifest.id} on:click={() => enablePlugin(p.manifest.id)}>
            <span class="art" style="background:linear-gradient(160deg,#0a0d22,var(--ink-4))"><Icon name="plugins" size={26} /></span>
            <span class="name">{p.manifest.name}</span>
          </button>
        {/each}
      </div>
    {:else}
      <p class="muted">No wallpaper plugins installed. Open the Plugins page to add some.</p>
    {/if}
  {:else}
    <p class="muted">A plain gradient. Widgets and the visualizer still show on top.</p>
  {/if}

  <div class="rows">
    <div class="setting">
      <div class="label">
        <h3>Pause when an app is full screen</h3>
        <p>Saves CPU and GPU while you game or watch a video.</p>
      </div>
      <Toggle label="Pause when full screen" checked={wp.pauseOnFullscreen} on:change={(e) => mutateProfile((p) => (p.wallpaper.pauseOnFullscreen = e.detail))} />
    </div>
  </div>
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; }
  .thumb {
    padding: 0; border: 1px solid var(--line); border-radius: 14px; background: var(--ink-3); overflow: hidden; text-align: left;
    transition: transform 0.25s var(--ease), border-color 0.2s var(--ease);
  }
  .thumb:hover { transform: translateY(-2px); border-color: var(--line-strong); }
  .thumb.sel { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
  .art { display: grid; place-items: center; height: 110px; color: var(--muted); }
  .name { display: block; padding: 10px 14px; font-weight: 600; }
</style>
