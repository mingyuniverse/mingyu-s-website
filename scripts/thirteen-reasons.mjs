import {applyProjectVideos} from './nothing-videos.mjs';

const slots = {
  'comp-mtc94i5p': 'title-sequence.mp4',
  'comp-mtc9kb6m': 'episode-cards.mp4',
  'comp-mtc9p5y5': 'social-platform.mp4',
  'comp-mtca19sg': 'instagram-mockups.mp4',
};
const poster = 'instagram-poster.jpg';
export const thirteenFiles = [...Object.values(slots), poster];
export function applyThirteenReasons(html, paths) {
  return applyProjectVideos(html, paths, slots, '13 Reasons Why', 'thirteen-reasons-video', {
    loops: ['social-platform.mp4', 'instagram-mockups.mp4'],
    posters: {'instagram-mockups.mp4': poster},
    labels: {
      'title-sequence.mp4': '13 Reasons Why — title sequence',
      'episode-cards.mp4': '13 Reasons Why — episode cards',
      'social-platform.mp4': '13 Reasons Why — social platform',
      'instagram-mockups.mp4': '13 Reasons Why — three Instagram mockups',
    },
  });
}
