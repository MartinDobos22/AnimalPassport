// Lokálny statický server ktorý napodobňuje Netlify: statické súbory majú
// prednosť, "Pretty URLs" servírujú /foo zo súboru /foo.html a z tvarov
// /foo/ a /foo.html 301-ujú na /foo, inak SPA fallback na index.html (200).
// Slúži na overenie prerenderu a smeru redirectov pred deployom.
//
// Použitie:  node scripts/serve-like-netlify.mjs [port]
//   (najprv spusti `npm run build`)
//   Overenie:  curl -sI http://localhost:8788/poradna/odcervenie-psa   → 200
//              curl -sI http://localhost:8788/poradna/odcervenie-psa/  → 301
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.argv[2]) || 8788;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

async function tryFile(path) {
  try {
    const s = await stat(path);
    if (s.isFile()) return path;
  } catch {
    /* nie je súbor */
  }
  return null;
}

/** Kanonický tvar cesty podľa Netlify Pretty URLs: bez '.html' a bez koncovej lomky. */
function prettyPath(pathname) {
  if (pathname === '/') return '/';
  return pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
}

async function resolvePath(pathname) {
  const base = resolve(distDir, '.' + pathname);
  // 1) presný súbor (assety)  2) <path>.html  3) adresárový index
  return (
    (await tryFile(base)) ||
    (await tryFile(base + '.html')) ||
    (await tryFile(resolve(base, 'index.html'))) ||
    null
  );
}

const server = createServer(async (req, res) => {
  const rawUrl = req.url || '/';
  const queryAt = rawUrl.indexOf('?');
  const pathname = decodeURIComponent(queryAt === -1 ? rawUrl : rawUrl.slice(0, queryAt));
  const query = queryAt === -1 ? '' : rawUrl.slice(queryAt);
  const pretty = prettyPath(pathname);

  // Pretty URLs: '/foo/' aj '/foo.html' 301-ujú na '/foo' — ale len ak taká
  // stránka reálne existuje. Inak nech spadne do SPA fallbacku (200).
  if (pretty !== pathname && (await resolvePath(pretty))) {
    res.writeHead(301, { location: `${pretty}${query}` }).end();
    return;
  }

  // SPA fallback (Netlify: /* -> /index.html, status 200)
  const filePath = (await resolvePath(pretty)) ?? resolve(distDir, 'index.html');
  try {
    const body = await readFile(filePath);
    res.writeHead(200, {
      'content-type': MIME[extname(filePath)] || 'application/octet-stream',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

server.listen(port, () => {
  console.log(`[serve-like-netlify] http://localhost:${port}  (dist: ${distDir})`);
});
