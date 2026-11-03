<script setup>
// Layout primitive for every top-level block on a page. It owns vertical rhythm, the
// heading level, ids and aria-labelledby, so all sections stay consistent.
//   level:   2 for normal sections; 1 only for the page's main heading
//   variant: 'label' → small caps "// TITLE"; 'display' → big headline
defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  level: { type: Number, default: 2, validator: (v) => v === 1 || v === 2 },
  variant: { type: String, default: 'label', validator: (v) => ['label', 'display'].includes(v) },
});
</script>

<template>
  <section :id="id" :aria-labelledby="`${id}-title`" class="pt-18">
    <component
      :is="level === 1 ? 'h1' : 'h2'"
      :id="`${id}-title`"
      :class="
        variant === 'display'
          ? 'mb-4 text-display font-bold tracking-tight text-fg-strong'
          : 'mb-6 text-sm font-medium tracking-caps uppercase text-fg-muted'
      "
    >
      <span v-if="variant === 'label'" aria-hidden="true">// </span>{{ title }}
    </component>
    <slot />
  </section>
</template>
