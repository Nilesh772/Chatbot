const fs = require('fs');
const path = require('path');

// Sync custom pre-generated Prisma Client to node_modules on cPanel startup
try {
  const src = path.join(__dirname, 'prisma_client');
  const dest = path.join(__dirname, 'node_modules', '@prisma', 'client');
  if (fs.existsSync(src)) {
    console.log(`> Syncing Prisma Client from ${src} to ${dest}...`);
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(src, dest, { recursive: true, force: true });
    console.log('> Prisma Client synced successfully!');
  }
} catch (e) {
  console.error('> Error syncing Prisma Client:', e);
}

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Initialize Next.js app in production/dev mode
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
