// One-page site, so the sitemap is one URL. Add pages here if more are created.
export function GET({ site }) {
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${new URL('/', site).href}</loc></url></urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
