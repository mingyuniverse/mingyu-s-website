"""Refresh every public portfolio page from the live site after staging validation."""
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import quote, unquote, urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import time
import difflib
import json
import re

BASE = 'https://www.dumingyuyuyu.com'
ROOT = Path(__file__).resolve().parent.parent
PHONE_AGENT = ('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) '
               'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')


def viewer_model(html):
    match = re.search(r'<script[^>]+id="wix-viewer-model"[^>]*>(.*?)</script>', html, re.S)
    if not match:
        raise ValueError('The response does not contain a complete Wix page')
    return json.loads(match.group(1))


def fetch(path, mobile=False, revision=None):
    cache = ROOT / '.capture-cache' / ('mobile' if mobile else 'desktop') / path / 'index.html'
    if revision is not None:
        for candidate in (cache, ROOT / ('pages-mobile' if mobile else 'pages') / path / 'index.html'):
            if candidate.is_file():
                html = candidate.read_text()
                model = viewer_model(html)
                if model['site']['siteRevision'] == revision and model['formFactor'] == ('mobile' if mobile else 'desktop'):
                    return html
    url = BASE + '/' + quote(path, safe='/-%')
    request = Request(url, headers={'User-Agent': PHONE_AGENT if mobile else 'Mozilla/5.0', 'Cache-Control': 'no-cache'})
    for attempt in range(3):
        try:
            with urlopen(request, timeout=60) as response:
                html = response.read().decode('utf-8')
            break
        except HTTPError as error:
            if error.code != 429 or attempt == 2:
                raise
            delay = float(error.headers.get('Retry-After', '10'))
            print(f'Rate limited on /{path}; waiting {delay:g} seconds', flush=True)
            time.sleep(delay)
    viewer_model(html)
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(html)
    return html


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = set()
        self.text = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.skip += 1
        href = dict(attrs).get('href', '')
        parsed = urlsplit(href)
        if tag == 'a' and parsed.hostname in ('www.dumingyuyuyu.com', 'dumingyuyuyu.com'):
            path = unquote(parsed.path).strip('/')
            if path and path != 'home' and '..' not in path.split('/'):
                self.links.add(path)

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = max(0, self.skip - 1)

    def handle_data(self, text):
        if not self.skip and text.strip():
            self.text.append(text.strip())


def inspect(html):
    page = Page()
    page.feed(html)
    return page


def styles(html):
    css = '\n'.join(re.findall(r'<style\b[^>]*>(.*?)</style>', html, re.S))
    return re.sub(r'\s+', '', re.sub(r'/\*.*?\*/', '', css, flags=re.S))


def main():
    home = fetch('')
    model = viewer_model(home)
    revision = model['site']['siteRevision']
    old_home = ROOT / 'pages/index.html'
    old_revision = viewer_model(old_home.read_text())['site']['siteRevision'] if old_home.exists() else None
    pending = {p['pageUriSEO'] for p in model['siteFeaturesConfigs']['router']['pagesMap'].values()
               if p['pageUriSEO'] not in ('project', 'collection', 'home')}
    pending.update(inspect(home).links)
    captured = {'': home}
    print(f'Refreshing site revision {old_revision} → {revision}', flush=True)

    with TemporaryDirectory(prefix='mingyu-portfolio-refresh-') as staging:
        staging = Path(staging)
        while pending:
            batch = sorted(pending - captured.keys())
            if not batch:
                break
            with ThreadPoolExecutor(max_workers=2) as pool:
                for path, html in zip(batch, pool.map(lambda route: fetch(route, revision=revision), batch)):
                    page_revision = viewer_model(html)['site']['siteRevision']
                    if page_revision != revision:
                        raise ValueError(f'/{path}: site changed during capture ({page_revision} != {revision}); rerun')
                    captured[path] = html
                    print(f'Captured /{path}', flush=True)
            pending = set().union(*(inspect(html).links for html in captured.values())) - captured.keys()

        phone_pages = {}
        routes = sorted(captured)
        with ThreadPoolExecutor(max_workers=2) as pool:
            for path, html in zip(routes, pool.map(lambda route: fetch(route, mobile=True, revision=revision), routes)):
                phone_model = viewer_model(html)
                if phone_model['site']['siteRevision'] != revision or phone_model['formFactor'] != 'mobile':
                    raise ValueError(f'/{path}: phone snapshot is not the matching mobile revision')
                phone_pages[path] = html
                staged = staging / 'phone' / path / 'index.html'
                staged.parent.mkdir(parents=True, exist_ok=True)
                staged.write_text(html)
                print(f'Captured phone /{path}', flush=True)

        report = {'old_revision': old_revision, 'revision': revision, 'page_count': len(captured),
                  'new_pages': [], 'layout_changes': [], 'text_changes': {}}
        for path, html in captured.items():
            target = ROOT / 'pages' / path / 'index.html'
            if target.exists():
                previous = target.read_text()
                if styles(previous) != styles(html):
                    report['layout_changes'].append('/' + path)
                text_diff = list(difflib.unified_diff(inspect(previous).text, inspect(html).text, lineterm=''))
                if text_diff:
                    report['text_changes']['/' + path] = text_diff
            else:
                report['new_pages'].append('/' + path)
            staged = staging / path / 'index.html'
            staged.parent.mkdir(parents=True, exist_ok=True)
            staged.write_text(html)

        # Replace snapshots only after every response has passed validation.
        for path in captured:
            target = ROOT / 'pages' / path / 'index.html'
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes((staging / path / 'index.html').read_bytes())
            phone_target = ROOT / 'pages-mobile' / path / 'index.html'
            phone_target.parent.mkdir(parents=True, exist_ok=True)
            phone_target.write_bytes((staging / 'phone' / path / 'index.html').read_bytes())
        (ROOT / 'pages.json').write_text(json.dumps(sorted(captured), ensure_ascii=False, indent=2) + '\n')
        Path('/tmp/mingyu-refresh-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)


if __name__ == '__main__':
    main()
