import { html, attrs } from '../lib/html.mjs';
import { Window } from './Window.mjs';

// Shown over the (blank) canvas when JavaScript is off. A <span>, because a <button>
// may only contain phrasing content.
const FALLBACK_ASCII = String.raw`
     .-------------------------.
     |  .-------------------.  |
     |  |                   |  |
     |  |   > HELLO_        |  |
     |  |                   |  |
     |  '-------------------'  |
     |                         |
     |              ======     |
     '-------------------------'
       '---------------------'`;

/**
 * Interactive ASCII computer. The canvas lives inside a real <button>, so the "change the
 * screen" interaction works with keyboard, mouse and touch; a polite live region announces
 * the new message for screen-reader users.
 *
 * @param {{ messages: string[], hint?: string, fontUrl?: string }} props
 *   fontUrl: woff2 the canvas font is loaded from inside the render worker
 */
export const Hero = ({ messages, hint, fontUrl }) => html`
  <figure class="hero">
    ${Window({
      title: 'machine.txt',
      children: html`
        <button class="hero__machine" type="button" data-ascii-button
          aria-label="Change the message on the ASCII computer's screen">
          <canvas class="hero__canvas" data-ascii${attrs({ 'data-messages': JSON.stringify(messages), 'data-font-url': fontUrl })} aria-hidden="true"></canvas>
          <noscript><span class="ascii-art hero__fallback" aria-hidden="true">${FALLBACK_ASCII}</span></noscript>
        </button>
        <p class="sr-only" aria-live="polite" data-ascii-status></p>`,
    })}
    ${hint ? html`<figcaption class="hero__hint">${hint}</figcaption>` : ''}
  </figure>`;
