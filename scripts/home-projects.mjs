import {escapeHtml} from './seo.mjs';

export const homeProjects = [
  ['comp-mvqvldh5', 'comp-mvqvm027', 'NOTHING', '3D LOGO ANIMATION'],
  ['comp-mtc3ebrh', 'comp-mtc3fbe0', 'Travel Brand Experience x Amtrak', 'Illustration & Motion'],
  ['comp-mtc4ixz1', 'comp-mtc4n5vu', '13 Reasons Why', 'Multiplatform Network Branding and Design'],
  ['comp-mtc4xx77', 'comp-mtc51q57', 'ROOM DESIGN - BACKROOM', '3D Modeling'],
  ['comp-mtc2wbcb2', 'comp-mtc3r0oi', 'Abstract Objects', '3D Modeling'],
  ['comp-mtc4al72', 'comp-mtc4eqp4', 'TO WRITE LOVE ON HER ARMS', 'PSA'],
  ['comp-mtc46fey', 'comp-mtc41alv', 'Apple Music', '2D Visual Beats'],
  ['comp-mtc4uugv', 'comp-mtc511bg', '1984', 'Title Sequence'],
];

export function applyHomeProjects(html) {
  for (const [imageId, captionId, title, medium] of homeProjects) {
    const caption = new RegExp(`<div\\b[^>]*\\bid="${captionId}"[^>]*>[\\s\\S]*?<\\/div>`);
    if (!caption.test(html)) throw new Error(`Missing home caption: ${captionId}`);
    html = html.replace(caption, '');
    const image = new RegExp(`(<div\\b[^>]*\\bid="${imageId}"[^>]*>)([\\s\\S]*?)(<\\/div>)`);
    if (!image.test(html)) throw new Error(`Missing home cover: ${imageId}`);
    html = html.replace(image, (_, open, body, close) => {
      const img = body.match(/<img\b[^>]*>/)?.[0];
      const width = img?.match(/\bwidth="(\d+)"/)?.[1];
      const height = img?.match(/\bheight="(\d+)"/)?.[1];
      if (!width || !height) throw new Error(`Missing image dimensions: ${imageId}`);
      open = open.replace(/class="([^"]*)"/, 'class="$1 portfolio-project-card"');
      open = open.replace(/>$/, ` style="--portfolio-cover-ratio:${width}/${height}">`);
      body = body.replace(/<a\b([^>]*)>/, (tag, attrs) => `<a${attrs} aria-label="${escapeHtml(title)}" data-project-cover>`)
        .replace('</a>', `<span class="portfolio-project-title" aria-hidden="true">${escapeHtml(title)}</span></a>`);
      return open + body + `<p class="portfolio-project-medium">${escapeHtml(medium)}</p>` + close;
    });
  }
  return html;
}
