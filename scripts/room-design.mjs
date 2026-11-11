import {applyProjectImages} from './project-images.mjs';
import {applyProjectVideos} from './nothing-videos.mjs';

const roomImages = {
  'img_comp-mvfomza6': 'A1_01.jpg',
  'img_comp-mvfov06f': 'A1_02.jpg',
  'img_comp-mvfox5uu': 'A1_03.jpg',
};
export const roomFiles = ['main.mp4', ...Object.values(roomImages)];

export function applyRoomDesign(html, paths) {
  html = applyProjectVideos(html, paths, {'comp-mvfoh6ri': 'main.mp4'}, 'Room Design animation', 'room-design-video');
  return applyProjectImages(html, paths, roomImages, file => `Room Design render ${file.slice(3, 5)}`);
}
