export function elementById(html, id) {
  const start = new RegExp(`<([a-z][\\w-]*)\\b[^>]*\\bid="${id}"[^>]*>`, 'i').exec(html);
  if (!start) throw new Error(`Missing element: ${id}`);
  const tokens = new RegExp(`<\\/?${start[1]}\\b[^>]*>`, 'gi');
  tokens.lastIndex = start.index + start[0].length;
  let depth = 1;
  let token;
  while (depth && (token = tokens.exec(html))) depth += token[0].startsWith('</') ? -1 : 1;
  if (depth) throw new Error(`Unbalanced element: ${id}`);
  return {start: start.index, end: tokens.lastIndex, html: html.slice(start.index, tokens.lastIndex)};
}

export function replaceElement(html, id, markup) {
  const element = elementById(html, id);
  return html.slice(0, element.start) + markup + html.slice(element.end);
}
