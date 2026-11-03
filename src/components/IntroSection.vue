<script setup>
// The page's main heading, tagline and bio paragraphs.
import PageSection from './ui/PageSection.vue';
import RichText from './ui/RichText.vue';

defineProps({
  name: { type: String, required: true },
  tagline: { type: String, required: true },
  paragraphs: { type: Array, required: true },
});
</script>

<template>
  <PageSection id="about" :title="name" :level="1" variant="display">
    <p class="max-w-measure text-sm text-fg-muted">{{ tagline }}</p>
    <div class="mt-8 grid max-w-measure gap-4">
      <p v-for="(p, i) in paragraphs" :key="i"><RichText :text="p" /></p>
    </div>
  </PageSection>
</template>
