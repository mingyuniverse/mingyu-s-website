import {elementById, replaceElement} from './markup.mjs';

export function applyAbout(html) {
  const greeting = elementById(html, 'comp-mhaw320o').html;
  let biography = elementById(html, 'comp-mhaw320q').html;
  biography = biography.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/g, (tag, body) =>
    body.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;|\s/g, '') ? tag : '');
  biography = biography.replace('mailto:adfisherdesign@gmail.com', 'mailto:dumingyu17@gmail.com');
  let portrait = elementById(html, 'comp-mhaw24mj').html.match(/<img\b[^>]*>/i)?.[0];
  if (!portrait) throw new Error('Missing About portrait');
  const width = Number(portrait.match(/\bwidth="(\d+)"/i)?.[1]);
  portrait = portrait.replace(/\balt="[^"]*"/, 'alt="Mingyu Du portrait"')
    .replace(/\bsrcset="([^"]*)"/i, (_, sources) => `srcset="${sources.replace(/(\S+)\s+([\d.]+)x(?=,|$)/g, (_, url, density) => `${url} ${Math.round(width * Number(density))}w`)}"`)
    .replace(/\bsizes="[^"]*"/i, 'sizes="(max-width: 699px) 85vw, min(34vw, 760px)"');
  return replaceElement(html, 'comp-lt8pjhkt', `<section id="portfolio-about"><h1>ABOUT ME</h1><div class="portfolio-about-grid"><div class="portfolio-about-copy">${greeting}${biography}</div><figure class="portfolio-about-portrait">${portrait}</figure></div></section>`);
}
