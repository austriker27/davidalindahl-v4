<script setup>
// Grid of outbound profile links. rel="me" lets IndieWeb tools verify the profiles.
import PageSection from './ui/PageSection.vue';
import AppLink from './ui/AppLink.vue';

defineProps({
  id: { type: String, default: 'elsewhere' },
  title: { type: String, default: 'Elsewhere' },
  links: { type: Array, required: true }, // [{ label, url }]
});
</script>

<template>
  <PageSection :id="id" :title="title">
    <ul class="grid grid-cols-[repeat(auto-fill,minmax(11.25rem,1fr))] gap-3" role="list">
      <li v-for="link in links" :key="link.url">
        <AppLink :href="link.url" rel="me" invert class="flex justify-between border border-border px-4 py-3 no-underline">
          <span>{{ link.label }}</span><span aria-hidden="true">↗</span>
        </AppLink>
      </li>
    </ul>
  </PageSection>
</template>
