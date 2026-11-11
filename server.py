"""Preview the static GitHub Pages build on localhost."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import re

ROOT = Path(__file__).resolve().parent

class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        self.range_remaining = None
        requested = self.headers.get('Range')
        path = Path(self.translate_path(self.path))
        if not requested or not path.is_file():
            return super().send_head()
        size = path.stat().st_size
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested)
        if match and any(match.groups()):
            first, last = match.groups()
            start = int(first) if first else max(0, size - int(last))
            end = min(int(last), size - 1) if first and last else size - 1
        else:
            start, end = size, -1
        if start > end or start >= size:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        file = path.open('rb')
        file.seek(start)
        self.range_remaining = end - start + 1
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(str(path)))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(self.range_remaining))
        self.end_headers()
        return file

    def copyfile(self, source, output):
        if self.range_remaining is None:
            return super().copyfile(source, output)
        while self.range_remaining:
            chunk = source.read(min(256 * 1024, self.range_remaining))
            if not chunk:
                break
            output.write(chunk)
            self.range_remaining -= len(chunk)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

if __name__ == '__main__':
    output = ROOT / 'dist'
    if not (output / 'index.html').is_file():
        raise SystemExit('Build the website first: npm run build')
    port = int(os.environ.get('PORT', '5174'))
    print(f'Portfolio preview: http://localhost:{port}', flush=True)
    server = ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=str(output)))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
