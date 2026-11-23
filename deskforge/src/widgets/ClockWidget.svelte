<script lang="ts">
  import { onMount } from 'svelte';
  export let settings: Record<string, unknown>;

  let now = new Date();
  onMount(() => {
    const t = setInterval(() => (now = new Date()), 1000);
    return () => clearInterval(t);
  });

  $: text = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: settings.seconds ? '2-digit' : undefined,
    hour12: Boolean(settings.hour12)
  }).format(now);
</script>

<div class="clock">{text}</div>

<style>
  .clock {
    height: 100%; display: flex; align-items: center;
    font-size: min(56cqh, 17cqw); font-weight: 600; line-height: 1; letter-spacing: -0.03em;
    color: #fff; text-shadow: 0 2px 24px rgba(0, 0, 0, 0.35);
  }
</style>
