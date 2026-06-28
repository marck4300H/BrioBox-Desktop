import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
export default defineConfig({
    plugins: [
        react(),
        electron({
            main: {
                entry: 'electron/main.ts',
                vite: {
                    build: {
                        rollupOptions: {
                            external: ['koffi', 'pngjs'],
                        },
                    },
                },
            },
            preload: {
                input: 'electron/preload.ts',
            },
        }),
        {
            name: 'spa-fallback',
            configureServer(server) {
                server.middlewares.use((req, _res, next) => {
                    if (req.url?.startsWith('/kiosk')) {
                        req.url = '/';
                    }
                    next();
                });
            },
        },
    ],
});
