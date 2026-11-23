<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import PageHeader from '../components/PageHeader.svelte';
  import Toggle from '../components/Toggle.svelte';
  import Icon from '../components/Icon.svelte';
  import PluginSettings from '../components/PluginSettings.svelte';
  import { config, mutate, mutateProfile } from '../stores/config';
  import { plugins, refreshPlugins } from '../stores/plugins';
  import { route } from '../stores/route';
  import type { PluginInfo } from '../lib/types';

  let openId = '';

  const enabled = (id: string) => Boolean($config.plugins[id]?.enabled);
  const setEnabled = (id: string, on: boolean) =>
    mutate((c) => { c.plugins[id] = { enabled: on, settings: c.plugins[id]?.settings ?? {} }; });
  const setSetting = (id: string, k: string, v: unknown) =>
    mutate((c) => {
      const cur = c.plugins[id] ?? { enabled: true, settings: {} };
      c.plugins[id] = { ...cur, settings: { ...cur.settings, [k]: v } };
    });

  function useAs(p: PluginInfo) {
    setEnabled(p.manifest.id, true);
    if (p.manifest.type === 'wallpaper') {
      mutateProfile((pr) => { pr.wallpaper.kind = 'plugin'; pr.wallpaper.pluginId = p.manifest.id; });
      route.set('wallpaper');
    } else if (p.manifest.type === 'theme') {
      mutate((c) => (c.themePluginId = c.themePluginId === p.manifest.id ? '' : p.manifest.id));
    } else {
      route.set('widgets');
    }
  }

  const actionLabel = (p: PluginInfo) =>
    p.manifest.type === 'wallpaper' ? 'Use as wallpaper' : p.manifest.type === 'theme'
      ? ($config.themePluginId === p.manifest.id ? 'Remove theme' : 'Apply theme') : 'Add on Widgets page';
</script>

<PageHeader title="Plugins" subtitle="Widgets, wallpapers and themes made with HTML, CSS and JavaScript.">
  <button class="btn" on:click={refreshPlugins}>Refresh</button>
  <button class="btn primary" on:click={() => invoke('open_plugins_dir').catch(() => {})}><Icon name="folder" size={16} /> Open plugins folder</button>
</PageHeader>

{#if $plugins.length}
  <ul class="list">
    {#each $plugins as p (p.manifest.id)}
      <li>
        <div class="head">
          <div class="info">
            <div class="row wrap">
              <h3>{p.manifest.name}</h3>
              <span class="chip">{p.manifest.type}</span>
              <span class="chip">v{p.manifest.version}</span>
              {#if p.builtin}<span class="chip accent">Official</span>{/if}
              {#each p.manifest.permissions ?? [] as perm}<span class="chip" title="Permission">{perm}</span>{/each}
            </div>
            {#if p.manifest.description}<p class="muted small">{p.manifest.description}</p>{/if}
            {#if p.manifest.author}<p class="muted small">by {p.manifest.author}</p>{/if}
          </div>
          <div class="row">
            {#if p.manifest.settings?.length}
              <button class="btn ghost" on:click={() => (openId = openId === p.manifest.id ? '' : p.manifest.id)}>Settings</button>
            {/if}
            <button class="btn" on:click={() => useAs(p)}>{actionLabel(p)}</button>
            <Toggle label="Enable {p.manifest.name}" checked={enabled(p.manifest.id)} on:change={(e) => setEnabled(p.manifest.id, e.detail)} />
          </div>
        </div>
        {#if openId === p.manifest.id}
          <div class="settings">
            <PluginSettings manifest={p.manifest} values={$config.plugins[p.manifest.id]?.settings ?? {}} onChange={(k, v) => setSetting(p.manifest.id, k, v)} />
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{:else}
  <p class="muted">No plugins found. Drop a plugin folder into the plugins folder, then press Refresh.</p>
{/if}

<style>
  .list { list-style: none; margin: 0; padding: 0; }
  li { padding: 16px 0; border-bottom: 1px solid var(--line); }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
  .info { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .settings { margin-top: 10px; padding: 0 16px; background: var(--ink-3); border-radius: 12px; max-width: 520px; }
</style>
