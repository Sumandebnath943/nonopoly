import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { WebSocketServer } from 'ws';
import { attachRoomServer } from './server.js';

function nonopolyWsPlugin() {
  return {
    name: 'nonopoly-ws-server',
    configureServer(server) {
      if (!server.httpServer) return;
      const wss = new WebSocketServer({ noServer: true });
      attachRoomServer(wss);
      server.httpServer.on('upgrade', (req, socket, head) => {
        if (req.url === '/ws' || req.url?.startsWith('/ws?')) {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
          });
        }
      });
    },
    configurePreviewServer(server) {
      if (!server.httpServer) return;
      const wss = new WebSocketServer({ noServer: true });
      attachRoomServer(wss);
      server.httpServer.on('upgrade', (req, socket, head) => {
        if (req.url === '/ws' || req.url?.startsWith('/ws?')) {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
          });
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), nonopolyWsPlugin()],
});
