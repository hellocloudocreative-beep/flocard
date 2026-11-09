import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dev-api-cloud-sync',
      configureServer(server) {
        server.middlewares.use('/api/cloud-sync', async (req, res) => {
          try {
            const { default: handler } = await import('./api/cloud-sync.js');
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              if (body) {
                try { req.body = JSON.parse(body); } catch (_) { req.body = body; }
              }
              res.status = (code) => { res.statusCode = code; return res; };
              res.json = (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              };
              await handler(req, res);
            });
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      }
    }
  ]
});
