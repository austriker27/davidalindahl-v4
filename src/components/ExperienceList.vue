<script setup>
// Jobs as full-width rows, newest first. A whole row is the link when the company has a
// URL. Stacked on small screens; a 4-column grid (shared by the header) from `sm` up.
import { computed } from 'vue';
import { formatRange, sortExperience } from '../lib/format.mjs';
import PageSection from './ui/PageSection.vue';
import AppLink from './ui/AppLink.vue';

const props = defineProps({
  id: { type: String, default: 'experience' },
  title: { type: String, default: 'Experience' },
  items: { type: Array, required: true },
});

const jobs = computed(() => sortExperience(props.items));
const grid = 'grid grid-cols-[minmax(0,1fr)_1.5rem] gap-x-3 gap-y-1 sm:grid-cols-[8rem_minmax(0,1fr)_minmax(0,1.3fr)_1.5rem] sm:gap-4';
</script>

<template>
  <PageSection :id="id" :title="title">
    <div :class="[grid, 'px-3 pb-2 text-2xs tracking-caps uppercase text-fg-muted max-sm:hidden']" aria-hidden="true">
      <span>Years</span><span>Company</span><span>Role</span><span></span>
    </div>
    <ol class="border-b border-dashed border-border" role="list">
      <li v-for="job in jobs" :key="job.company + job.start" class="border-t border-dashed border-border">
        <component
          :is="job.url ? AppLink : 'div'"
          v-bind="job.url ? { href: job.url, invert: true } : {}"
          :class="[grid, 'group items-baseline px-2 py-4 no-underline focus-inset sm:px-3']"
        >
          <span class="col-start-1 row-start-1 text-xs text-fg-muted tabular-nums sm:col-auto sm:row-auto sm:text-sm">
            <time :datetime="job.start">{{ formatRange(job) }}</time>
          </span>
          <span class="col-start-1 row-start-2 text-md font-bold sm:col-auto sm:row-auto">{{ job.company }}</span>
          <span class="col-start-1 row-start-3 text-fg-muted sm:col-auto sm:row-auto sm:text-fg">
            {{ job.role }}
            <span v-if="job.note" class="block text-sm text-fg-muted">{{ job.note }}</span>
          </span>
          <span
            class="col-start-2 row-start-2 text-right sm:col-auto sm:row-auto sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100"
            aria-hidden="true"
          >{{ job.url ? '↗' : '' }}</span>
        </component>
      </li>
    </ol>
  </PageSection>
</template>
