<script lang="ts">
  import PageHeader from '../components/PageHeader.svelte';
  import Toggle from '../components/Toggle.svelte';
  import Slider from '../components/Slider.svelte';
  import ColorField from '../components/ColorField.svelte';
  import Icon from '../components/Icon.svelte';
  import PluginSettings from '../components/PluginSettings.svelte';
  import WidgetView from '../widgets/WidgetView.svelte';
  import { config, mutate, mutateProfile, profile } from '../stores/config';
  import { audioState } from '../stores/audio';
  import { plugins } from '../stores/plugins';
  import { makeWidget, uid } from '../lib/config';
  import type { WidgetInstance, WidgetType } from '../lib/types';

  const types: { type: Exclude<WidgetType, 'plugin'>; label: string }[] = [
    { type: 'clock', label: 'Clock' },
    { type: 'date', label: 'Date' },
    { type: 'system', label: 'System' },
    { type: 'music', label: 'Now playing' },
    { type: 'weather', label: 'Weather' },
    { type: 'countdown', label: 'Countdown' },
    { type: 'notes', label: 'Notes' }
  ];

  let canvas: HTMLDivElement;
  let selectedId: string | null = null;
  let snap = true;
  let drag: { id: string; mode: 'move' | 'resize'; sx: number; sy: number; w: WidgetInstance; box: DOMRect } | null = null;

  $: widgets = $profile.widgets;
  $: selected = widgets.find((w) => w.id === selectedId) ?? null;
  $: widgetPlugins = $plugins.filter((p) => p.manifest.type === 'widget');
  $: selectedPlugin = selected?.type === 'plugin' ? $plugins.find((p) => p.manifest.id === selected!.pluginId) : undefined;

  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  const grid = (v: number) => (snap ? Math.round(v / 2.5) * 2.5 : v);

  function add(type: Exclude<WidgetType, 'plugin'>) {
    const n = widgets.length % 6;
    const w = makeWidget(type, 8 + n * 4, 10 + n * 6);
    mutateProfile((p) => p.widgets.push(w));
    selectedId = w.id;
  }

  function addPlugin(id: string) {
    const info = $plugins.find((p) => p.manifest.id === id);
    if (!info) return;
    mutate((c) => {
      c.plugins[id] = { enabled: true, settings: c.plugins[id]?.settings ?? {} };
    });
    const n = widgets.length % 6;
    const w: WidgetInstance = {
      id: uid(), type: 'plugin', pluginId: id,
      x: 8 + n * 4, y: 10 + n * 6, w: info.manifest.size?.w ?? 22, h: info.manifest.size?.h ?? 22,
      bg: 0, blur: 0, accent: '', settings: {}
    };
    mutateProfile((p) => p.widgets.push(w));
    selectedId = w.id;
  }

  function remove(id: string) {
    mutateProfile((p) => (p.widgets = p.widgets.filter((w) => w.id !== id)));
    selectedId = null;
  }

  function down(e: PointerEvent, w: WidgetInstance, mode: 'move' | 'resize') {
    e.preventDefault();
    e.stopPropagation();
    selectedId = w.id;
    drag = { id: w.id, mode, sx: e.clientX, sy: e.clientY, w: { ...w }, box: canvas.getBoundingClientRect() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function move(e: PointerEvent) {
    if (!drag) return;
    const d = drag;
    const dx = ((e.clientX - d.sx) / d.box.width) * 100;
    const dy = ((e.clientY - d.sy) / d.box.height) * 100;
    mutateProfile((p) => {
      const w = p.widgets.find((x) => x.id === d.id);
      if (!w) return;
      if (d.mode === 'move') {
        w.x = clamp(grid(d.w.x + dx), 0, 100 - w.w);
        w.y = clamp(grid(d.w.y + dy), 0, 100 - w.h);
      } else {
        w.w = clamp(grid(d.w.w + dx), 6, 100 - w.x);
        w.h = clamp(grid(d.w.h + dy), 5, 100 - w.y);
      }
    });
  }

  const up = () => (drag = null);

  function setSetting(key: string, value: unknown) {
    if (!selectedId) return;
    mutateProfile((p) => {
      const w = p.widgets.find((x) => x.id === selectedId);
      if (w) w.settings = { ...w.settings, [key]: value };
    });
  }

  function patch(fn: (w: WidgetInstance) => void) {
    if (!selectedId) return;
    mutateProfile((p) => {
      const w = p.widgets.find((x) => x.id === selectedId);
      if (w) fn(w);
    });
  }
</script>

<PageHeader title="Widgets" subtitle="Drag widgets where you want them. Resize from the corner.">
  <span class="muted small">Snap to grid</span>
  <Toggle label="Snap to grid" bind:checked={snap} />
</PageHeader>

<div class="layout">
  <div class="left">
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div class="screen" bind:this={canvas} on:click={(e) => { if (e.target === e.currentTarget) selectedId = null; }} on:pointermove={move} on:pointerup={up}>
      {#each widgets as w (w.id)}
        {@const plugin = w.type === 'plugin' ? $plugins.find((p) => p.manifest.id === w.pluginId) : undefined}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="slot"
          class:sel={w.id === selectedId}
          class:moving={drag?.id === w.id}
          style="left:{w.x}%; top:{w.y}%; width:{w.w}%; height:{w.h}%"
          on:pointerdown={(e) => down(e, w, 'move')}
        >
          <WidgetView widget={w} accent={$config.accent} audio={$audioState} tracks={$config.library} {plugin} pluginValues={$config.plugins[w.pluginId ?? '']?.settings ?? {}} live={false} />
          {#if w.id === selectedId}
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <span class="handle" on:pointerdown={(e) => down(e, w, 'resize')}></span>
          {/if}
        </div>
      {/each}
    </div>

    <div class="adders">
      {#each types as t}
        <button class="btn" on:click={() => add(t.type)}><Icon name="plus" size={14} /> {t.label}</button>
      {/each}
      {#each widgetPlugins as p}
        <button class="btn" on:click={() => addPlugin(p.manifest.id)}><Icon name="plugins" size={14} /> {p.manifest.name}</button>
      {/each}
    </div>
  </div>

  <aside>
    {#if selected}
      <div class="row">
        <h2>{selected.type === 'plugin' ? selectedPlugin?.manifest.name ?? 'Plugin' : types.find((t) => t.type === selected?.type)?.label}</h2>
        <span class="spacer"></span>
        <button class="btn icon danger" aria-label="Remove widget" on:click={() => remove(selected!.id)}><Icon name="trash" size={16} /></button>
      </div>

      <div class="rows">
        <div class="setting">
          <div class="label">Background</div>
          <div class="ctl"><Slider min={0} max={1} step={0.05} value={selected.bg} label="Background opacity" on:change={(e) => patch((w) => (w.bg = e.detail))} /></div>
        </div>
        <div class="setting">
          <div class="label">Blur</div>
          <div class="ctl"><Slider min={0} max={40} step={1} value={selected.blur} label="Blur" on:change={(e) => patch((w) => (w.blur = e.detail))} /></div>
        </div>
        <div class="setting">
          <div class="label">Accent</div>
          <ColorField value={selected.accent} allowEmpty placeholder={$config.accent} on:change={(e) => patch((w) => (w.accent = e.detail))} />
        </div>

        {#if selected.type === 'clock'}
          <div class="setting"><div class="label">12-hour clock</div><Toggle label="12-hour clock" checked={Boolean(selected.settings.hour12)} on:change={(e) => setSetting('hour12', e.detail)} /></div>
          <div class="setting"><div class="label">Show seconds</div><Toggle label="Show seconds" checked={Boolean(selected.settings.seconds)} on:change={(e) => setSetting('seconds', e.detail)} /></div>
        {:else if selected.type === 'notes'}
          <div class="setting col">
            <div class="label">Text</div>
            <textarea class="field" value={String(selected.settings.text ?? '')} on:input={(e) => setSetting('text', e.currentTarget.value)}></textarea>
          </div>
        {:else if selected.type === 'countdown'}
          <div class="setting"><div class="label">Label</div><input class="field" value={String(selected.settings.label ?? '')} on:input={(e) => setSetting('label', e.currentTarget.value)} /></div>
          <div class="setting"><div class="label">Date</div><input class="field" type="datetime-local" value={String(selected.settings.date ?? '')} on:input={(e) => setSetting('date', e.currentTarget.value)} /></div>
        {:else if selected.type === 'weather'}
          <div class="setting"><div class="label">City label</div><input class="field" value={String(selected.settings.city ?? '')} on:input={(e) => setSetting('city', e.currentTarget.value)} /></div>
          <div class="setting"><div class="label">Latitude</div><input class="field num" type="number" step="0.01" value={Number(selected.settings.lat)} on:input={(e) => setSetting('lat', Number(e.currentTarget.value))} /></div>
          <div class="setting"><div class="label">Longitude</div><input class="field num" type="number" step="0.01" value={Number(selected.settings.lon)} on:input={(e) => setSetting('lon', Number(e.currentTarget.value))} /></div>
        {/if}
      </div>

      {#if selected.type === 'plugin' && selectedPlugin}
        <h3 class="sub">Plugin settings</h3>
        <PluginSettings
          manifest={selectedPlugin.manifest}
          values={$config.plugins[selectedPlugin.manifest.id]?.settings ?? {}}
          onChange={(k, v) => mutate((c) => {
            const id = selectedPlugin.manifest.id;
            const cur = c.plugins[id] ?? { enabled: true, settings: {} };
            c.plugins[id] = { ...cur, settings: { ...cur.settings, [k]: v } };
          })}
        />
      {/if}
    {:else}
      <p class="muted">Select a widget to edit it, or add one with the buttons under the preview.</p>
    {/if}
  </aside>
</div>

<style>
  .layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 28px; align-items: start; }
  .screen {
    position: relative; aspect-ratio: 16 / 9; width: 100%; overflow: hidden; border-radius: 14px;
    border: 1px solid var(--line-strong);
    background:
      radial-gradient(90% 70% at 15% 110%, color-mix(in srgb, var(--accent) 38%, transparent), transparent 62%),
      linear-gradient(180deg, #0a0d22, #16204a);
  }
  .slot { position: absolute; cursor: grab; touch-action: none; transition: box-shadow 0.2s var(--ease); }
  .slot.moving { cursor: grabbing; z-index: 2; }
  .slot.sel { box-shadow: 0 0 0 2px var(--accent); border-radius: 16px; }
  .handle {
    position: absolute; right: -6px; bottom: -6px; width: 14px; height: 14px; border-radius: 50%;
    background: var(--accent); border: 2px solid var(--ink); cursor: nwse-resize;
  }
  .adders { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  aside { min-width: 0; }
  .sub { margin: 22px 0 4px; }
  .ctl { width: 150px; }
  .num { width: 110px; }
  .setting.col { flex-direction: column; align-items: stretch; gap: 8px; }
</style>
