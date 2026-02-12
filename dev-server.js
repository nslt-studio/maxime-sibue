import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = 8787;

const MIME = {
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  // CORS headers for Webflow
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-store');

  const filePath = join(DIST, req.url === '/' ? 'main.js' : req.url);
  const ext = extname(filePath);

  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n  Serving dist/ on http://localhost:${PORT}`);
  console.log(`  Waiting for localtunnel...\n`);
});
