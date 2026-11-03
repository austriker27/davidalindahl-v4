import { html, attrs, cx } from '../lib/html.mjs';
import { isExternal } from '../lib/format.mjs';

/**
 * The one way to render a link. Links open in the same tab (the visitor decides), and
 * external links get rel="noopener" plus any extra rel values (e.g. "me" for profiles).
 *
 * @param {{ href: string, children: any, className?: string, rel?: string, invert?: boolean, ariaLabel?: string }} props
 *   invert: use the shared hover/focus "selected" treatment (.invertible in utilities.css)
 */
export const Link = ({ href, children, className, rel, invert = false, ariaLabel }) =>
  html`<a${attrs({
    class: cx(className, invert && 'invertible'),
    href,
    rel: cx(isExternal(href) && 'noopener', rel),
    'aria-label': ariaLabel,
  })}>${children}</a>`;
