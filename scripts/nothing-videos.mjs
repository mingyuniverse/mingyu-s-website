export const nothingVideos = {
  'comp-mvqv32lg': 'main.mp4',
  'comp-mvqvcujd': 'clip-1.mp4',
  'comp-mvqvfweo': 'clip-2.mp4',
  'comp-mvqvi5h6': 'clip-3.mp4',
};

export function applyNothingVideos(html, paths) {
  return applyProjectVideos(html, paths, nothingVideos, 'Nothing 3D logo animation', 'nothing-video');
}

export function applyProjectVideos(html, paths, slots, title, className, options = {}) {
  const entries = Object.entries(slots);
  const selector = entries.map(([id]) => `#${id} > :not(.${className})`).join(',');
  const markup = {};
  const prefix = options.prefix ?? '../';
  entries.forEach(([id, file], index) => {
    const loop = options.loops ? options.loops.includes(file) : index > 0;
    const poster = options.posters?.[file];
    markup[id] = `<video class="${className}" src="${prefix}${paths[file]}" playsinline preload="${index ? 'none' : 'metadata'}" controls ${loop ? 'muted loop' : ''}${poster ? ` poster="${prefix}${paths[poster]}"` : ''} aria-label="${options.labels?.[file] ?? (title + (index ? ' — clip ' + index : ''))}"></video>`;
    const opening = new RegExp(`<div\\b[^>]*\\bid="${id}"[^>]*>`);
    if (!opening.test(html)) throw new Error(`Missing project video slot: ${id}`);
    html = html.replace(opening, tag => tag + markup[id]);
    html = html.replace(new RegExp(`<wix-video\\b[^>]*\\bid="videoContainer_${id}"[^>]*>[\\s\\S]*?<\\/wix-video>`), '');
  });
  return html.replace(/<\/head>/i, `<style>
    ${selector} { visibility: hidden !important; pointer-events: none !important; }
    .${className} { position:absolute; inset:0; z-index:2; width:100%; height:100%; object-fit:contain; background:#000; }
  </style><script>
  (() => {
    const markup = ${JSON.stringify(markup)};
    const slotIds = new Set(Object.keys(markup));
    const isLocalVideo = media => media.classList.contains('${className}');
    const isProjectMedia = media => {
      for (let parent = media.parentElement; parent; parent = parent.parentElement) {
        if (slotIds.has(parent.id)) return true;
      }
      return false;
    };
    function disableLegacyMedia(media) {
      if (!media.muted) media.muted = true;
      if (media.volume !== 0) media.volume = 0;
      if (media.autoplay) media.autoplay = false;
      if (!media.paused) media.pause();
    }
    // Wix hydration recreates its hidden video. Hiding the controls alone does
    // not stop audio, and its delegated click handler still sees native clicks.
    for (const event of ['play', 'playing', 'volumechange']) {
      document.addEventListener(event, e => {
        const media = e.target;
        if (media instanceof HTMLMediaElement && !isLocalVideo(media) && isProjectMedia(media)) {
          e.stopImmediatePropagation();
          disableLegacyMedia(media);
        }
      }, true);
    }
    const isolated = new WeakSet();
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const observed = new WeakSet();
    const visibility = new IntersectionObserver(entries => {
      for (const {target, isIntersecting} of entries) {
        if (isIntersecting && !reduceMotion.matches) target.play().catch(() => {});
        else if (!isIntersecting) target.pause();
      }
    });
    function reconcile() {
      for (const [id, html] of Object.entries(markup)) {
        const slot = document.getElementById(id);
        if (!slot) continue;
        if (!slot.querySelector(':scope > .${className}')) slot.insertAdjacentHTML('afterbegin', html);
        const video = slot.querySelector(':scope > .${className}');
        for (const media of slot.querySelectorAll('video, audio')) {
          if (!isLocalVideo(media)) disableLegacyMedia(media);
        }
        if (!isolated.has(video)) {
          isolated.add(video);
          for (const event of ['click', 'dblclick', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'keydown', 'keyup']) {
            video.addEventListener(event, e => e.stopPropagation());
          }
        }
        if (video.loop && !observed.has(video)) {
          observed.add(video);
          visibility.observe(video);
        }
      }
    }
    new MutationObserver(reconcile).observe(document.documentElement, {childList:true, subtree:true});
    reconcile();
  })();
  </script></head>`);
}
