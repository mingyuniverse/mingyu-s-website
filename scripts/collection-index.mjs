import {replaceElement} from './markup.mjs';
import {escapeHtml} from './seo.mjs';

export function applyCollectionIndex(html) {
  const titles = {
    'my-portfolio': 'Illustrated Picture Book',
    'illustration-style-frames': 'Illustration & Style Frames',
    'motion-media-design': 'Motion Media Design',
  };
  const cards = [];
  for (const [slug, title] of Object.entries(titles)) {
    const anchor = html.match(new RegExp(`<a\\b[^>]*href="https://www\\.dumingyuyuyu\\.com/portfolio-collections/${slug}"[^>]*>([\\s\\S]*?)<\\/a>`))?.[1];
    const images = [...(anchor || '').matchAll(/<img\b[^>]*>/g)];
    let image = images.at(-1)?.[0];
    if (!image) throw new Error('Missing collection cover: ' + slug);
    image = image.replace(/\b(?:style|class|data-hook)="[^"]*"/g, '')
      .replace(/\balt="[^"]*"/, `alt="${escapeHtml(title)}"`)
      .replace(/\bloading="[^"]*"/, 'loading="lazy"');
    const candidates = [...anchor.matchAll(/<source\b[^>]*\bsrcset="([^"]*)"/gi)].map(match => match[1]);
    const sourceSet = candidates.find(sources => sources.includes(' 2x'));
    if (sourceSet) {
      const widths = new Map();
      for (const [, url] of sourceSet.matchAll(/(\S+)\s+[\d.]+x(?=,|$)/g)) {
        const width = url.match(/\/(?:fill|fit)\/w_(\d+)/)?.[1];
        if (width) widths.set(width, url);
      }
      image = image.replace(/^<img/i, `<img sizes="(max-width:699px) 90vw, 42vw" srcset="${[...widths].map(([width,url]) => `${url} ${width}w`).join(', ')}"`);
    }
    cards.push(`<a class="portfolio-collection-tile" href="../portfolio-collections/${slug}/"><div>${image}</div><h2>${escapeHtml(title)}</h2></a>`);
  }
  return replaceElement(html, 'comp-m3znw9ds', `<section id="portfolio-collection-index"><h1>SELECTED WORK</h1><div class="portfolio-collection-index-grid">${cards.join('')}</div></section>`);
}
