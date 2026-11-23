<script lang="ts">
  import { onMount } from 'svelte';
  export let settings: Record<string, unknown>;

  let now = Date.now();
  onMount(() => {
    const t = setInterval(() => (now = Date.now()), 30_000);
    return () => clearInterval(t);
  });

  $: target = new Date(String(settings.date ?? '')).getTime();
  $: left = isNaN(target) ? 0 : Math.max(0, target - now);
  $: days = Math.floor(left / 86_400_000);
  $: hours = Math.floor((left % 86_400_000) / 3_600_000);
  $: mins = Math.floor((left % 3_600_000) / 60_000);
</script>

<div class="cd">
  <div class="big"><b>{days}</b><span>d</span> <b>{hours}</b><span>h</span> <b>{mins}</b><span>m</span></div>
  <div class="label">{String(settings.label ?? '')}</div>
</div>

<style>
  .cd { height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 0 3cqw; color: #fff; }
  .big { font-size: min(34cqh, 10cqw); line-height: 1.1; }
  .big b { font-weight: 600; }
  .big span { opacity: 0.6; font-size: 0.55em; margin-right: 0.3em; }
  .label { font-size: min(14cqh, 5cqw); color: var(--w-accent); margin-top: 2cqh; }
</style>
