<script setup>
// Menu-bar clock in the visitor's local time. Hydrated with client:idle.
import { ref, onMounted, onUnmounted } from 'vue';

const text = ref('');
const iso = ref('');
let timer;

onMounted(() => {
  const fmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  const tick = () => {
    const now = new Date();
    text.value = fmt.format(now);
    iso.value = now.toISOString();
  };
  tick();
  timer = setInterval(tick, 15_000);
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
  <time :datetime="iso || undefined" class="min-w-[5.5em] text-right text-fg-muted tabular-nums max-sm:hidden" aria-hidden="true">{{ text }}</time>
</template>
