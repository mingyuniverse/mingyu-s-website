export function applyProjectImages(html, paths, images, label, prefix = '../') {
  const sources = {};
  for (const [id, file] of Object.entries(images)) {
    const src = sources[id] = prefix + paths[file];
    const image = new RegExp(`<img\\b[^>]*\\bid="${id}"[^>]*>`, 'i');
    if (!image.test(html)) throw new Error(`Missing project image slot: ${id}`);
    html = html.replace(image, tag => tag.replace(/\s+(?:srcset|src|alt)="[^"]*"/gi, '')
      .replace(/^<img/i, `<img src="${src}" alt="${label(file)}"`));
  }
  // Keep the local files when Wix updates responsive image attributes.
  return html.replace(/<\/head>/i, `<script>(() => {
    const sources = ${JSON.stringify(sources)};
    const apply = () => {
      for (const [id, src] of Object.entries(sources)) {
        const image = document.getElementById(id);
        if (!image) continue;
        if (image.getAttribute('src') !== src) image.setAttribute('src', src);
        if (image.hasAttribute('srcset')) image.removeAttribute('srcset');
      }
    };
    new MutationObserver(apply).observe(document.documentElement, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset']
    });
    apply();
  })();</script></head>`);
}
