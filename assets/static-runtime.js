/* Keep the original Wix visual runtime while serving every page as static HTML. */
(() => {
  'use strict';
  const source = 'https://www.dumingyuyuyu.com';
  const prefix = location.hostname === 'mingyuniverse.github.io' ? '/mingyu-s-website' : '';
  const site = location.origin + prefix;
  const base = document.createElement('base');
  base.href = site + '/?static-runtime=1';
  document.head.append(base);

  function localize(text) {
    return text.split(source).join(site)
      .split(source.replaceAll('/', '\\/')).join(site.replaceAll('/', '\\/'));
  }
  window.portfolioLocalizeModel = id => {
    const element = document.getElementById(id);
    if (element) element.textContent = localize(element.textContent);
  };

  // Wix exposes these public read endpoints with CORS. Cookies are never sent.
  function installFetchBridge(scope, sourceOrigin, siteOrigin) {
    const fetchOriginal = scope.fetch.bind(scope);
    const sourceUrl = new URL(sourceOrigin);
    const siteUrl = new URL(siteOrigin);
    const sitePrefix = siteUrl.pathname.replace(/\/$/, '');
    scope.fetch = async function(input, init) {
      const original = new Request(input, init);
      const url = new URL(original.url);
      let path = url.pathname;
      if (url.origin === siteUrl.origin && sitePrefix && path.startsWith(sitePrefix + '/')) {
        path = path.slice(sitePrefix.length);
      }
      const publicRead = path.startsWith('/_api/') || path === '/_serverless/portfolio-router/pages';
      if (!publicRead || (url.origin !== siteUrl.origin && url.origin !== sourceUrl.origin)) {
        return fetchOriginal(input, init);
      }
      const target = sourceOrigin + path + url.search;
      const forwarded = new Request(target, original);
      const response = await fetchOriginal(new Request(forwarded, {mode: 'cors', credentials: 'omit'}));
      if (!/json/i.test(response.headers.get('Content-Type') || '')) return response;
      const text = (await response.text()).split(sourceOrigin).join(siteOrigin)
        .split(sourceOrigin.replaceAll('/', '\\/')).join(siteOrigin.replaceAll('/', '\\/'));
      const headers = new Headers(response.headers);
      headers.delete('content-length');
      headers.delete('content-encoding');
      return new Response(text, {status: response.status, statusText: response.statusText, headers});
    };
  }
  installFetchBridge(window, source, site);

  // Import the unchanged public worker inside a same-origin Blob, with the
  // same direct-read adapter. This removes the old /_partials proxy dependency.
  const NativeWorker = window.Worker;
  if (NativeWorker) {
    const bridge = '(' + installFetchBridge.toString() + ')(self,' + JSON.stringify(source) + ',' + JSON.stringify(site) + ');';
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        let target = new URL(String(url), location.href).href;
        const partials = site + '/_partials/';
        if (target.startsWith(partials)) {
          target = 'https://static.parastorage.com/services/' + target.slice(partials.length);
        }
        const script = bridge + '\nimportScripts(' + JSON.stringify(target) + ');';
        const blobUrl = URL.createObjectURL(new Blob([script], {type: 'application/javascript'}));
        super(blobUrl, options);
      }
    };
  }

  const xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    const parsed = new URL(String(url), location.href);
    let path = parsed.pathname;
    if (prefix && path.startsWith(prefix + '/')) path = path.slice(prefix.length);
    if (parsed.origin === location.origin && (path.startsWith('/_api/') || path === '/_serverless/portfolio-router/pages')) {
      url = source + path + parsed.search;
    }
    return xhrOpen.call(this, method, url, ...rest);
  };

  function localizeLinks() {
    for (const anchor of document.querySelectorAll('a[href]')) {
      const url = new URL(anchor.href, location.href);
      if (url.origin === source) anchor.href = site + url.pathname + url.search + url.hash;
      else if (prefix && url.origin === location.origin && !url.pathname.startsWith(prefix + '/') && url.pathname !== prefix) {
        anchor.href = site + url.pathname + url.search + url.hash;
      }
    }
  }
  document.addEventListener('DOMContentLoaded', localizeLinks);
  document.addEventListener('click', localizeLinks, true);
})();
