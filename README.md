# Mingyu Du portfolio replica

A faithful local copy of the public portfolio at https://www.dumingyuyuyu.com/, captured October 27, 2026. The original page HTML, styles, fonts, artwork, GIF animation, video players, galleries, and Wix animation configuration are preserved rather than approximated with a new design.

## Preview

Run `python3 server.py`, then visit http://localhost:5174. No packages are required. Set `PORT` to use another port.

## Project files

- `pages/`: captured HTML for every discovered public page, including older portfolio collections and their projects.
- `pages.json`: route inventory.
- `server.py`: local server; maps internal links to localhost and serves the original public runtime endpoints on the same origin.
- `worker/index.js`: deployable Cloudflare Worker template with the same URL handling.
- `scripts/build.mjs`: packages the captured pages into the Worker.
- `scripts/capture.py`: refreshes snapshots and recursively discovers internal page links.

Run `npm run build` and `npm run check` with Node.js 22 or newer to build and validate the deployment.

To rescan after publishing changes on Wix, run `python3 scripts/capture.py`. It refreshes the homepage, discovers the current routes, downloads every page, and validates that they share the same published revision before replacing the saved snapshots. Reload the local browser afterward.

## Fidelity and dependencies

This is a preserved Wix site, not an independent reimplementation of the Wix editor. Internet access to the original site's public Wix services and CDN is required for its scripts, fonts, images, videos, and interactive galleries. Runtime requests do not forward visitor cookies or authorization headers. The server forwards GET/HEAD requests and the specific read-only POST request Wix uses to retrieve portfolio pages and does not support editing or submitting changes to the original website.

The reference's desktop layout, overflow behavior at narrow widths, and existing video playback limitations are retained. Some videos also report playback errors on the reference itself. Captured HTML can be edited directly; broader independent redesigns would be easier with a fresh component implementation or the original Wix project export.
