import { html } from '../lib/html.mjs';
import { Layout } from '../components/Layout.mjs';
import { Section } from '../components/Section.mjs';
import { Window } from '../components/Window.mjs';
import { Link } from '../components/Link.mjs';

const ART = String.raw`
  .-------------------.
  |  .-------------.  |
  |  |  ERROR 404  |  |
  |  |  NOT FOUND_ |  |
  |  '-------------'  |
  |          ====     |
  '-------------------'`;

export const NotFoundPage = ({ site, ...ctx }) =>
  Layout({
    ...ctx,
    site,
    path: '/404',
    title: 'Page not found',
    description: 'This page does not exist.',
    indexable: false,
    assets: { ...ctx.assets, modulePreloads: [] },
    children: Section({
      id: 'not-found',
      title: 'Page not found',
      level: 1,
      children: html`
        ${Window({ title: '404.txt', children: html`<pre class="ascii-art" aria-hidden="true">${ART}</pre>` })}
        <p class="not-found__back">${Link({ href: '/', invert: true, children: '< Back to the homepage' })}</p>`,
    }),
  });
