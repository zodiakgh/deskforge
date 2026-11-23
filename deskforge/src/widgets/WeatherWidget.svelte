<script lang="ts">
  import { onMount } from 'svelte';
  export let settings: Record<string, unknown>;

  let temp: number | null = null;
  let code = 0;
  let failed = false;

  const LABELS: [number, string][] = [
    [0, 'Clear'], [3, 'Partly cloudy'], [48, 'Fog'], [57, 'Drizzle'], [67, 'Rain'],
    [77, 'Snow'], [82, 'Showers'], [86, 'Snow showers'], [99, 'Thunderstorm']
  ];
  const label = (c: number) => (LABELS.find(([max]) => c <= max) ?? [0, 'Unknown'])[1];

  async function load() {
    const lat = Number(settings.lat), lon = Number(settings.lon);
    if (!isFinite(lat) || !isFinite(lon)) return;
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
      const res = await fetch(url);
      const data = await res.json();
      temp = Math.round(data.current.temperature_2m);
      code = data.current.weather_code;
      failed = false;
    } catch {
      failed = true;
    }
  }

  let key = '';
  $: { const k = `${settings.lat},${settings.lon}`; if (k !== key) { key = k; void load(); } }

  onMount(() => {
    const t = setInterval(load, 15 * 60_000);
    return () => clearInterval(t);
  });
</script>

<div class="wx">
  <div class="temp">{temp === null ? '--' : temp}°</div>
  <div class="meta">
    <span class="city">{String(settings.city ?? '')}</span>
    <span class="cond">{failed ? 'Offline' : label(code)}</span>
  </div>
</div>

<style>
  .wx { height: 100%; display: flex; align-items: center; gap: 4cqw; padding: 0 3cqw; color: #fff; }
  .temp { font-size: min(58cqh, 17cqw); font-weight: 600; line-height: 1; }
  .meta { display: flex; flex-direction: column; min-width: 0; }
  .city { font-size: min(18cqh, 6cqw); font-weight: 600; color: var(--w-accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cond { font-size: min(15cqh, 5cqw); opacity: 0.75; }
</style>
