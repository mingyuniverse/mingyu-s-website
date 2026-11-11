import {applyProjectImages} from './project-images.mjs';

const images = {
  'img_comp-mvfpdnrw': 'render-01.png',
  'img_comp-mvfpfmf9': 'render-02.png',
  'img_comp-mvfpjn5d': 'sketch.png',
  'img_comp-mvfpl2wx': 'white-model.jpg',
};
const labels = {
  'render-01.png': 'Still Life — first finished render',
  'render-02.png': 'Still Life — second finished render',
  'sketch.png': 'Still Life — concept sketch',
  'white-model.jpg': 'Still Life — white model',
};
export const stillLifeFiles = Object.values(images);
export function applyStillLife(html, paths) {
  return applyProjectImages(html, paths, images, file => labels[file]);
}
