// Keep the approved biography identical in SSR and after Wix hydration.
const textClass = 'wixui-rich-text__text';
const emphasis = text => `<a href="/" class="${textClass}" style="color:#3622B2;font-weight:bold;">${text}</a>`;
const wrap = html => `<span class="color_36 ${textClass}" style="font-family:avenir-lt-w01_35-light1475496,sans-serif;font-weight:normal;letter-spacing:normal;">${html}</span>`;
export const biography = [
  wrap(`I’m a ${emphasis('Motion designer')} and ${emphasis('Illustrator')} working across 2D and 3D, currently pursuing an MFA in Motion Media Design at SCAD Atlanta. I create animations, illustrations, and brand visuals, exploring how movement, color, and texture can shape a story.`),
  wrap('In my personal work, I often return to themes of mindfulness, self-growth, and emotional balance. I’m interested in giving these ideas a visual form through characters, environments, and everyday moments. My commercial and collaborative projects explore branding, graphic design, and visual systems. Across these different projects, I enjoy trying new approaches and finding a visual language that fits each idea.')
];
export function applyBiography(html) {
  return html.replace(/(<div\b[^>]*id="comp-mh5d44jq"[^>]*>)([\s\S]*?)(<\/div>)/, (_, open, content, close) => {
    let index = 0;
    return open + content.replace(/(<p\b[^>]*>)([\s\S]*?)(<\/p>)/g, (whole, start, body, end) => {
      if (!/My work focuses|I&rsquo;m drawn/.test(body)) return whole;
      return start + biography[index++] + end;
    }) + close;
  });
}
export const biographyScript = `(() => {
  const content = ${JSON.stringify(biography)};
  const plain = content.map(html => { const e = document.createElement('div'); e.innerHTML = html; return e.textContent; });
  function updateBiography() {
    const container = document.getElementById('comp-mh5d44jq');
    if (!container) return;
    const paragraphs = [...container.querySelectorAll('p')].filter(p => /[a-z]/i.test(p.textContent));
    paragraphs.slice(0, 2).forEach((p, i) => {
      if (p.textContent !== plain[i]) p.innerHTML = content[i];
    });
  }
  new MutationObserver(updateBiography).observe(document.documentElement, {childList:true, subtree:true, characterData:true});
  document.addEventListener('DOMContentLoaded', updateBiography);
})();`;
