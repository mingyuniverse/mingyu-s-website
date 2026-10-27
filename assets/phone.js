(() => {
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
    for (const image of document.images) {
      const wrapper = image.closest('#PAGES_CONTAINER .wixui-image');
      const width = Number(image.getAttribute('width'));
      const height = Number(image.getAttribute('height'));
      if (wrapper && width > 0 && height > 0 && !wrapper.style.getPropertyValue('--phone-image-ratio')) {
        wrapper.style.setProperty('--phone-image-ratio', `${width} / ${height}`);
      }
    }
    for (const paragraph of document.querySelectorAll('#PAGES_CONTAINER .wixui-rich-text p')) {
      if (!paragraph.textContent.replace(/[\s\u200b\u00a0]/g, '')) paragraph.style.display = 'none';
    }
    for (const heading of document.querySelectorAll('#PAGES_CONTAINER .wixui-rich-text :is(h2, h3, h4)')) {
      if (heading.textContent.trim().length > 140) heading.classList.add('phone-prose');
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    prepareMedia();
    new MutationObserver(prepareMedia).observe(document.getElementById('PAGES_CONTAINER'), {childList: true, subtree: true});
    if (location.hash === '#work') document.fonts.ready.then(() => requestAnimationFrame(showWork));
  });
})();
