<script lang="ts">
  export let settings: Record<string, unknown>;
</script>

<div class="notes">{String(settings.text ?? '')}</div>

<style>
  .notes { height: 100%; padding: 3cqh 3cqw; color: #fff; white-space: pre-wrap; overflow: hidden; font-size: min(9cqh, 5cqw); line-height: 1.35; }
</style>
