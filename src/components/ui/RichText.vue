<script setup>
// Plain text with inline markdown links ("[label](https://…)"), rendered as text nodes
// and AppLinks. No HTML from content is ever injected.
import { computed } from 'vue';
import { parseInlineLinks } from '../../lib/format.mjs';
import AppLink from './AppLink.vue';

const props = defineProps({
  text: { type: String, required: true },
});

const segments = computed(() => parseInlineLinks(props.text));
</script>

<template>
  <template v-for="(segment, i) in segments" :key="i">
    <AppLink
      v-if="segment.href"
      :href="segment.href"
      invert
      class="underline decoration-dotted underline-offset-3 hover:no-underline focus-visible:no-underline"
    >{{ segment.text }}</AppLink>
    <template v-else>{{ segment.text }}</template>
  </template>
</template>
