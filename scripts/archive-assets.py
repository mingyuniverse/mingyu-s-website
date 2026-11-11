"""Archive the resource URLs used by the runtime-free build, not hosted scripts.

Run LOCAL_ASSET_SCAN=1 node scripts/build-pages.mjs first, then this script,
then rebuild normally. Existing verified files are reused after interruption.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from hashlib import sha256
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, quote
from urllib.request import Request, urlopen
import json
import re
import time

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'assets/localized'
DEST.mkdir(parents=True, exist_ok=True)
FILE = DEST / 'manifest.json'
manifest = json.loads(FILE.read_text()) if FILE.exists() else {}
urls = set()


def collect(value):
    value = unescape(value).strip()
    if value.startswith('//'):
        value = 'https:' + value
    if value.startswith(('https://', 'http://')):
        urls.add(value)


class Resources(HTMLParser):
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('img', 'video', 'audio', 'source', 'iframe', 'image', 'use'):
            for name in ('src', 'poster', 'href', 'xlink:href'):
                collect(attrs.get(name, ''))
            for source in re.findall(r'(?:https?:)?//[^\s]+', attrs.get('srcset', '')):
                collect(source)
        if tag == 'link' and attrs.get('rel') in ('icon', 'shortcut icon', 'apple-touch-icon', 'stylesheet'):
            collect(attrs.get('href', ''))
        if tag == 'meta' and attrs.get('property') in ('og:image',):
            collect(attrs.get('content', ''))


for document in (ROOT / 'dist').rglob('view-*.html'):
    html = document.read_text()
    Resources().feed(html)
    # Inline styles are already complete in the captured pages.
    for block in re.findall(r'<style\b[^>]*>([\s\S]*?)</style>', html):
        for value in re.findall(r'url\(\s*[\'"]?([^\s)\'"]+)', block):
            collect(value)


def download(url):
    previous = manifest.get(url)
    if previous:
        path = ROOT / previous['path']
        if path.exists() and sha256(path.read_bytes()).hexdigest() == previous['sha256']:
            return url, previous
    parsed = urlsplit(url)
    encoded = urlunsplit((parsed.scheme, parsed.netloc, quote(parsed.path, safe='/%:@,~+!$&=;()-_.'), parsed.query, ''))
    for attempt in range(4):
        try:
            with urlopen(Request(encoded, headers={'User-Agent': 'Mozilla/5.0', 'Accept': '*/*'}), timeout=60) as response:
                data = response.read()
                mime = response.headers.get_content_type()
            if not data or mime == 'text/html':
                raise ValueError('Not a media or font file: ' + url)
            suffix = {'font/woff2': '.woff2', 'font/woff': '.woff', 'image/avif': '.avif', 'image/webp': '.webp', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'video/mp4': '.mp4'}.get(mime)
            suffix = suffix or Path(parsed.path).suffix.lower() or '.bin'
            content_hash = sha256(data).hexdigest()
            name = content_hash[:24] + suffix
            (DEST / name).write_bytes(data)
            return url, {'path': 'assets/localized/' + name, 'bytes': len(data), 'sha256': content_hash, 'type': mime}
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 * (attempt + 1))


print(f'Archiving {len(urls)} unique resources.', flush=True)
failures = []
with ThreadPoolExecutor(max_workers=6) as pool:
    futures = {pool.submit(download, url): url for url in sorted(urls)}
    for index, future in enumerate(as_completed(futures), 1):
        try:
            url, record = future.result()
            manifest[url] = record
            FILE.write_text(json.dumps(manifest, ensure_ascii=False, sort_keys=True, indent=2) + '\n')
        except Exception as error:
            failures.append((futures[future], str(error)))
        if index % 25 == 0:
            print(f'{index}/{len(urls)} resources checked.', flush=True)
if failures:
    print(json.dumps(failures, ensure_ascii=False, indent=2))
    raise SystemExit(1)
print(f'Archived {len(manifest)} URL mappings, {len(set(x["path"] for x in manifest.values()))} unique files.', flush=True)
