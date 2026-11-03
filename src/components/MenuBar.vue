<script setup>
// Sticky top bar: site name, in-page navigation, and a default slot on the right
// (the layout puts the <LiveClock> island there).
import AppLink from './ui/AppLink.vue';

defineProps({
  name: { type: String, required: true },
  home: { type: String, default: '/' },
  nav: { type: Array, default: () => [] }, // [{ href, label }]
});
</script>

<template>
  <header class="sticky top-0 z-50 flex h-(--menubar-height) items-center gap-6 border-b border-line bg-bg px-(--gutter) text-sm max-sm:gap-3 print:hidden">
    <AppLink :href="home" class="mr-auto min-w-0 truncate font-bold no-underline">
      <span class="text-fg-strong" aria-hidden="true">▚</span> {{ name }}
    </AppLink>
    <nav v-if="nav.length" class="flex gap-1 max-sm:gap-0" aria-label="Sections">
      <AppLink
        v-for="item in nav"
        :key="item.href"
        :href="item.href"
        invert
        class="px-2 py-1 no-underline max-sm:px-1"
      >{{ item.label }}</AppLink>
    </nav>
    <slot />
  </header>
</template>
