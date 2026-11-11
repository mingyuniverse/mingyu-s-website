"""Verify every emitted document uses existing, same-origin resource files."""
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json
import re

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
references = 0


class Document(HTMLParser):
    def __init__(self, file):
        super().__init__()
        self.file = file

    def resource(self, value):
        global references
        if not value or value.startswith(('data:', 'blob:', '#')):
            return
        parsed = urlsplit(value)
        assert not parsed.scheme and not parsed.netloc, f'External dependency: {self.file}: {value}'
        path = (DIST if parsed.path.startswith('/') else self.file.parent) / unquote(parsed.path).lstrip('/')
        assert path.is_file(), f'Missing dependency: {self.file}: {value}'
        references += 1

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('img', 'video', 'audio', 'source', 'script', 'iframe', 'image', 'use'):
            for key in ('src', 'poster', 'xlink:href'):
                self.resource(a.get(key, ''))
            if tag in ('image', 'use'):
                self.resource(a.get('href', ''))
            for source in re.split(r',\s+(?=\S)', a.get('srcset', '')):
                if source:
                    self.resource(source.split()[0])
        if tag == 'link' and a.get('rel') in ('stylesheet', 'icon', 'shortcut icon', 'apple-touch-icon'):
            self.resource(a.get('href', ''))
        if a.get('style'):
            for value in re.findall(r'url\(\s*[\'"]?([^\s)\'"]+)', a['style']):
                self.resource(value)


files = list(DIST.rglob('view-*.html'))
for file in files:
    html = file.read_text()
    parser = Document(file)
    parser.feed(html)
    for style in re.findall(r'<style\b[^>]*>([\s\S]*?)</style>', html):
        for value in re.findall(r'url\(\s*[\'"]?([^\s)\'"]+)', style):
            parser.resource(value)

manifest = json.loads((ROOT / 'assets/localized/manifest.json').read_text())
for record in manifest.values():
    file = DIST / record['path']
    assert file.is_file(), record['path']
    data = file.read_bytes()
    assert len(data) == record['bytes'] and sha256(data).hexdigest() == record['sha256'], file
    if file.suffix in ('.woff', '.woff2'):
        assert data[:4] in (b'wOFF', b'wOF2'), f'Invalid font: {file}'

print(f'Verified {len(files)} documents, {references} local resource references, and {len(manifest)} archived URL mappings.')
