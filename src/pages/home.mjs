import { html } from '../lib/html.mjs';
import { Layout } from '../components/Layout.mjs';
import { Hero } from '../components/Hero.mjs';
import { Intro } from '../components/Intro.mjs';
import { ExperienceList } from '../components/ExperienceList.mjs';
import { LinkGrid } from '../components/LinkGrid.mjs';

/** The single page. Add a section by appending a component here and to `nav`. */
export const HomePage = ({ site, experience, ...ctx }) =>
  Layout({
    ...ctx,
    site,
    path: '/',
    nav: [
      { href: '#about', label: 'About' },
      { href: '#experience', label: 'Experience' },
      { href: '#elsewhere', label: 'Elsewhere' },
    ],
    children: html`
      ${Hero({ messages: site.hero.screenMessages, hint: site.hero.hint, fontUrl: ctx.assets.asciiFont })}
      ${Intro({ name: site.name, tagline: site.tagline, paragraphs: site.intro })}
      ${ExperienceList({ items: experience })}
      ${LinkGrid({ links: site.links })}`,
  });
