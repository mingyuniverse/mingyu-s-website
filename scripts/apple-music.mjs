import {applyProjectImages} from './project-images.mjs';
import {applyProjectVideos} from './nothing-videos.mjs';

const images = {
  'img_comp-mtc8eyv0': 'flower.png',
  'img_comp-mtc8n1c3': 'art.png',
  'img_comp-mtc8n1c7': 'art-1.png',
  'img_comp-mtc8n1c9': 'art-2.png',
  'img_comp-mtc8n1c8': 'art-3.png',
  'img_comp-mtc8n1c6': 'art-4.png',
  'img_comp-mtc8n1c5': 'art-5.png',
};
const sketches = Array.from({length: 8}, (_, i) => `sketch-${i + 1}.png`);
export const appleMusicFiles = ['motion.mp4', 'motion-poster.jpg', ...Object.values(images), ...sketches];

export function applyAppleMusic(html, paths) {
  html = applyProjectVideos(html, paths, {'comp-mtc8dtcq': 'motion.mp4'}, 'Apple Music animation', 'apple-music-video', {
    loops: ['motion.mp4'],
    posters: {'motion.mp4': 'motion-poster.jpg'},
  });
  html = applyProjectImages(html, paths, images, file => file === 'flower.png' ? 'Apple Music — flower illustration' : 'Apple Music — finished illustration');
  const gridId = 'comp-mtc8jbhhinlineContent-gridContainer';
  const opening = new RegExp(`<div\\b[^>]*data-mesh-id="${gridId}"[^>]*>`);
  if (!opening.test(html)) throw new Error('Missing Apple Music sketch section');
  const gallery = `<div class="apple-music-sketches" role="group" aria-label="Apple Music sketches">${sketches.map((file, i) =>
    `<img src="../${paths[file]}" alt="Apple Music sketch ${i + 1}" width="1920" height="1080" loading="lazy" decoding="async">`
  ).join('')}</div>`;
  html = html.replace(opening, tag => tag + gallery);
  return html.replace(/<\/head>/i, `<style>
    #comp-mtc8jbhh [data-mesh-id="${gridId}"] { display:block !important; }
    #comp-mtc8jbhh [data-mesh-id="${gridId}"] > :not(.apple-music-sketches) { display:none !important; }
    .apple-music-sketches { box-sizing:border-box; width:min(100%, 1664px); margin-inline:auto; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
    .apple-music-sketches img { display:block; width:100%; height:auto; }
    @media(max-width:700px) { .apple-music-sketches { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  </style><script>(() => {
    const restore = () => {
      const grid = document.querySelector('[data-mesh-id="${gridId}"]');
      if (grid && !grid.querySelector(':scope > .apple-music-sketches')) grid.insertAdjacentHTML('afterbegin', ${JSON.stringify(gallery)});
    };
    new MutationObserver(restore).observe(document.documentElement, {childList:true, subtree:true});
    restore();
  })();</script></head>`);
}
