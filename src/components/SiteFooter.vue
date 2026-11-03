<script setup>
defineProps({
  name: { type: String, required: true },
  text: { type: String, default: '' },
  year: { type: Number, required: true },
});
</script>

<template>
  <footer class="mx-auto mt-24 flex max-w-page flex-wrap gap-x-6 gap-y-2 border-t border-line px-(--gutter) pt-6 pb-12 text-xs text-fg-muted">
    <span>&copy; {{ year }} {{ name }}</span>
    <span v-if="text">{{ text }}</span>
    <span class="blink print:hidden" aria-hidden="true">_</span>
  </footer>
</template>
