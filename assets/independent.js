// The portfolio has no hosted-editor runtime or remote API dependency.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const prefix = location.hostname === 'mingyuniverse.github.io' ? '/mingyu-s-website' : '';
  function ready() {
    const animatedIds = new Set();
    for (const style of document.querySelectorAll('style')) {
      for (const match of style.textContent.matchAll(/#([\w-]+):not\(\[data-motion-enter=/g)) animatedIds.add(match[1]);
    }
    const entrances = new IntersectionObserver(entries => {
      for (const {target, isIntersecting} of entries) {
        if (!isIntersecting) continue;
        if (reduced.matches) target.dataset.motionEnter = 'done';
        else target.style.animationPlayState = 'running';
        entrances.unobserve(target);
      }
    });
    for (const id of animatedIds) {
      const element = document.getElementById(id);
      if (element) entrances.observe(element);
    }
    // Static custom tags retain their captured layout without registering any
    // remote custom elements. All links use ordinary browser navigation.
    for (const link of document.querySelectorAll('a[href]')) {
      if (prefix && link.getAttribute('href')?.startsWith('/') && !link.getAttribute('href').startsWith(prefix + '/')) link.href = prefix + link.getAttribute('href');
    }
    const work = document.getElementById('comp-mtc2wbc3');
    if (work) work.dataset.portfolioWork = 'true';
    document.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link) return;
      if (link.closest('#SITE_HEADER') && link.textContent.trim().toUpperCase() === 'WORK') {
        event.preventDefault();
        if (work) work.scrollIntoView({behavior: reduced.matches ? 'instant' : 'smooth'});
        else location.href = prefix + '/#work';
      }
    });
    if (location.hash === '#work' && work) document.fonts.ready.then(() => work.scrollIntoView());
    document.getElementById('SKIP_TO_CONTENT_BTN')?.addEventListener('click', () => {
      const main = document.getElementById('PAGES_CONTAINER');
      if (main) { main.tabIndex = -1; main.focus(); }
    });
    // Pause an audible film when a second film starts, including keyboard
    // playback, while decorative muted loops can continue independently.
    document.addEventListener('play', event => {
      if (!(event.target instanceof HTMLVideoElement) || event.target.muted) return;
      for (const video of document.querySelectorAll('video')) if (video !== event.target && !video.muted) video.pause();
    }, true);
  }
  document.addEventListener('DOMContentLoaded', ready);
})();
