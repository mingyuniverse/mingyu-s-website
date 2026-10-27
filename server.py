"""Preview the static GitHub Pages build on localhost."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
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
