<script lang="ts">
  import { onMount } from 'svelte';

  let now = new Date();
  onMount(() => {
    const t = setInterval(() => (now = new Date()), 30_000);
    return () => clearInterval(t);
  });

  $: weekday = now.toLocaleDateString(undefined, { weekday: 'long' });
  $: rest = now.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
</script>

<div class="date">
  <span class="day">{weekday}</span>
  <span class="rest">{rest}</span>
</div>

<style>
  .date { height: 100%; display: flex; flex-direction: column; justify-content: center; color: #fff; text-shadow: 0 2px 18px rgba(0, 0, 0, 0.35); }
  .day { font-size: min(44cqh, 9cqw); font-weight: 600; line-height: 1.1; text-transform: capitalize; color: var(--w-accent); }
  .rest { font-size: min(34cqh, 6cqw); opacity: 0.85; }
</style>
