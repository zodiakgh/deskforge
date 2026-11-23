<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke, convertFileSrc } from '@tauri-apps/api/core';
  import { activeProfileOf, loadConfig } from '../lib/config';
  import { broadcastAudioState, onAudioCmd, onConfig } from '../lib/bus';
  import { AudioEngine } from '../engine/audioEngine';
  import { Visualizer, beatLevel, reduceSpectrum } from '../engine/visualizer';
  import { ShaderRenderer } from '../engine/shader';
  import { shaderById } from '../engine/shaders';
  import { broadcast } from '../engine/pluginHost';
  import { audioState } from '../stores/audio';
  import WidgetView from '../widgets/WidgetView.svelte';
  import PluginFrame from '../widgets/PluginFrame.svelte';
  import type { AppConfig, PluginInfo, SystemStats } from '../lib/types';

  let cfg: AppConfig = loadConfig();
  let plugins: PluginInfo[] = [];
  let paused = false; // a full-screen app is in front
  let onBattery = false;

  $: profile = activeProfileOf(cfg);
  $: wp = profile.wallpaper;
  $: wallpaperPlugin = plugins.find((p) => p.manifest.id === wp.pluginId && cfg.plugins[p.manifest.id]?.enabled);

  const engine = new AudioEngine();
  const bins = new Float32Array(64);

  let shaderCanvas: HTMLCanvasElement | undefined;
  let vizCanvas: HTMLCanvasElement;
  let video: HTMLVideoElement | undefined;
  let renderer: ShaderRenderer | null = null;
  let viz: Visualizer;

  function applyConfig(c: AppConfig) {
    cfg = c;
    engine.setTracks(c.library);
    engine.setVolume(c.volume);
    engine.loop = c.loop;
    engine.shuffle = c.shuffle;
    document.documentElement.style.setProperty('--accent', c.accent);
  }

  // (Re)build the shader renderer whenever its canvas or shader changes.
  $: setupShader(shaderCanvas, wp.kind === 'shader' ? wp.shaderId : '');
  function setupShader(canvas: HTMLCanvasElement | undefined, id: string) {
    renderer?.dispose();
    renderer = null;
    if (!canvas || !id) return;
    try {
      renderer = new ShaderRenderer(canvas, shaderById(id).frag);
    } catch (e) {
      console.error('Shader failed', e);
    }
  }

  $: if (video) (paused ? video.pause() : video.play().catch(() => {}));

  const trackTitle = () => cfg.library.find((t) => t.id === engine.state.trackId)?.title ?? '';

  onMount(() => {
    applyConfig(cfg);
    viz = new Visualizer(vizCanvas);
    viz.resize();

    const unsubs: (() => void)[] = [];
    onConfig(applyConfig).then((u) => unsubs.push(u));
    onAudioCmd((c) => void engine.handle(c)).then((u) => unsubs.push(u));
    unsubs.push(
      engine.onChange((s) => {
        audioState.set(s);
        broadcastAudioState(s);
        broadcast('track', { ...s, title: trackTitle() });
      })
    );

    const loadPlugins = () => invoke<PluginInfo[]>('list_plugins').then((p) => (plugins = p)).catch(() => {});
    loadPlugins();

    // Pause everything while a game or video is full screen.
    const fsTimer = setInterval(async () => {
      if (!wp.pauseOnFullscreen) { paused = false; return; }
      try { paused = await invoke<boolean>('is_fullscreen_app_active'); } catch { paused = false; }
    }, 1500);

    const statsTimer = setInterval(async () => {
      if (paused) return;
      try { broadcast('stats', await invoke<SystemStats>('get_system_stats')); } catch { /* ignore */ }
    }, 1000);

    // Battery saver: lower the frame rate when unplugged.
    (navigator as any).getBattery?.().then((b: any) => {
      const update = () => (onBattery = !b.charging);
      update();
      b.addEventListener('chargingchange', update);
    });

    const onResize = () => viz.resize();
    window.addEventListener('resize', onResize);

    let raf = 0, last = 0, lastPlugin = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (paused || document.hidden) return;
      const cap = cfg.batterySaver && onBattery ? 20 : 60;
      if (now - last < 1000 / cap - 1) return;
      last = now;

      reduceSpectrum(engine.sample(), bins);
      const level = beatLevel(bins);

      if (renderer) { renderer.resize(); renderer.render(level, cfg.accent); }

      const v = profile.visualizer;
      if (v.enabled) viz.draw(bins, v, cfg.accent, now);
      else { viz.clear(); viz.analyze(bins, v.sensitivity, now); }

      if (now - lastPlugin > 33) {
        lastPlugin = now;
        if (engine.state.playing) {
          broadcast('spectrum', Array.from(bins));
          if (viz.beat) broadcast('beat', level);
        }
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(fsTimer);
      clearInterval(statsTimer);
      window.removeEventListener('resize', onResize);
      unsubs.forEach((u) => u());
      renderer?.dispose();
    };
  });
</script>

<div class="stage">
  <div class="bg">
    {#if wp.kind === 'image' && wp.path}
      <img src={convertFileSrc(wp.path)} alt="" style="object-fit:{wp.fit}" />
    {:else if wp.kind === 'video' && wp.path}
      <video bind:this={video} src={convertFileSrc(wp.path)} autoplay loop muted playsinline style="object-fit:{wp.fit}"></video>
    {:else if wp.kind === 'html' && wp.path}
      <iframe title="HTML wallpaper" src={convertFileSrc(wp.path)} sandbox="allow-scripts"></iframe>
    {:else if wp.kind === 'shader'}
      {#key wp.shaderId}<canvas bind:this={shaderCanvas}></canvas>{/key}
    {:else if wp.kind === 'plugin' && wallpaperPlugin}
      <PluginFrame info={wallpaperPlugin} values={cfg.plugins[wallpaperPlugin.manifest.id]?.settings ?? {}} live={!paused} />
    {:else}
      <div class="fallback"></div>
    {/if}
  </div>

  <canvas class="viz" bind:this={vizCanvas}></canvas>

  <div class="widgets">
    {#each profile.widgets as w (w.id)}
      {@const plugin = w.type === 'plugin' ? plugins.find((p) => p.manifest.id === w.pluginId) : undefined}
      {#if w.type !== 'plugin' || (plugin && cfg.plugins[w.pluginId ?? '']?.enabled)}
        <div class="slot" style="left:{w.x}%; top:{w.y}%; width:{w.w}%; height:{w.h}%">
          <WidgetView
            widget={w}
            accent={cfg.accent}
            audio={$audioState}
            tracks={cfg.library}
            {plugin}
            pluginValues={cfg.plugins[w.pluginId ?? '']?.settings ?? {}}
            live={true}
          />
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .stage { position: fixed; inset: 0; overflow: hidden; background: #0f1424; }
  .bg, .viz, .widgets { position: absolute; inset: 0; }
  .bg > :global(*) { width: 100%; height: 100%; display: block; border: 0; }
  .bg img, .bg video { object-position: center; }
  .viz { width: 100%; height: 100%; pointer-events: none; }
  .widgets { pointer-events: none; }
  .slot { position: absolute; }
  .fallback { background: linear-gradient(135deg, #0f1424, #243053); }
</style>
