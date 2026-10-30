// Keep metadata on the custom domain when Wix refreshes the page head.
(() => {
  function update() {
    let path = location.pathname.replace(/^\/mingyu-s-website(?=\/|$)/, '').replace(/\/(?:index|view-desktop|view-mobile)\.html$/, '/');
    if (path === '/home' || path === '/home/') path = '/';
    if (!path.endsWith('/')) path += '/';
    const canonical = 'https://mingyuniverse.com' + path;
    for (const link of document.querySelectorAll('link[rel="canonical"]')) {
      if (link.getAttribute('href') !== canonical) link.setAttribute('href', canonical);
    }
    const title = path === '/' ? 'Mingyuniverse | Mingyu Du — Motion Designer & Illustrator' : document.title.replace(/Dumingyuyuyu/gi, 'Mingyuniverse');
    if (document.title !== title) document.title = title;
    for (const [name, value] of [['og:url', canonical], ['og:site_name', 'Mingyuniverse'], ['og:title', title], ['twitter:title', title]]) {
      const meta = document.querySelector(`meta[property="${name}"],meta[name="${name}"]`);
      if (meta && meta.getAttribute('content') !== value) meta.setAttribute('content', value);
    }
    for (const schema of document.querySelectorAll('script[type="application/ld+json"]')) {
      const corrected = schema.textContent.replaceAll('https://www.dumingyuyuyu.com', 'https://mingyuniverse.com').replaceAll('Dumingyuyuyu', 'Mingyuniverse');
      if (schema.textContent !== corrected) schema.textContent = corrected;
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    update();
    new MutationObserver(update).observe(document.head, {childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'content'], characterData: true});
  });
})();
