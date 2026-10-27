"""Serve the preserved portfolio and its public Wix runtime locally."""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import unquote
import os

ROOT = Path(__file__).parent
SOURCE = 'https://www.dumingyuyuyu.com'

class Handler(BaseHTTPRequestHandler):
    def do_HEAD(self):
        self.do_GET()

    def do_POST(self):
        if self.path.split('?')[0] != '/_serverless/portfolio-router/pages':
            self.send_error(405)
            return
        self.do_GET()

    def do_GET(self):
        origin = 'http://' + self.headers.get('Host', 'localhost:5174')
        path = unquote(self.path.split('?')[0]).strip('/')
        if path == 'home':
            path = ''
        if '..' in path.split('/'):
            self.send_error(404)
            return
        local = ROOT / 'pages' / path / 'index.html'
        if not path:
            local = ROOT / 'pages' / 'index.html'
        if local.is_file():
            data, content_type, status = local.read_bytes(), 'text/html; charset=utf-8', 200
        else:
            portfolio_read = self.command == 'POST' and path == '_serverless/portfolio-router/pages'
            if not self.path.startswith(('/_api/', '/_partials/')) and not portfolio_read:
                self.send_error(404)
                return
            try:
                headers = {'User-Agent': 'Mozilla/5.0', 'Referer': SOURCE + '/'}
                data = None
                if portfolio_read:
                    headers['Content-Type'] = self.headers.get('Content-Type', 'application/json')
                    data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
                request = Request(SOURCE + self.path, data=data, headers=headers)
                with urlopen(request, timeout=40) as response:
                    data, content_type, status = response.read(), response.headers.get('Content-Type', ''), response.status
            except HTTPError as error:
                data, content_type, status = error.read(), error.headers.get('Content-Type', ''), error.code
            except Exception as error:
                self.send_error(502, str(error))
                return
        if any(t in content_type for t in ['html', 'json', 'javascript', 'text/css']):
            data = data.replace(SOURCE.encode(), origin.encode())
            data = data.replace(SOURCE.replace('/', r'\/').encode(), origin.replace('/', r'\/').encode())
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(data)

    def log_message(self, format, *args):
        # Public Wix instance identifiers can occur in query strings.
        print(self.command, self.path.split('?')[0], flush=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', '5174'))
    print(f'Portfolio preview: http://localhost:{port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
