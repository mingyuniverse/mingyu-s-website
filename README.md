# Mingyu Du portfolio

The portfolio is deployed from this repository to **GitHub Pages**, using `mingyuniverse.com` as its custom domain. It preserves the published portfolio layout, artwork, typography, and project media using local assets and an independent browser runtime.

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

### Local project replacements

The updated project pages use files in `assets/projects/` through the adapters in
`scripts/`. The build copies only the referenced files to fingerprinted URLs in
`dist/assets/`. Original source HTML snapshots remain available in `pages/` and
`pages-mobile/`; update the local files and rebuild to publish replacement media.

Local replacements cover Nothing, Room Design, 13 Reasons Why, Still Life,
Apple Music, 1984, To Write Love on Her Arms, and Amtrak. The Apple Music sketch
section includes sketches 1–8. The Instagram mockups are combined in the original
three-phone arrangement. Older collection links for Apple Music, 1984, and the
PSA redirect to their corresponding updated project pages.

`assets/projects/asset-inventory.json` records source file sizes and hashes.
The build checks verify both layouts, media files, cache fingerprints, and
relative links from the nested Amtrak route.

- `pages/`: original public HTML snapshots for all 27 discovered pages.
- `pages-mobile/`: matching phone snapshots, including the original mobile component order and media.
- `assets/desktop-header.css`: anchors Home, Work, and About to the right side of the window.
- `scripts/fluid-home.mjs` and `assets/fluid-home.css`: viewport-relative desktop home dimensions, centered scalable hero typography, proportional content spacing, and a header that stays within the window.
- `assets/responsive.css` and `assets/responsive.js`: fluid sizing, readable typography, sharp responsive images, and touch navigation. Project cards stack below 700 pixels and form two columns on tablets. At 900 pixels the introduction and About page use side-by-side layouts. Phones and tablets use the responsive document, including iPadOS devices that identify as macOS. The desktop homepage scales its staggered composition with the viewport against a 1600px design reference, keeping project artwork across approximately 90% of the canvas. Its hero height and centered slogan scale with the window; medium captions use larger bold fluid type. Other desktop project pages retain their existing compositions. Resizing and tablet rotation do not switch documents or reload the page.
- `assets/hero.js` and `assets/media/`: the opening 25.4 MB GIF is replaced with a 635 KB H.264 loop and a 114 KB WebP poster. The poster preloads from the initial entry page; playback starts independently of Wix hydration. A narrowly scoped image adapter prevents the original GIF from being requested again during hydration. Reduced motion uses a still frame. The video sits inside the original sticky background wrapper, preserving the fixed backdrop while the text and following sections scroll over it. The build fingerprints both assets. Re-encode these assets and update the original GIF identifier in `hero.js` if the source background changes.
- `assets/independent.js`: ordinary navigation, Work scrolling, native video playback, and visibility-triggered entrance animations. No hosted editor scripts or APIs run in production.
- `assets/localized/`: archived fonts, thumbnails, gallery artwork, and icons, addressed by content hash. `manifest.json` records their provenance and checksums.
- `assets/collections.json` and `scripts/collections.mjs`: archived collection titles, covers, and links, rendered as a native responsive gallery without Wix's collection API.
- `scripts/independent.mjs`: removes hosted scripts/configuration before adapting each page, rewrites resources to local files, and enforces a same-origin resource policy.
- `scripts/check-independent.py`: verifies every resource in both layouts exists locally and checks archived file hashes and font signatures.
- `assets/static-runtime.js`: retained historical adapter; excluded from production.
- `scripts/build-pages.mjs`: creates the static deployment in `dist/`. Each route selects its desktop or responsive document by device before the Wix runtime starts. Document URLs include a content version to prevent a new page from loading cached old styles. Window resizing never changes the device layout; phone and tablet changes use CSS.
- `scripts/check-pages.mjs`: validates routes, viewer configuration, and the domain.
- `scripts/capture.py`: rescans the original public portfolio.
- `server.py`: static local preview server.

The older `worker/`, `scripts/build.mjs`, `scripts/check.mjs`, and `.openai/hosting.json` files are retained as the previous host's source; GitHub Pages does not use them.

## Search indexing

`scripts/seo.mjs` publishes canonical URLs on `https://mingyuniverse.com`, branded titles, homepage WebSite/Person structured data, and the owner's Google Search Console verification tag. `assets/seo.js` preserves the correct metadata when Wix updates the head. The build includes `robots.txt` and a sitemap of 25 public content routes, excluding the blank and fullscreen utility pages. The initial entry document also includes verification and homepage structured data, before JavaScript runs. Keep the verification tag after ownership verification succeeds. Submit `https://mingyuniverse.com/sitemap.xml` in the HTTPS URL-prefix Search Console property.

## Dependencies and fidelity

Production serves static HTML, fonts, images, videos, and browser code from GitHub Pages. It does not use Wix scripts, workers, APIs, CDN media, or a Python/Cloudflare backend. A Content Security Policy restricts resource loads to the website itself (plus local data/blob media); external portfolio/social links remain ordinary outbound links. The original captured HTML is retained only as build input.

To archive resources after an intentional source refresh, run `LOCAL_ASSET_SCAN=1 node scripts/build-pages.mjs`, `python3 scripts/archive-assets.py`, then build/check normally. Optional `scripts/optimize-archived-images.py` converts large PNG files to lossless WebP and verifies pixel equality; it requires Pillow, which is not needed for ordinary builds. Never deploy a scan build with unresolved resource URLs.
