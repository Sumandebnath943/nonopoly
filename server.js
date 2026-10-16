// Nonopoly Multiplayer WebSocket Server
// Run with: node server.js (also embedded automatically in Vite dev server at /ws)

import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 3001;

export function attachRoomServer(wss) {
  // roomCode -> { code, hostClientId, lobby, lastState, clients: Map<ws, clientId> }
  const rooms = new Map();

  function broadcastToRoom(roomCode, messageObj, excludeWs = null) {
    const room = rooms.get(roomCode);
    if (!room) return;
    const raw = JSON.stringify(messageObj);
    for (const [clientWs] of room.clients.entries()) {
      if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(raw);
      }
    }
  }

  wss.on('connection', (ws) => {
    let currentRoom = null;
    let currentClientId = null;

    ws.on('message', (rawMessage) => {
      try {
        const data = JSON.parse(rawMessage.toString());
        const { type, roomCode, payload, senderClientId } = data;
        const code = (roomCode || currentRoom || '').toUpperCase();

        if (senderClientId) currentClientId = senderClientId;

        if (type === 'CREATE_ROOM') {
          currentRoom = code;
          currentClientId = payload?.clientId || senderClientId;
          const room = {
            code,
            hostClientId: currentClientId,
            lobby: payload?.lobby || null,
            lastState: null,
            clients: new Map([[ws, currentClientId]]),
          };
          rooms.set(code, room);
          ws.send(JSON.stringify({ type: 'ROOM_CREATED', roomCode: code, lobby: room.lobby }));
          return;
        }

        if (type === 'JOIN_ROOM') {
          const room = rooms.get(code);
          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', message: `Room "${code}" nahi mila! Check the code.` }));
            return;
          }
          currentRoom = code;
          currentClientId = payload?.clientId || senderClientId;
          room.clients.set(ws, currentClientId);

          // Forward JOIN_ROOM envelope to the room (Host processes seat assignment and broadcasts LOBBY_SYNC)
          broadcastToRoom(code, data);
          return;
        }

        if (!code || !rooms.has(code)) return;
        const room = rooms.get(code);
        room.clients.set(ws, currentClientId);

        if (type === 'LOBBY_SYNC' && payload?.lobby) {
          room.lobby = payload.lobby;
        } else if (type === 'STATE_SYNC' && payload?.state) {
          room.lastState = payload.state;
        }

        broadcastToRoom(code, data, ws);
      } catch (err) {
        console.error('WS message error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoom && rooms.has(currentRoom)) {
        const room = rooms.get(currentRoom);
        room.clients.delete(ws);
        if (room.clients.size === 0) {
          // Keep room alive for 2 minutes in case of mobile page refresh
          setTimeout(() => {
            const r = rooms.get(currentRoom);
            if (r && r.clients.size === 0) {
              rooms.delete(currentRoom);
            }
          }, 120000);
        } else if (currentClientId) {
          broadcastToRoom(currentRoom, {
            type: 'LEAVE_ROOM',
            roomCode: currentRoom,
            senderClientId: currentClientId,
            payload: { clientId: currentClientId },
          });
        }
      }
    });
  });
}

// Start standalone server if run directly via `node server.js`
const isMain = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('server.js');
if (isMain) {
  const wss = new WebSocketServer({ port: PORT });
  attachRoomServer(wss);
  console.log(`🇮🇳 Nonopoly Online Game Server running on ws://localhost:${PORT}`);
}
