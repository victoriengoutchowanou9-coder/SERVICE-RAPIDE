import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

// Plugin Vite pour exécuter les fonctions serverless locales /api en mode dev
function localApiServerlessPlugin() {
  return {
    name: 'local-api-serverless-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        if (!url.pathname.startsWith('/api/')) {
          return next();
        }

        // Recherche du fichier .js correspondant dans ../api
        let candidatePath = path.resolve(__dirname, '..', url.pathname.slice(1) + '.js');
        if (!fs.existsSync(candidatePath)) {
          candidatePath = path.resolve(__dirname, '..', url.pathname.slice(1), 'index.js');
        }

        if (!fs.existsSync(candidatePath)) {
          return next();
        }

        try {
          // Injection des méthodes Express status() et json()
          res.status = (code: number) => {
            res.statusCode = code;
            return res;
          };
          res.json = (data: any) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          };

          // Parsing query params
          req.query = Object.fromEntries(url.searchParams.entries());

          // Lecture du corps de requête (POST/PUT)
          let rawBody = '';
          req.on('data', (chunk: any) => {
            rawBody += chunk;
          });

          req.on('end', async () => {
            try {
              req.body = rawBody ? JSON.parse(rawBody) : {};
            } catch (e) {
              req.body = {};
            }

            try {
              const fileUrl = pathToFileURL(candidatePath).href + '?t=' + Date.now();
              const mod = await import(fileUrl);
              const handler = mod.default || mod;
              await handler(req, res);
            } catch (err: any) {
              console.error(`[API Dev Error] ${url.pathname}:`, err);
              if (!res.writableEnded) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Erreur serveur interne' }));
              }
            }
          });
        } catch (e: any) {
          console.error(`[API Route Middleware Error]`, e);
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiServerlessPlugin()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'SUPABASE_'],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://gsgbvoyddagpjldgeyqk.supabase.co'
    ),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''
    ),
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
