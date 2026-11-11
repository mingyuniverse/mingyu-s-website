import {applyProjectVideos} from './nothing-videos.mjs';

const projects = {
  '1984': {id: 'comp-mtc64g7k', file: '1984', title: '1984 — title sequence', loop: true},
  towriteloveonherarms: {id: 'comp-mtc6dl5u', file: 'twloha', title: 'To Write Love on Her Arms — PSA', loop: false},
};
export const mome729Files = Object.values(projects).flatMap(({file}) => [`${file}.mp4`, `${file}-poster.jpg`]);
export function applyMome729Video(html, paths, route) {
  if (!Object.hasOwn(projects, route)) return html;
  const {id, file, title, loop} = projects[route];
  const video = `${file}.mp4`;
  return applyProjectVideos(html, paths, {[id]: video}, title, 'mome729-video', {
    loops: loop ? [video] : [],
    posters: {[video]: `${file}-poster.jpg`},
  });
}
