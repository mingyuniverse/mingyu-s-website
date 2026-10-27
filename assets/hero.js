/* Start the decorative loop independently of the Wix image loader. */
(() => {
  const prefix = location.hostname === 'mingyuniverse.github.io' ? '/mingyu-s-website/' : '/';
  const poster = prefix + '__HERO_POSTER__';
  const source = prefix + '__HERO_VIDEO__';
  const original = '00e65c_51797683792340eab5c0d7eecda6ce30~mv2.gif';
  const isHero = value => typeof value === 'string' && value.includes(original);

  // Hydration can restore the source GIF. Map only this decorative image to
  // its small poster before the browser starts a 25 MB request.
  const nativeSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    if (this instanceof HTMLImageElement && /^(src|srcset)$/i.test(name) && isHero(value)) {
      value = name.toLowerCase() === 'srcset' ? '' : poster;
    }
    return nativeSetAttribute.call(this, name, value);
  };
  for (const name of ['src', 'srcset']) {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, name);
    Object.defineProperty(HTMLImageElement.prototype, name, {
      ...descriptor,
      set(value) { descriptor.set.call(this, isHero(value) ? (name === 'srcset' ? '' : poster) : value); }
    });
  }

  let media;
  let video;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  function reconcile() {
    const originalImage = document.getElementById('img_comp-mh5b5hv8');
    if (!originalImage) {
      if (video && !video.paused) video.pause();
      return;
    }
    if (!media) {
      media = document.createElement('div');
      media.id = 'portfolio-hero-media';
      media.className = originalImage.className + ' portfolio-hero-media';
      video = document.createElement('video');
      video.id = 'portfolio-hero-animation';
      video.muted = true; video.defaultMuted = true; video.loop = true; video.playsInline = true;
      video.preload = 'auto'; video.poster = poster; video.src = source;
      video.setAttribute('aria-hidden', 'true'); video.tabIndex = -1;
      media.append(video);
    }
    if (media.parentElement !== originalImage.parentElement) {
      originalImage.parentElement.append(media);
      video.autoplay = false;
    }
    if (reducedMotion.matches) {
      video.autoplay = false;
      video.pause();
    } else if (!video.autoplay) {
      video.autoplay = true;
      video.play().catch(() => {}); // The poster remains visible if autoplay is unavailable.
    }
  }
  new MutationObserver(reconcile).observe(document.documentElement, {childList: true, subtree: true});
  reducedMotion.addEventListener('change', reconcile);
  reconcile();
})();
