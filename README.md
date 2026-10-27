# Mingyu Du portfolio

The portfolio is deployed from this repository to **GitHub Pages**, using `mingyuniverse.com` as its custom domain. It preserves the original published Wix pages, artwork, typography, videos, galleries, and animation configuration.

## Local preview

With Node.js 22 or newer and Python 3 installed:

```sh
npm run build
npm run check
python3 server.py
```

Open http://localhost:5174. The preview serves plain static files from `dist/`, matching GitHub Pages. No server-side proxy or installed packages are required.

## Publish updates

Push changes to `main`. `.github/workflows/pages.yml` builds and validates the site, then deploys `dist/` through GitHub Actions. In the repository's **Settings → Pages**, the source must be **GitHub Actions** and the custom domain must be `mingyuniverse.com`.

To refresh the copy after publishing changes on the original Wix website:

```sh
python3 scripts/capture.py
npm run build
npm run check
```

The capture script downloads desktop and phone versions of all discovered public pages, verifies that every page has the same Wix site revision, then updates `pages/`, `pages-mobile/`, and `pages.json`. Successful downloads are cached in the ignored `.capture-cache/` directory so an interrupted capture can resume. Commit and push those changes to publish them here.

## GoDaddy DNS

Use these records for GitHub Pages:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | 185.199.108.153 | 600 seconds |
| A | @ | 185.199.109.153 | 600 seconds |
| A | @ | 185.199.110.153 | 600 seconds |
| A | @ | 185.199.111.153 | 600 seconds |
| CNAME | www | mingyuniverse.github.io | 3600 seconds |

GitHub's Pages settings manage the HTTPS certificate and redirect between the apex domain and `www`. The build also includes `CNAME` and `.nojekyll` for compatibility.

## Source layout

- `pages/`: original public HTML snapshots for all 27 discovered pages.
- `pages-mobile/`: matching phone snapshots, including the original mobile component order and media.
- `assets/responsive.css` and `assets/responsive.js`: fluid sizing, readable typography, sharp responsive images, and touch navigation. Project cards stack below 700 pixels and form two columns on tablets. At 900 pixels the introduction and About page use side-by-side layouts. All layouts below 1640 pixels share the responsive document, so iPad rotation and split-screen resizing do not reload the page. The original wide desktop composition is used from 1640 pixels, where its fixed-width content fits.
- `assets/static-runtime.js`: adapts navigation, viewer models, and workers to the static site's origin. Wix's public read endpoints are accessed directly through CORS without visitor cookies.
- `scripts/build-pages.mjs`: creates the static deployment in `dist/`. Each route selects its wide desktop or responsive document before the Wix runtime starts. Document URLs include a content version to prevent a new page from loading cached old styles. Only crossing the 1640-pixel document boundary requires a reload; phone and tablet changes use CSS.
- `scripts/check-pages.mjs`: validates routes, viewer configuration, and the domain.
- `scripts/capture.py`: rescans the original public portfolio.
- `server.py`: static local preview server.

The older `worker/`, `scripts/build.mjs`, `scripts/check.mjs`, and `.openai/hosting.json` files are retained as the previous host's source; GitHub Pages does not use them.

## Dependencies and fidelity

This preserves the published Wix experience. Internet access to the original site's public Wix APIs and CDNs is still required for its runtime scripts, fonts, artwork, videos, and galleries. The site does not need a Python or Cloudflare backend in production. The reference's desktop layout and its existing video playback limitations are retained.
