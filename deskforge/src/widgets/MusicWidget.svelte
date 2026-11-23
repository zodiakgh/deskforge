<script lang="ts">
  import type { AudioState, Track } from '../lib/types';
  import { formatTime } from '../lib/desktop';

  export let audio: AudioState;
  export let tracks: Track[];

  $: track = tracks.find((t) => t.id === audio.trackId);
  $: pct = audio.duration ? (audio.position / audio.duration) * 100 : 0;
</script>

<div class="music">
  <div class="eq" class:on={audio.playing} aria-hidden="true"><i></i><i></i><i></i><i></i></div>
  <div class="meta">
    <div class="title">{track?.title ?? 'Nothing playing'}</div>
    <div class="time">{formatTime(audio.position)} / {formatTime(audio.duration)}</div>
    <div class="bar"><i style="width:{pct}%"></i></div>
  </div>
</div>

<style>
  .music { height: 100%; display: flex; align-items: center; gap: 5cqw; padding: 0 3cqw; color: #fff; }
  .eq { flex: none; height: 46cqh; width: 14cqh; display: flex; align-items: flex-end; gap: 12%; }
  .eq i { flex: 1; height: 25%; border-radius: 99px; background: var(--w-accent); }
  .eq.on i { animation: eq 0.9s ease-in-out infinite alternate; }
  .eq.on i:nth-child(2) { animation-delay: -0.3s; }
  .eq.on i:nth-child(3) { animation-delay: -0.6s; }
  .eq.on i:nth-child(4) { animation-delay: -0.15s; }
  @keyframes eq { from { height: 20%; } to { height: 100%; } }
  .meta { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 2cqh; }
  .title { font-size: min(20cqh, 5.4cqw); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .time { font-size: min(14cqh, 4cqw); opacity: 0.65; }
  .bar { height: 4cqh; border-radius: 99px; background: rgba(255, 255, 255, 0.14); overflow: hidden; }
  .bar i { display: block; height: 100%; background: var(--w-accent); border-radius: inherit; }
</style>
