<script lang="ts">
  import Icon from './Icon.svelte';
  import { route, type Route } from '../stores/route';
  import { config, mutate, profile } from '../stores/config';

  const items: { id: Route; label: string; icon: string }[] = [
    { id: 'wallpaper', label: 'Wallpaper', icon: 'wallpaper' },
    { id: 'widgets', label: 'Widgets', icon: 'widgets' },
    { id: 'audio', label: 'Music', icon: 'audio' },
    { id: 'profiles', label: 'Profiles', icon: 'profiles' },
    { id: 'plugins', label: 'Plugins', icon: 'plugins' },
    { id: 'settings', label: 'Settings', icon: 'settings' }
  ];

  $: index = Math.max(0, items.findIndex((i) => i.id === $route));
</script>

<nav>
  <div class="profile">
    <span class="muted small">Profile</span>
    <select
      class="field"
      value={$config.activeProfileId}
      on:change={(e) => mutate((c) => (c.activeProfileId = e.currentTarget.value))}
      aria-label="Active profile"
    >
      {#each $config.profiles as p}
        <option value={p.id}>{p.name}</option>
      {/each}
    </select>
  </div>

  <ul style="--i:{index}">
    <li class="marker" aria-hidden="true"></li>
    {#each items as item}
      <li>
        <button class:active={$route === item.id} on:click={() => route.set(item.id)}>
          <Icon name={item.icon} />
          {item.label}
        </button>
      </li>
    {/each}
  </ul>

  <div class="foot small muted">
    {$profile.wallpaper.enabled ? 'Wallpaper is running' : 'Wallpaper is off'}
  </div>
</nav>

<style>
  nav { width: 208px; flex: none; display: flex; flex-direction: column; padding: 8px 12px 14px 12px; gap: 18px; }
  .profile { display: flex; flex-direction: column; gap: 6px; padding: 0 4px; }
  ul { list-style: none; margin: 0; padding: 0; position: relative; }
  li { height: 42px; }
  button {
    position: relative; z-index: 1; width: 100%; height: 100%;
    display: flex; align-items: center; gap: 12px; padding: 0 12px;
    background: transparent; border: 0; border-radius: 10px; color: var(--muted); text-align: left;
    transition: color 0.2s var(--ease);
  }
  button:hover { color: var(--text); }
  button.active { color: var(--text); }
  button.active :global(svg) { color: var(--accent); }
  /* One pill that glides between items. */
  .marker {
    position: absolute; left: 0; right: 0; top: 0; height: 42px; z-index: 0;
    background: var(--ink-3); border-radius: 10px;
    transform: translateY(calc(var(--i) * 42px));
    transition: transform 0.38s var(--ease);
  }
  .marker::before {
    content: ''; position: absolute; left: 0; top: 11px; bottom: 11px; width: 3px; border-radius: 3px; background: var(--accent);
  }
  .foot { margin-top: auto; padding: 0 12px; }
</style>
