import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function uploadArtworkPlugin() {
  return {
    name: 'upload-artwork-middleware',
    configureServer(server) {
      server.middlewares.use('/api/upload-artwork', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { imageBase64, filename } = JSON.parse(body);
              const dir = path.resolve(__dirname, 'public/uploads/designs');
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
              const safeName = (filename || `artwork_${Date.now()}.png`).replace(/[^a-zA-Z0-9_.-]/g, '_');
              const filePath = path.join(dir, safeName);
              const base64Data = (imageBase64 || '').replace(/^data:image\/\w+;base64,/, '');
              fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
              const publicUrl = `/uploads/designs/${safeName}`;
              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ success: true, url: publicUrl, filename: safeName }));
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
        } else if (req.method === 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          });
          res.end();
        } else {
          res.writeHead(405);
          res.end();
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), uploadArtworkPlugin()],
});
