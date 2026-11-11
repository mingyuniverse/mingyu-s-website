(() => {
  const fluidImages = new WeakSet();
  const imageSizes = new ResizeObserver(entries => {
    for (const {target, contentRect} of entries) {
      if (contentRect.width > 0) target.sizes = `${Math.ceil(contentRect.width)}px`;
    }
  });
  function showWork() {
    const work = document.getElementById('comp-mtc2wbc3');
    if (!work) return false;
    work.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
    return true;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('#SITE_HEADER a');
    if (!link || link.textContent.trim().toUpperCase() !== 'WORK') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (showWork()) return;
    const home = [...document.querySelectorAll('#SITE_HEADER a')].find(anchor => anchor.textContent.trim().toUpperCase() === 'HOME');
    location.href = new URL('#work', home?.href || location.origin).href;
  }, true);
  function prepareMedia() {
    // Keep each thumbnail and its caption together in the tablet grid without
    // moving Wix-managed components or changing their reading order.
    const cards = document.querySelectorAll('[data-mesh-id="comp-mtc2wbc3inlineContent-gridContainer"] > .wixui-image');
    cards.forEach((image, index) => {
      if (image.classList.contains('portfolio-project-card')) {
        image.classList.add('portfolio-project-cell');
        image.style.setProperty('--project-column', String(index % 2 + 1));
        image.style.setProperty('--project-row', String(Math.floor(index / 2) + 3));
        return;
      }
      const caption = image.nextElementSibling;
      for (const [element, offset] of [[image, 0], [caption, 1]]) {
        if (!element) continue;
        element.classList.add('portfolio-project-cell');
        element.style.setProperty('--project-column', String(index % 2 + 1));
        element.style.setProperty('--project-row', String(Math.floor(index / 2) * 2 + 3 + offset));
      }
    });
    for (const image of document.images) {
      const wrapper = image.closest('#PAGES_CONTAINER .wixui-image');
      const width = Number(image.getAttribute('width'));
      const height = Number(image.getAttribute('height'));
      if (wrapper && width > 0 && height > 0 && !wrapper.style.getPropertyValue('--portfolio-image-ratio')) {
        wrapper.style.setProperty('--portfolio-image-ratio', `${width} / ${height}`);
      }
      // Archived responsive candidates are local; update their selection size
      // when a tablet rotates without generating any CDN URLs.
      if (wrapper && !fluidImages.has(image) && image.hasAttribute('srcset')) {
        image.sizes = `${Math.ceil(image.getBoundingClientRect().width) || width}px`;
        imageSizes.observe(image);
        fluidImages.add(image);
      }
    }
    for (const paragraph of document.querySelectorAll('#PAGES_CONTAINER .wixui-rich-text p')) {
      if (!paragraph.textContent.replace(/[\s\u200b\u00a0]/g, '')) paragraph.style.display = 'none';
    }
    for (const heading of document.querySelectorAll('#PAGES_CONTAINER .wixui-rich-text :is(h2, h3, h4)')) {
      if (heading.textContent.trim().length > 140) heading.classList.add('responsive-prose');
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    prepareMedia();
    new MutationObserver(prepareMedia).observe(document.getElementById('PAGES_CONTAINER'), {childList: true, subtree: true});
    if (location.hash === '#work') document.fonts.ready.then(() => requestAnimationFrame(showWork));
  });
})();
