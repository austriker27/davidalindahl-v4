<script setup>
// Retro desktop window chrome: striped title bar with a close box, framed body.
// The title bar is decorative and hidden from assistive tech.
defineProps({
  title: { type: String, required: true },
});
</script>

<template>
  <div class="border border-border bg-bg shadow-window">
    <div class="window-stripes relative flex h-6 items-center justify-center border-b border-border px-1.5 py-1 text-xs" aria-hidden="true">
      <span class="absolute left-3 size-3 border border-border bg-bg ring-3 ring-bg"></span>
      <span class="bg-bg px-3">{{ title }}</span>
    </div>
    <div class="relative"><slot /></div>
  </div>
</template>
