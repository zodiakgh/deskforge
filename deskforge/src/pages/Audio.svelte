<script lang="ts">
  import { open } from '@tauri-apps/plugin-dialog';
  import PageHeader from '../components/PageHeader.svelte';
  import Toggle from '../components/Toggle.svelte';
  import Slider from '../components/Slider.svelte';
  import Segmented from '../components/Segmented.svelte';
  import ColorField from '../components/ColorField.svelte';
  import Icon from '../components/Icon.svelte';
  import { config, mutate, mutateProfile, profile } from '../stores/config';
  import { audioState } from '../stores/audio';
  import { sendAudio } from '../lib/bus';
  import { formatTime, titleFromPath } from '../lib/desktop';
  import { uid } from '../lib/config';
  import type { LoopMode, VisualizerStyle } from '../lib/types';

  $: viz = $profile.visualizer;
  $: current = $config.library.find((t) => t.id === $audioState.trackId);

  async function addFiles() {
    const picked = await open({
      multiple: true,
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'opus'] }]
    });
    if (!picked) return;
    const paths = Array.isArray(picked) ? picked : [picked];
    mutate((c) => {
      for (const path of paths) {
        if (!c.library.some((t) => t.path === path)) c.library.push({ id: uid(), path, title: titleFromPath(path) });
      }
    });
  }

  const removeTrack = (id: string) => mutate((c) => (c.library = c.library.filter((t) => t.id !== id)));
  const nextLoop = (m: LoopMode): LoopMode => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off');
</script>

<PageHeader title="Music" subtitle="Your own files, playing in the background. It keeps going when this window is closed to the tray.">
  <button class="btn primary" on:click={addFiles}><Icon name="plus" size={16} /> Add music</button>
</PageHeader>

<div class="stack">
  <div class="player">
    <div class="now">
      <h2>{current?.title ?? 'Nothing playing'}</h2>
      <span class="muted small">{formatTime($audioState.position)} / {formatTime($audioState.duration)}</span>
    </div>
    <Slider min={0} max={Math.max(1, $audioState.duration)} step={0.5} value={$audioState.position} label="Seek" on:change={(e) => sendAudio({ type: 'seek', position: e.detail })} />
    <div class="row">
      <button class="btn icon ghost" class:on={$config.shuffle} aria-label="Shuffle" aria-pressed={$config.shuffle} on:click={() => mutate((c) => (c.shuffle = !c.shuffle))}><Icon name="shuffle" /></button>
      <span class="spacer"></span>
      <button class="btn icon ghost" aria-label="Previous" on:click={() => sendAudio({ type: 'prev' })}><Icon name="prev" /></button>
      <button class="btn icon primary play" aria-label={$audioState.playing ? 'Pause' : 'Play'} on:click={() => sendAudio({ type: 'toggle' })}>
        <Icon name={$audioState.playing ? 'pause' : 'play'} />
      </button>
      <button class="btn icon ghost" aria-label="Next" on:click={() => sendAudio({ type: 'next' })}><Icon name="next" /></button>
      <span class="spacer"></span>
      <button class="btn ghost loop" class:on={$config.loop !== 'off'} aria-label="Repeat: {$config.loop}" on:click={() => mutate((c) => (c.loop = nextLoop(c.loop)))}>
        <Icon name="repeat" />{#if $config.loop === 'one'}<small>1</small>{/if}
      </button>
    </div>
    <div class="row vol">
      <span class="muted small">Volume</span>
      <Slider min={0} max={1} step={0.01} value={$config.volume} label="Volume" on:change={(e) => mutate((c) => (c.volume = e.detail))} />
    </div>
  </div>

  <section>
    <h2>Library</h2>
    {#if $config.library.length}
      <ul class="tracks">
        {#each $config.library as t (t.id)}
          <li class:active={t.id === $audioState.trackId}>
            <button class="track" on:click={() => sendAudio({ type: 'play', trackId: t.id })}>
              <span class="ico">
                {#if t.id === $audioState.trackId && $audioState.playing}<Icon name="pause" size={14} />{:else}<Icon name="play" size={14} />{/if}
              </span>
              <span class="title">{t.title}</span>
            </button>
            <button class="btn icon ghost" aria-label="Remove {t.title}" on:click={() => removeTrack(t.id)}><Icon name="x" size={15} /></button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted empty">Add mp3, wav, ogg or flac files to build your library.</p>
    {/if}
  </section>

  <section>
    <h2>Visualizer</h2>
    <div class="rows">
      <div class="setting">
        <div class="label"><h3>Show on desktop</h3><p>Reacts to the music playing in Deskforge.</p></div>
        <Toggle label="Show visualizer" checked={viz.enabled} on:change={(e) => mutateProfile((p) => (p.visualizer.enabled = e.detail))} />
      </div>
      <div class="setting">
        <div class="label"><h3>Style</h3></div>
        <Segmented
          options={[{ value: 'bars', label: 'Bars' }, { value: 'wave', label: 'Wave' }, { value: 'circle', label: 'Circle' }, { value: 'particles', label: 'Particles' }]}
          value={viz.style}
          on:change={(e) => mutateProfile((p) => (p.visualizer.style = e.detail as VisualizerStyle))}
        />
      </div>
      <div class="setting">
        <div class="label"><h3>Position</h3></div>
        <Segmented
          options={[{ value: 'bottom', label: 'Bottom' }, { value: 'center', label: 'Center' }, { value: 'full', label: 'Full screen' }]}
          value={viz.position}
          on:change={(e) => mutateProfile((p) => (p.visualizer.position = e.detail as 'bottom' | 'center' | 'full'))}
        />
      </div>
      <div class="setting">
        <div class="label"><h3>Color</h3><p>Leave empty to use your accent color.</p></div>
        <ColorField value={viz.color} allowEmpty placeholder={$config.accent} on:change={(e) => mutateProfile((p) => (p.visualizer.color = e.detail))} />
      </div>
      <div class="setting">
        <div class="label"><h3>Sensitivity</h3></div>
        <div class="ctl"><Slider min={0.4} max={2.5} step={0.05} value={viz.sensitivity} label="Sensitivity" on:change={(e) => mutateProfile((p) => (p.visualizer.sensitivity = e.detail))} /></div>
      </div>
    </div>
  </section>
</div>

<style>
  .player { display: flex; flex-direction: column; gap: 12px; padding: 18px 20px; background: var(--ink-3); border-radius: 14px; }
  .now { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .now h2 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .play { width: 44px; height: 44px; border-radius: 50%; }
  .on { color: var(--accent); }
  .loop small { font-size: 10px; margin-left: -4px; }
  .vol { gap: 14px; } .vol :global(.slider) { max-width: 220px; }
  section { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
  .tracks { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .tracks li { display: flex; align-items: center; gap: 4px; border-bottom: 1px solid var(--line); }
  .track { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 6px; background: transparent; border: 0; text-align: left; border-radius: 8px; transition: background 0.15s var(--ease); }
  .track:hover { background: var(--ink-3); }
  .ico { width: 24px; display: grid; place-items: center; color: var(--muted); }
  .title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  li.active .title, li.active .ico { color: var(--accent); }
  .empty { padding: 18px 0; }
  .ctl { width: 180px; }
</style>
