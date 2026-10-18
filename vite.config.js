import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleAiConciergeRequest, getAiConfigStatus } from './src/server/aiConciergeHandler.js'

function aiConciergePlugin() {
  return {
    name: 'flocard-ai-concierge-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        if (url === '/api/ai-concierge/status' && req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(getAiConfigStatus()));
          return;
        }

        if (url === '/api/ai-concierge' && req.method === 'POST') {
          handleAiConciergeRequest(req, res);
          return;
        }

        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        if (url === '/api/ai-concierge/status' && req.method === 'GET') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(getAiConfigStatus()));
          return;
        }

        if (url === '/api/ai-concierge' && req.method === 'POST') {
          handleAiConciergeRequest(req, res);
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // Load environment variables from .env files into process.env for server-side code
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), aiConciergePlugin()]
  };
});

