<script setup>
// The one way to render a link. Links open in the same tab (the visitor decides);
// external ones get rel="noopener" plus any extra rel values (e.g. "me" for profiles).
// `invert` applies the shared hover/focus "selected" treatment (the `invertible` utility).
import { computed } from 'vue';
import { isExternal } from '../../lib/format.mjs';

const props = defineProps({
  href: { type: String, required: true },
  rel: { type: String, default: undefined },
  invert: { type: Boolean, default: false },
});

const relValue = computed(
  () => [isExternal(props.href) && 'noopener', props.rel].filter(Boolean).join(' ') || undefined
);
</script>

<template>
  <a :href="href" :rel="relValue" :class="{ invertible: invert }"><slot /></a>
</template>
