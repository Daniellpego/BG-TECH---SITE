/**
 * Local dev server for Painel CFO E2E tests.
 * 
 * Serves static files from painel-cfo/ AND routes /api/painel
 * to the Vercel serverless function handler for local testing.
 * 
 * Usage: node dev-server.js
 * 
 * Requires env vars (or .env file):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Load the API handler
const apiHandler = require('../../api/painel.js');

const PORT = process.env.PORT || 5500;
const STATIC_ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // ── API routes ──
  if (url.pathname === '/api/painel') {
    // Parse body for POST
    if (req.method === 'POST') {
      let body = '';
      for await (const chunk of req) body += chunk;
      try { req.body = JSON.parse(body); } catch { req.body = {}; }
    }

    // Parse query params
    req.query = Object.fromEntries(url.searchParams.entries());

    // Create response helpers matching Vercel's API
    const vercelRes = {
      _statusCode: 200,
      _headers: {},
      setHeader(k, v) { this._headers[k] = v; return this; },
      status(code) { this._statusCode = code; return this; },
      json(data) {
        res.writeHead(this._statusCode, { ...this._headers, 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      },
      end() {
        res.writeHead(this._statusCode, this._headers);
        res.end();
      },
    };

    try {
      await apiHandler(req, vercelRes);
    } catch (err) {
      console.error('API handler error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ── Static files ──
  let filePath = path.join(STATIC_ROOT, url.pathname);
  if (url.pathname === '/' || url.pathname === '') {
    filePath = path.join(STATIC_ROOT, 'index.html');
  }

  // If path is a directory, try index.html inside it
  try {
    if (fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch { /* file not found — handled below */ }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: serve index.html for unknown routes
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(STATIC_ROOT, 'index.html'), (err2, html) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
          }
        });
        return;
      }
      res.writeHead(500);
      res.end('Server Error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`[dev-server] Painel CFO running at http://localhost:${PORT}`);
  console.log(`[dev-server] API proxy at http://localhost:${PORT}/api/painel`);
  console.log(`[dev-server] Static root: ${STATIC_ROOT}`);
});
