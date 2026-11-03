<script setup>
// The interactive ASCII computer (hydrated with client:idle, so it never competes with
// first paint; it plays a boot-up animation anyway).
//
// Vue only renders the shell: a real <button> (keyboard, mouse and touch all work), the
// canvas, and a polite live region. Rendering happens in src/client/: a Web Worker draws
// on an OffscreenCanvas when available, otherwise it runs inline.
import { ref, onMounted } from 'vue';

const props = defineProps({
  messages: { type: Array, required: true }, // words for the screen; click cycles them
  fontUrl: { type: String, default: undefined }, // woff2 the canvas text is drawn with
});

const button = ref(null);
const canvas = ref(null);
const status = ref('');

onMounted(async () => {
  const { mountAsciiComputer } = await import('../../client/ascii-host.js');
  mountAsciiComputer({
    button: button.value,
    canvas: canvas.value,
    messages: props.messages,
    fontUrl: props.fontUrl,
    onMessage: (word) => (status.value = `The screen now says ${word}.`),
  });
});
</script>

<template>
  <button
    ref="button"
    type="button"
    class="relative block w-full cursor-crosshair touch-pan-y focus-inset"
    aria-label="Change the message on the ASCII computer's screen"
  >
    <canvas ref="canvas" class="block h-(--hero-height) w-full" aria-hidden="true"></canvas>
  </button>
  <p class="sr-only" aria-live="polite">{{ status }}</p>
</template>
