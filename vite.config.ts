import { defineConfig } from 'vitest/config';
import type { Connect } from 'vite';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

const appVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string;

// Development/preview only. Desktop builds use a Rust protocol, never an HTTP server.
function htmlPreview(middlewares: Connect.Server) {
  let token = '', html = '';
  middlewares.use('/__plainmark_preview', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), clipboard-read=(), clipboard-write=(), display-capture=(), payment=(), usb=()');
    if (req.method === 'POST' && req.headers['x-plainmark-preview'] === '1' && req.headers.origin === `http://${req.headers.host}`) {
      const chunks: Buffer[] = []; let bytes = 0;
      req.on('data', chunk => { bytes += chunk.length; if (bytes <= 512 * 1024) chunks.push(chunk); });
      req.on('end', () => { if (bytes > 512 * 1024) { res.statusCode=413; res.end(); return; } token=randomUUID(); html=Buffer.concat(chunks).toString('utf8'); res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({url:`/__plainmark_preview/${token}`})); });
    } else if (req.method === 'GET' && token && req.url === `/${token}`) {
      res.setHeader('Content-Type','text/html; charset=utf-8');
      res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; worker-src 'none'; base-uri 'none'; form-action 'none'; sandbox allow-scripts");
      res.end(html);
    } else { res.statusCode=404; res.end(); }
  });
}

export default defineConfig({
  define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion) },
  clearScreen: false,
  plugins: [{name:'plainmark-html-preview', configureServer: server => htmlPreview(server.middlewares), configurePreviewServer: server => htmlPreview(server.middlewares)}],
  server: { port: 1420, strictPort: true },
  build: { target: 'es2022' },
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts'] },
});
