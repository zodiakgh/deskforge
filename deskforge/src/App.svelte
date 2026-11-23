<script lang="ts">
  import { onMount } from 'svelte';
  import TitleBar from './components/TitleBar.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import Wallpapers from './pages/Wallpapers.svelte';
  import Widgets from './pages/Widgets.svelte';
  import Audio from './pages/Audio.svelte';
  import Profiles from './pages/Profiles.svelte';
  import Plugins from './pages/Plugins.svelte';
  import Settings from './pages/Settings.svelte';
  import { route } from './stores/route';
  import { config, mutateProfile, profile } from './stores/config';
  import { audioState } from './stores/audio';
  import { plugins, refreshPlugins } from './stores/plugins';
  import { onAudioState } from './lib/bus';
  import { attachWallpaper, detachWallpaper } from './lib/desktop';
  import { enter, soft } from './lib/motion';
  import type { PluginInfo } from './lib/types';

  let error = '';
  let attached = false;
  let themeVars: string[] = [];

  $: document.documentElement.style.setProperty('--accent', $config.accent);

  $: applyTheme($config.themePluginId, $plugins);
  function applyTheme(id: string, list: PluginInfo[]) {
    const root = document.documentElement;
    themeVars.forEach((v) => root.style.removeProperty(v));
    themeVars = [];
    const theme = list.find((p) => p.manifest.id === id)?.manifest.theme;
    for (const [k, v] of Object.entries(theme ?? {})) {
      if (!k.startsWith('--')) continue;
      root.style.setProperty(k, v);
      themeVars.push(k);
    }
  }

  // The wallpaper window exists only while "Show on desktop" is on.
  $: void syncWallpaper($profile.wallpaper.enabled);
  async function syncWallpaper(enabled: boolean) {
    if (enabled && !attached) {
      attached = true;
      const err = await attachWallpaper();
      if (err) {
        attached = false;
        error = err;
        mutateProfile((p) => (p.wallpaper.enabled = false));
      }
    } else if (!enabled && attached) {
      attached = false;
      await detachWallpaper();
    }
  }

  $: if (error) setTimeout(() => (error = ''), 6000);

  onMount(() => {
    refreshPlugins();
    let off: (() => void) | undefined;
    onAudioState((s) => audioState.set(s)).then((u) => (off = u));
    return () => off?.();
  });
</script>

<div class="shell">
  <TitleBar />
  <div class="body">
    <Sidebar />
    <main>
      {#key $route}
        <div class="page" in:enter={{ y: 12, duration: 260 }}>
          {#if $route === 'wallpaper'}<Wallpapers />
          {:else if $route === 'widgets'}<Widgets />
          {:else if $route === 'audio'}<Audio />
          {:else if $route === 'profiles'}<Profiles />
          {:else if $route === 'plugins'}<Plugins />
          {:else}<Settings />
          {/if}
        </div>
      {/key}
    </main>
  </div>

  {#if error}
    <div class="toast" role="alert" in:enter={{ y: 14, duration: 280 }} out:soft>{error}</div>
  {/if}
</div>

<style>
  .shell { height: 100%; display: flex; flex-direction: column; background: var(--ink); }
  .body { flex: 1; min-height: 0; display: flex; }
  main {
    flex: 1; min-width: 0; margin: 0 12px 12px 0;
    background: var(--ink-2); border: 1px solid var(--line); border-radius: 16px; overflow: hidden;
  }
  .page { height: 100%; overflow-y: auto; padding: 26px 30px 32px; }
  .toast {
    position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); max-width: 70%;
    padding: 10px 16px; border-radius: 10px; background: var(--ink-4); border: 1px solid var(--danger); color: var(--text);
  }
</style>
