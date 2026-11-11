import {readFileSync} from 'node:fs';
import {escapeHtml} from './seo.mjs';

const collections = JSON.parse(readFileSync(new URL('../assets/collections.json', import.meta.url), 'utf8'));
const titles = {
  'portfolio-collections/illustration-style-frames': 'Illustration & Style Frames',
  'portfolio-collections/my-portfolio': 'Illustrated Picture Book',
  'portfolio-collections/motion-media-design': 'Motion Media Design',
};

export function applyCollections(html, route) {
  const items = collections[route];
  if (!items) return html;
  if (!items.length) throw new Error(`Empty archived collection: ${route}`);
  const prefix = '../'.repeat(route.split('/').length);
  const id = 'comp-m3znw8x5';
  const opening = new RegExp(`<div\\b[^>]*\\bid="${id}"[^>]*>`, 'i').exec(html);
  if (!opening) throw new Error('Missing collection slot: ' + route);
  let depth = 1;
  const tokens = /<\/?div\b[^>]*>/gi;
  tokens.lastIndex = opening.index + opening[0].length;
  let end;
  while (depth && (end = tokens.exec(html))) depth += end[0].startsWith('</') ? -1 : 1;
  if (depth) throw new Error('Unbalanced collection markup');
  const cards = items.map(item => `<a class="independent-collection-card" href="${prefix}${new URL(item.href).pathname.slice(1)}"><img src="${escapeHtml(item.src)}" srcset="${escapeHtml(item.srcset || '')}" alt="${escapeHtml(item.title)}" width="1090" height="818" loading="lazy"><span>${escapeHtml(item.title)}</span></a>`).join('');
  const markup = `<section id="${id}" class="independent-collection"><a class="independent-collection-back" href="${prefix}selected-work/">Back to Portfolio</a><h1 class="font_2">${escapeHtml(titles[route])}</h1><div class="independent-collection-grid">${cards}</div></section>`;
  html = html.slice(0, opening.index) + markup + html.slice(tokens.lastIndex);
  return html.replace(/<\/head>/i, `<style>
    #${id}.independent-collection { box-sizing:border-box; width:calc(100% - 70px); max-width:1200px; margin:0 auto; padding:40px 0 100px; position:relative; left:auto; }
    .independent-collection-back { display:inline-block; margin-bottom:35px; color:inherit; font:16px/1.4 proxima-n-w01-reg,sans-serif; text-decoration:none; }
    .independent-collection-back:hover { text-decoration:underline; }
    .independent-collection h1 { text-align:center; margin:0 0 56px; color:#211d38; }
    .independent-collection-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:40px; }
    .independent-collection-card { display:block; position:relative; overflow:hidden; aspect-ratio:4/3; color:#fff; }
    .independent-collection-card img { display:block; width:100%; height:100%; object-fit:cover; }
    .independent-collection-card span { position:absolute; inset:0; display:grid; place-content:center; padding:25px; text-align:center; background:#0005; opacity:0; transition:opacity .2s; font:24px/1.4 proxima-n-w01-reg,sans-serif; }
    .independent-collection-card:hover span,.independent-collection-card:focus-visible span { opacity:1; }
    .portfolio-responsive #${id}.independent-collection { width:100%; padding:30px 20px 70px; }
    .portfolio-responsive .independent-collection h1 { margin-bottom:30px; font-size:32px; }
    @media(max-width:600px) { .portfolio-responsive .independent-collection-grid { grid-template-columns:1fr; gap:25px; } }
  </style></head>`);
}
