// Nonopoly Multiplayer WebSocket Server
// Run with: node server.js

import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 3001;
const wss = new WebSocketServer({ port: PORT });

// Active rooms storage: roomCode -> { hostId, players: [], gameState: null }
const rooms = new Map();

console.log(`🇮🇳 Nonopoly Online Game Server running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  let currentRoom = null;
  let playerId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { type, roomCode, payload } = data;

      // 1. Create Room
      if (type === 'CREATE_ROOM') {
        const code = roomCode || Math.random().toString(36).substring(2, 6).toUpperCase();
        currentRoom = code;
        playerId = payload.player.id;

        rooms.set(code, {
          code,
          hostId: playerId,
          players: [{ ...payload.player, ws }],
          gameState: payload.gameState || null,
        });

        ws.send(JSON.stringify({
          type: 'ROOM_CREATED',
          roomCode: code,
          player: payload.player,
        }));
        console.log(`Room created: ${code} by ${payload.player.name}`);
      }

      // 2. Join Room
      else if (type === 'JOIN_ROOM') {
        const room = rooms.get(roomCode);
        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Room nahi mila! Code check karein.' }));
          return;
        }

        if (room.players.length >= 4) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Room full hai (Max 4 players)!' }));
          return;
        }

        currentRoom = roomCode;
        playerId = payload.player.id;
        room.players.push({ ...payload.player, ws });

        // Broadcast player joined to everyone in the room
        broadcastToRoom(roomCode, {
          type: 'PLAYER_JOINED',
          players: room.players.map((p) => ({
            id: p.id,
            name: p.name,
            token: p.token,
            isAi: false,
          })),
        });
        console.log(`${payload.player.name} joined room: ${roomCode}`);
      }

      // 3. Sync Game State Action
      else if (type === 'SYNC_STATE') {
        const room = rooms.get(roomCode);
        if (room) {
          room.gameState = payload.gameState;
          broadcastToRoom(roomCode, {
            type: 'STATE_UPDATED',
            gameState: payload.gameState,
            senderId: playerId,
          }, ws); // Send to all others
        }
      }

      // 4. In-Game Desi Chat
      else if (type === 'CHAT_MESSAGE') {
        broadcastToRoom(roomCode, {
          type: 'CHAT_MESSAGE',
          sender: payload.sender,
          text: payload.text,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    } catch (err) {
      console.error('Error parsing WS message:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      room.players = room.players.filter((p) => p.ws !== ws);
      if (room.players.length === 0) {
        rooms.delete(currentRoom);
        console.log(`Room ${currentRoom} deleted (all left).`);
      } else {
        broadcastToRoom(currentRoom, {
          type: 'PLAYER_LEFT',
          playerId,
        });
      }
    }
  });
});

function broadcastToRoom(roomCode, payload, excludeWs = null) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const msg = JSON.stringify(payload);
  room.players.forEach((p) => {
    if (p.ws && p.ws.readyState === WebSocket.OPEN && p.ws !== excludeWs) {
      p.ws.send(msg);
    }
  });
}
