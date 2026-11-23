<script lang="ts">
  import { onMount } from 'svelte';
  import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
  import { open, save } from '@tauri-apps/plugin-dialog';
  import { invoke } from '@tauri-apps/api/core';
  import PageHeader from '../components/PageHeader.svelte';
  import Toggle from '../components/Toggle.svelte';
  import ColorField from '../components/ColorField.svelte';
  import { config, mutate } from '../stores/config';
  import { plugins } from '../stores/plugins';
  import { defaultConfig } from '../lib/config';
  import type { AppConfig } from '../lib/types';

  const swatches = ['#ffb36b', '#7aa2ff', '#6be3c4', '#ff7a9c', '#c39bff', '#f2e26b'];
  let autostart = false;
  let confirmReset = false;
  let message = '';

  $: themes = $plugins.filter((p) => p.manifest.type === 'theme');

  onMount(async () => {
    try { autostart = await isEnabled(); } catch { /* not in Tauri */ }
  });

  async function toggleAutostart(on: boolean) {
    try { if (on) await enable(); else await disable(); autostart = on; }
    catch (e) { autostart = !on; message = String(e); }
  }

  async function backup() {
    const path = await save({ defaultPath: 'deskforge-backup.json', filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (!path) return;
    try { await invoke('write_text_file', { path, contents: JSON.stringify($config, null, 2) }); message = 'Backup saved.'; }
    catch (e) { message = String(e); }
  }

  async function restore() {
    const path = await open({ multiple: false, filters: [{ name: 'JSON', extensions: ['json'] }] });
    if (typeof path !== 'string') return;
    try {
      const data = JSON.parse(await invoke<string>('read_text_file', { path })) as AppConfig;
      if (data.version !== 1 || !Array.isArray(data.profiles) || !data.profiles.length) throw new Error('This is not a Deskforge backup.');
      config.set({ ...defaultConfig(), ...data });
      message = 'Backup restored.';
    } catch (e) { message = e instanceof Error ? e.message : String(e); }
  }

  function reset() {
    if (!confirmReset) { confirmReset = true; setTimeout(() => (confirmReset = false), 4000); return; }
    config.set(defaultConfig());
    confirmReset = false;
  }
</script>

<PageHeader title="Settings" />

<div class="rows">
  <div class="setting">
    <div class="label"><h3>Accent color</h3><p>Used by the app, shaders, widgets and the visualizer.</p></div>
    <div class="swatches">
      {#each swatches as c}
        <button class="sw" class:sel={$config.accent === c} style="background:{c}" aria-label="Use {c}" on:click={() => mutate((x) => (x.accent = c))}></button>
      {/each}
    </div>
    <ColorField value={$config.accent} on:change={(e) => mutate((x) => (x.accent = e.detail))} />
  </div>

  {#if themes.length}
    <div class="setting">
      <div class="label"><h3>App theme</h3><p>Theme plugins restyle this window.</p></div>
      <select class="field" value={$config.themePluginId} on:change={(e) => mutate((x) => (x.themePluginId = e.currentTarget.value))}>
        <option value="">Default</option>
        {#each themes as t}<option value={t.manifest.id}>{t.manifest.name}</option>{/each}
      </select>
    </div>
  {/if}

  <div class="setting">
    <div class="label"><h3>Start with Windows</h3><p>Launches in the tray and restores your wallpaper.</p></div>
    <Toggle label="Start with Windows" checked={autostart} on:change={(e) => toggleAutostart(e.detail)} />
  </div>

  <div class="setting">
    <div class="label"><h3>Battery saver</h3><p>Lowers the frame rate when your laptop is unplugged.</p></div>
    <Toggle label="Battery saver" checked={$config.batterySaver} on:change={(e) => mutate((x) => (x.batterySaver = e.detail))} />
  </div>

  <div class="setting">
    <div class="label"><h3>Backup</h3><p>Save or restore all profiles, music library and settings.</p></div>
    <button class="btn" on:click={backup}>Export</button>
    <button class="btn" on:click={restore}>Import</button>
  </div>

  <div class="setting">
    <div class="label"><h3>Reset everything</h3><p>Deletes all profiles and settings. Your files are not touched.</p></div>
    <button class="btn danger" on:click={reset}>{confirmReset ? 'Click again to confirm' : 'Reset'}</button>
  </div>
</div>

{#if message}<p class="muted small note">{message}</p>{/if}

<p class="muted small about">Deskforge 0.1.0 · MIT license · github.com/your-name/deskforge</p>

<style>
  .swatches { display: flex; gap: 8px; }
  .sw { width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent; padding: 0; transition: transform 0.2s var(--ease), border-color 0.2s var(--ease); }
  .sw:hover { transform: scale(1.12); }
  .sw.sel { border-color: var(--text); }
  .note { margin-top: 14px; }
  .about { margin-top: 30px; }
</style>
