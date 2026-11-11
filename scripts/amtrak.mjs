import {applyProjectImages} from './project-images.mjs';
import {applyProjectVideos} from './nothing-videos.mjs';

export const amtrakRoute = 'portfolio-collections/motion-media-design/project-title-4';
const videos = {'comp-mtbucj2u': 'intro.mp4', 'comp-mtc1wfc4': 'stamp.mp4'};
const images = {
  'img_comp-mtc15zzl': 'stamps/truckee.png',
  'img_comp-mtc1eyw0': 'stamps/denver_no bg.png',
  'img_comp-mtc15zzk': 'stamps/chicago.png',
  'img_comp-mtc15zzo1': 'stamps/new orleans.png',
  'img_comp-mtc15zzp': 'stamps/los angeles.png',
  'img_comp-mtc15zzp1': 'stamps/houston.png',
  'img_comp-mtc15zzq': 'stamps/jacksonville_no bg.png',
  'img_comp-mtc15zzo': 'stamps/miami.png',
  'img_comp-mtc15zzn1': 'stamps/orlando.png',
  'img_comp-mtc15zzm': 'stamps/seattle.png',
  'img_comp-mtc15zzm2': 'stamps/salinas.png',
  'img_comp-mtc15zzm1': 'stamps/santa barbara.png',
  'img_comp-mtc15zzn': 'stamps/portland.png',
  'img_comp-mtc7z4iu': 'project-photos.png',
};
export const amtrakFiles = [...Object.values(videos), ...Object.values(images)];

export function applyAmtrak(html, paths) {
  const prefix = '../'.repeat(amtrakRoute.split('/').length);
  html = applyProjectVideos(html, paths, videos, 'Amtrak', 'amtrak-video', {
    prefix, loops: Object.values(videos),
    labels: {'intro.mp4': 'Amtrak — project introduction', 'stamp.mp4': 'Amtrak — animated stamps'},
  });
  return applyProjectImages(html, paths, images, file => file === 'project-photos.png'
    ? 'Amtrak project photographs' : `Amtrak stamp — ${file.slice(7, -4).replace('_no bg', '')}`, prefix);
}
