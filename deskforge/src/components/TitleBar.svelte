<script lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import Icon from './Icon.svelte';

  const win = getCurrentWindow();
</script>

<header class="bar" data-tauri-drag-region>
  <div class="brand" data-tauri-drag-region>
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="3" fill="none" stroke="var(--accent)" stroke-width="2" />
      <path d="M6 21h12" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" />
      <path d="M7 12c2-4 4 2 6-2s3 1 4-1" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" />
    </svg>
    <span data-tauri-drag-region>Deskforge</span>
  </div>
  <div class="controls">
    <button aria-label="Minimize" on:click={() => win.minimize()}><Icon name="minus" size={15} /></button>
    <button aria-label="Maximize" on:click={() => win.toggleMaximize()}><Icon name="square" size={13} /></button>
    <button class="close" aria-label="Close to tray" on:click={() => win.close()}><Icon name="x" size={15} /></button>
  </div>
</header>

<style>
  .bar { height: 40px; display: flex; align-items: center; justify-content: space-between; padding-left: 16px; flex: none; }
  .brand { display: flex; align-items: center; gap: 9px; font-weight: 600; letter-spacing: 0.01em; }
  .controls { display: flex; height: 100%; }
  .controls button {
    width: 46px; height: 100%; border: 0; background: transparent; color: var(--muted);
    display: grid; place-items: center; transition: background 0.15s var(--ease), color 0.15s var(--ease);
  }
  .controls button:hover { background: var(--ink-3); color: var(--text); }
  .controls .close:hover { background: #d8394f; color: white; }
</style>
