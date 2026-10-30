export const siteOrigin = 'https://mingyuniverse.com';
export const homeTitle = 'Mingyuniverse | Mingyu Du — Motion Designer & Illustrator';
export const homeDescription = 'Mingyuniverse is the portfolio of Mingyu Du, a motion designer and illustrator exploring 2D and 3D animation, visual storytelling, and brand design.';
export const googleVerification = 't49iRPYCGGQ0XILBgFMGXgmsk2firIhh6zKmp0oJXLQ';
export const escapeHtml = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
export const canonicalFor = route => new URL(route ? route + '/' : '/', siteOrigin + '/').href;

export function applySeo(html, route) {
  const canonical = canonicalFor(route);
  const oldTitle = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || 'Mingyu Du Portfolio';
  const title = route ? oldTitle.replace(/Dumingyuyuyu/gi, 'Mingyuniverse') : escapeHtml(homeTitle);
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  html = html.replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, '');
  html = html.replace(/<meta\b[^>]*name="google-site-verification"[^>]*>/gi, '');
  html = html.replace(/<meta\b[^>]*(?:name|property)="([^"]+)"[^>]*>/gi, (tag, name) => {
    const values = {'og:url': canonical, 'og:site_name': 'Mingyuniverse', 'og:title': title, 'twitter:title': title};
    if (!route) Object.assign(values, {description: escapeHtml(homeDescription), 'og:description': escapeHtml(homeDescription), 'twitter:description': escapeHtml(homeDescription)});
    return values[name] === undefined ? tag : tag.replace(/content="[^"]*"/, `content="${values[name]}"`);
  });
  html = html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi, (tag, json) => {
    try {
      if (JSON.parse(json)['@type'] === 'WebSite') return '';
    } catch { return tag; }
    return tag.replaceAll('https://www.dumingyuyuyu.com', siteOrigin);
  });
  const schema = route ? '' : `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@graph': [
      {'@type': 'WebSite', '@id': siteOrigin + '/#website', name: 'Mingyuniverse', alternateName: 'Mingyu Du Portfolio', url: siteOrigin + '/'},
      {'@type': 'Person', '@id': siteOrigin + '/#person', name: 'Mingyu Du', url: siteOrigin + '/', jobTitle: 'Motion Designer and Illustrator'}
    ]
  })}</script>`;
  return html.replace(/<\/head>/i, `<meta name="google-site-verification" content="${googleVerification}"><link rel="canonical" href="${canonical}">${schema}</head>`);
}
