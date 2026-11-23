<script lang="ts">
  import { open, save } from '@tauri-apps/plugin-dialog';
  import { invoke } from '@tauri-apps/api/core';
  import PageHeader from '../components/PageHeader.svelte';
  import Icon from '../components/Icon.svelte';
  import { config, mutate } from '../stores/config';
  import { clone, makeProfile, uid } from '../lib/config';
  import type { Profile } from '../lib/types';

  let message = '';
  const say = (m: string) => { message = m; setTimeout(() => (message = ''), 4000); };

  const activate = (id: string) => mutate((c) => (c.activeProfileId = id));
  const rename = (id: string, name: string) => mutate((c) => { const p = c.profiles.find((x) => x.id === id); if (p) p.name = name.trim() || p.name; });

  function create() {
    const p = makeProfile(`Profile ${$config.profiles.length + 1}`);
    mutate((c) => { c.profiles.push(p); c.activeProfileId = p.id; });
  }

  function duplicate(p: Profile) {
    const copy = { ...clone(p), id: uid(), name: `${p.name} copy` };
    copy.widgets = copy.widgets.map((w) => ({ ...w, id: uid() }));
    mutate((c) => { c.profiles.push(copy); c.activeProfileId = copy.id; });
  }

  function remove(id: string) {
    mutate((c) => {
      if (c.profiles.length < 2) return;
      c.profiles = c.profiles.filter((p) => p.id !== id);
      if (c.activeProfileId === id) c.activeProfileId = c.profiles[0].id;
    });
  }

  async function exportProfile(p: Profile) {
    const path = await save({ defaultPath: `${p.name}.deskforge`, filters: [{ name: 'Deskforge theme', extensions: ['deskforge'] }] });
    if (!path) return;
    try {
      await invoke('write_text_file', { path, contents: JSON.stringify({ deskforge: 1, profile: p }, null, 2) });
      say('Theme exported.');
    } catch (e) { say(String(e)); }
  }

  async function importProfile() {
    const path = await open({ multiple: false, filters: [{ name: 'Deskforge theme', extensions: ['deskforge', 'json'] }] });
    if (typeof path !== 'string') return;
    try {
      const data = JSON.parse(await invoke<string>('read_text_file', { path }));
      const p = data.profile as Profile;
      if (!p?.wallpaper || !Array.isArray(p.widgets) || !p.visualizer) throw new Error('This file is not a Deskforge theme.');
      p.id = uid();
      p.widgets = p.widgets.map((w) => ({ ...w, id: uid() }));
      p.wallpaper.enabled = false;
      mutate((c) => { c.profiles.push(p); c.activeProfileId = p.id; });
      say(`Imported "${p.name}". Check that its wallpaper file exists on this PC.`);
    } catch (e) { say(e instanceof Error ? e.message : String(e)); }
  }
</script>

<PageHeader title="Profiles" subtitle="One profile per mood: wallpaper, widgets and visualizer together.">
  <button class="btn" on:click={importProfile}><Icon name="download" size={16} /> Import</button>
  <button class="btn primary" on:click={create}><Icon name="plus" size={16} /> New profile</button>
</PageHeader>

<ul class="list">
  {#each $config.profiles as p (p.id)}
    <li class:active={p.id === $config.activeProfileId}>
      <input class="field name" value={p.name} aria-label="Profile name" on:change={(e) => rename(p.id, e.currentTarget.value)} />
      <span class="muted small meta">{p.widgets.length} widgets · {p.wallpaper.kind}</span>
      <span class="spacer"></span>
      {#if p.id === $config.activeProfileId}
        <span class="chip accent">Active</span>
      {:else}
        <button class="btn" on:click={() => activate(p.id)}>Use</button>
      {/if}
      <button class="btn icon ghost" aria-label="Duplicate" on:click={() => duplicate(p)}><Icon name="copy" size={16} /></button>
      <button class="btn icon ghost" aria-label="Export" on:click={() => exportProfile(p)}><Icon name="upload" size={16} /></button>
      <button class="btn icon ghost danger" aria-label="Delete" disabled={$config.profiles.length < 2} on:click={() => remove(p.id)}><Icon name="trash" size={16} /></button>
    </li>
  {/each}
</ul>

{#if message}<p class="muted small note">{message}</p>{/if}

<style>
  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  li { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--line); }
  .name { width: 220px; background: transparent; border-color: transparent; font-weight: 600; }
  .name:hover { border-color: var(--line-strong); }
  li.active .name { color: var(--accent); }
  .note { margin-top: 14px; }
</style>
