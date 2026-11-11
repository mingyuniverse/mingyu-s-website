// Express the original desktop composition in viewport-relative design units.
// The 1600px reference gives the staggered work a consistent 90% canvas width.
export function applyFluidHome(html) {
  const fluid = css => {
    const protectedParts = [];
    css = css.replace(/url\([\s\S]*?\)|@(?:media|supports)[^{]+/gi, value => {
      protectedParts.push(value);
      return `__HOME_CSS_${protectedParts.length - 1}__`;
    });
    css = css.replace(/(-?(?:\d*\.)?\d+)px\b/g, (_, value) => Number(value) === 0 ? '0px' : `calc(${value} * var(--portfolio-design-unit))`);
    return css.replace(/__HOME_CSS_(\d+)__/g, (_, index) => protectedParts[index]);
  };
  html = html.replace(/(<style\b[^>]*id="(?:css_masterPage|css_c1dmp)"[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_, open, css, close) => open + fluid(css) + close);
  html = html.replace(/\bstyle="([^"]*)"/gi, (_, css) => `style="${fluid(css)}"`);
  return html;
}
