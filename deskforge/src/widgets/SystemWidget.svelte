<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import type { SystemStats } from '../lib/types';

  let stats: SystemStats = { cpu: 0, memUsed: 0, memTotal: 1 };

  onMount(() => {
    const tick = async () => {
      try { stats = await invoke<SystemStats>('get_system_stats'); } catch { /* not running inside Tauri */ }
    };
    tick();
    const t = setInterval(tick, 1500);
    return () => clearInterval(t);
  });

  $: mem = (stats.memUsed / Math.max(1, stats.memTotal)) * 100;
  const gb = (n: number) => (n / 1024 ** 3).toFixed(1);
</script>

<div class="sys">
  <div class="line"><span>CPU</span><b>{Math.round(stats.cpu)}%</b></div>
  <div class="bar"><i style="width:{Math.min(100, stats.cpu)}%"></i></div>
  <div class="line"><span>Memory</span><b>{gb(stats.memUsed)} / {gb(stats.memTotal)} GB</b></div>
  <div class="bar"><i style="width:{mem}%"></i></div>
</div>

<style>
  .sys { height: 100%; display: flex; flex-direction: column; justify-content: center; gap: 4cqh; padding: 0 2cqw; color: #fff; }
  .line { display: flex; justify-content: space-between; align-items: baseline; font-size: min(11cqh, 6.4cqw); }
  .line span { opacity: 0.7; }
  .line b { font-weight: 600; }
  .bar { height: 5cqh; border-radius: 99px; background: rgba(255, 255, 255, 0.12); overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: inherit; background: var(--w-accent); transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
</style>
