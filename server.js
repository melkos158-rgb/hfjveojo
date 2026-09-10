// Minimal zero-dependency static server for Railway.
// Serves the files in this folder; unknown paths fall back to index.html.

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type || 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method not allowed');
  }

  if (req.url === '/healthz') return send(res, 200, 'ok');

  const url = decodeURIComponent(req.url.split('?')[0]);
  const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const target = path.resolve(ROOT, rel);

  // Never serve outside the project folder.
  if (!target.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  fs.readFile(target, (err, buf) => {
    if (err) {
      return fs.readFile(path.join(ROOT, 'index.html'), (e2, fallback) => {
        if (e2) return send(res, 404, 'Not found');
        send(res, 200, fallback, TYPES['.html']);
      });
    }
    const type = TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream';
    send(res, 200, buf, type);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`ride-lab listening on ${PORT}`);
});
