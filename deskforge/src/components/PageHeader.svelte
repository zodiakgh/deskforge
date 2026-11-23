<script lang="ts">
  export let title: string;
  export let subtitle = '';
</script>

<header>
  <div>
    <h1>{title}</h1>
    {#if subtitle}<p class="muted">{subtitle}</p>{/if}
  </div>
  <div class="actions"><slot /></div>
</header>

<style>
  header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 22px; }
  p { margin-top: 4px; max-width: 56ch; }
  .actions { display: flex; gap: 8px; align-items: center; }
</style>
