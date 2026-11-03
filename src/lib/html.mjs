// Tiny, dependency-free HTML templating.
//
//   html`<p class="${cls}">${text}</p>`
//
// Every interpolated value is HTML-escaped unless it is itself the result of html`` or
// raw(). Arrays are joined, and null / undefined / false render nothing, so components can
// be composed like JSX:  html`<ul>${items.map((i) => Item(i))}</ul>`.

const SAFE = Symbol('safe-html');

/** Mark a string as already-safe HTML. Only use with trusted, build-time strings. */
export const raw = (value) => ({ [SAFE]: String(value) });

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderValue = (value) => {
  if (value == null || value === false) return '';
  if (Array.isArray(value)) return value.map(renderValue).join('');
  if (typeof value === 'object' && SAFE in value) return value[SAFE];
  return escapeHtml(value);
};

/** Tagged template that escapes interpolations and returns safe HTML. */
export const html = (strings, ...values) =>
  raw(strings.reduce((out, str, i) => out + str + (i < values.length ? renderValue(values[i]) : ''), ''));

/** Serialize a safe-HTML value (or anything html`` accepts) to a string. */
export const render = (value) => renderValue(value);

/** Join class names, skipping falsy entries:  cx('a', on && 'b', extra)  */
export const cx = (...names) => names.flat().filter(Boolean).join(' ');

/**
 * Render an attribute list, skipping null / undefined / false / '' values.
 * true renders a bare boolean attribute.  attrs({ class: 'a', hidden: true, rel: null })
 */
export const attrs = (map) =>
  raw(
    Object.entries(map)
      .filter(([, v]) => v != null && v !== false && v !== '')
      .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${escapeHtml(v)}"`))
      .join('')
  );
