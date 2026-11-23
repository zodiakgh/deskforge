<script lang="ts">
  import type { AudioState, PluginInfo, Track, WidgetInstance } from '../lib/types';
  import ClockWidget from './ClockWidget.svelte';
  import DateWidget from './DateWidget.svelte';
  import SystemWidget from './SystemWidget.svelte';
  import MusicWidget from './MusicWidget.svelte';
  import NotesWidget from './NotesWidget.svelte';
  import CountdownWidget from './CountdownWidget.svelte';
  import WeatherWidget from './WeatherWidget.svelte';
  import PluginFrame from './PluginFrame.svelte';

  export let widget: WidgetInstance;
  export let accent: string;
  export let audio: AudioState;
  export let tracks: Track[] = [];
  export let plugin: PluginInfo | undefined = undefined;
  export let pluginValues: Record<string, unknown> = {};
  /** Plugins only run for real on the desktop; the editor preview shows a placeholder. */
  export let live = true;
</script>

<!-- Fills its parent. Sizes inside are in container units, so a widget looks the same at any scale. -->
<div
  class="frame"
  style="--w-accent:{widget.accent || accent}; background:rgba(15,20,36,{widget.bg}); backdrop-filter:blur({widget.blur}px); -webkit-backdrop-filter:blur({widget.blur}px)"
>
  {#if widget.type === 'clock'}<ClockWidget settings={widget.settings} />
  {:else if widget.type === 'date'}<DateWidget />
  {:else if widget.type === 'system'}<SystemWidget />
  {:else if widget.type === 'music'}<MusicWidget {audio} {tracks} />
  {:else if widget.type === 'notes'}<NotesWidget settings={widget.settings} />
  {:else if widget.type === 'countdown'}<CountdownWidget settings={widget.settings} />
  {:else if widget.type === 'weather'}<WeatherWidget settings={widget.settings} />
  {:else if widget.type === 'plugin' && plugin}<PluginFrame info={plugin} values={pluginValues} {live} />
  {/if}
</div>

<style>
  .frame { width: 100%; height: 100%; container-type: size; border-radius: 16px; overflow: hidden; }
</style>
