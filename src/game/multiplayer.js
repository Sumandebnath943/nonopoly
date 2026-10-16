// Multi-transport real-time room client for Nonopoly Online Multiplayer.
// Supports:
// 1. Same-origin Vite WebSocket server (/ws) — works automatically with `npm run dev` on local/LAN
// 2. Standalone Node WebSocket server (ws://<hostname>:3001) — works with `node server.js`
// 3. Public Cloud WebSocket Relay (MQTT-over-WSS) + BroadcastChannel — works across the internet
//    even on static hosts (GitHub Pages / Vercel / Netlify) with zero backend config!

const CLIENT_ID_KEY = 'nonopoly.clientId.v2';
const ROOM_SESSION_KEY = 'nonopoly.roomSession.v2';

function getOrCreateClientId() {
  try {
    let id = sessionStorage.getItem(CLIENT_ID_KEY) || localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = 'c_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      sessionStorage.setItem(CLIENT_ID_KEY, id);
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return 'c_' + Math.random().toString(36).slice(2, 10);
  }
}

// Lightweight MQTT v3.1.1 over WebSocket client for zero-backend internet relay fallback
class MqttWsRelay {
  constructor(url, topicPrefix) {
    this.url = url;
    this.topicPrefix = topicPrefix;
    this.ws = null;
    this.connected = false;
    this.onMessage = null;
    this.pingTimer = null;
    this.subscribedTopic = null;
  }

  connect(roomCode) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.close();
          reject(new Error('Relay timeout'));
        }
      }, 4200);

      try {
        const ws = new WebSocket(this.url, 'mqtt');
        ws.binaryType = 'arraybuffer';
        this.ws = ws;

        ws.onopen = () => {
          // Send MQTT CONNECT packet
          const clientId = 'nnp_' + Math.random().toString(36).slice(2, 10);
          ws.send(this.encodeConnect(clientId));
        };

        ws.onmessage = (ev) => {
          const bytes = new Uint8Array(ev.data);
          if (!bytes.length) return;
          const packetType = bytes[0] >> 4;
          // CONNACK = 2
          if (packetType === 2) {
            this.connected = true;
            this.subscribe(`${this.topicPrefix}/${roomCode}`);
            this.pingTimer = setInterval(() => {
              if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(new Uint8Array([0xc0, 0x00])); // PINGREQ
              }
            }, 25000);
            if (!settled) {
              settled = true;
              clearTimeout(timeout);
              resolve(this);
            }
          }
          // PUBLISH = 3
          else if (packetType === 3) {
            const msg = this.decodePublish(bytes);
            if (msg && this.onMessage) {
              try {
                this.onMessage(JSON.parse(msg));
              } catch {
                /* ignore malformed */
              }
            }
          }
        };

        ws.onerror = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(new Error('Relay error'));
          }
        };

        ws.onclose = () => {
          this.connected = false;
          clearInterval(this.pingTimer);
        };
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  }

  encodeLength(len) {
    const out = [];
    do {
      let digit = len % 128;
      len = Math.floor(len / 128);
      if (len > 0) digit |= 0x80;
      out.push(digit);
    } while (len > 0);
    return out;
  }

  encodeStr(str) {
    const bytes = new TextEncoder().encode(str);
    return [(bytes.length >> 8) & 0xff, bytes.length & 0xff, ...bytes];
  }

  encodeConnect(clientId) {
    const vh = [0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x02, 0x00, 0x3c];
    const pl = this.encodeStr(clientId);
    const rem = vh.length + pl.length;
    return new Uint8Array([0x10, ...this.encodeLength(rem), ...vh, ...pl]);
  }

  subscribe(topic) {
    this.subscribedTopic = topic;
    const tBytes = this.encodeStr(topic);
    const body = [0x00, 0x01, ...tBytes, 0x00];
    this.ws?.send(new Uint8Array([0x82, ...this.encodeLength(body.length), ...body]));
  }

  publish(roomCode, data) {
    if (!this.connected || this.ws?.readyState !== WebSocket.OPEN) return false;
    const topic = `${this.topicPrefix}/${roomCode}`;
    const tBytes = this.encodeStr(topic);
    const pBytes = new TextEncoder().encode(JSON.stringify(data));
    const rem = tBytes.length + pBytes.length;
    const pkt = new Uint8Array(1 + this.encodeLength(rem).length + rem);
    let offset = 0;
    pkt[offset++] = 0x30;
    for (const b of this.encodeLength(rem)) pkt[offset++] = b;
    for (const b of tBytes) pkt[offset++] = b;
    pkt.set(pBytes, offset);
    this.ws.send(pkt);
    return true;
  }

  decodePublish(bytes) {
    let idx = 1;
    let mult = 1;
    let remLen = 0;
    let encodedByte;
    do {
      encodedByte = bytes[idx++];
      remLen += (encodedByte & 127) * mult;
      mult *= 128;
    } while ((encodedByte & 128) !== 0 && idx < bytes.length);
    const topicLen = (bytes[idx] << 8) | bytes[idx + 1];
    idx += 2 + topicLen;
    const payload = bytes.slice(idx);
    return new TextDecoder().decode(payload);
  }

  close() {
    this.connected = false;
    clearInterval(this.pingTimer);
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
    this.ws = null;
  }
}

const VALID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += VALID_CHARS[Math.floor(Math.random() * VALID_CHARS.length)];
  }
  return code;
}

class MultiplayerClient {
  constructor() {
    this.clientId = getOrCreateClientId();
    this.roomCode = null;
    this.isHost = false;
    this.transportMode = 'disconnected'; // 'ws' | 'cloud' | 'local-tab'
    this.ws = null;
    this.cloudRelay = null;
    this.bc = null;
    this.listeners = new Set();
    this.lobby = null;
    this.error = null;
    this.connecting = false;
    this.gameHandlers = null;
    this.snapshot = this.buildSnapshot();

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.bc = new BroadcastChannel('nonopoly_mp_v2');
        this.bc.onmessage = (ev) => {
          if (ev.data && ev.data.roomCode === this.roomCode) {
            this.handlePeerEnvelope(ev.data);
          }
        };
      } catch {
        /* ignore */
      }
    }
  }

  buildSnapshot() {
    return {
      roomCode: this.roomCode,
      isHost: this.isHost,
      lobby: this.lobby,
      error: this.error,
      connecting: this.connecting,
      transportMode: this.transportMode,
      clientId: this.clientId,
    };
  }

  getSnapshot = () => this.snapshot;

  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  notify() {
    this.snapshot = this.buildSnapshot();
    this.listeners.forEach((fn) => fn());
  }

  setGameHandlers(handlers) {
    this.gameHandlers = handlers;
  }

  // Try connecting to local WS (/ws on same host, or :3001), fallback to P2P Cloud Relay + BroadcastChannel
  async connectTransport(roomCode) {
    this.DisconnectTransportOnly();
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const candidates = [
      `${proto}//${window.location.host}/ws`,
      ...(window.location.protocol === 'http:' ? [`ws://${host}:3001`] : []),
    ];

    for (const url of candidates) {
      const ws = await this.tryWebSocket(url);
      if (ws) {
        this.ws = ws;
        this.transportMode = 'ws';
        this.setupWsListeners(ws);
        return 'ws';
      }
    }

    // Fallback to Cloud Relay (MQTT over WSS) for static hosts / GitHub Pages
    const relays = [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://test.mosquitto.org:8081',
    ];
    for (const rUrl of relays) {
      try {
        const relay = new MqttWsRelay(rUrl, 'nonopoly_v2_rooms');
        await relay.connect(roomCode);
        relay.onMessage = (env) => {
          if (env && env.roomCode === this.roomCode) {
            this.handlePeerEnvelope(env);
          }
        };
        this.cloudRelay = relay;
        this.transportMode = 'cloud';
        return 'cloud';
      } catch {
        /* try next */
      }
    }

    // Even offline across tabs, BroadcastChannel works seamlessly
    this.transportMode = 'local-tab';
    return 'local-tab';
  }

  tryWebSocket(url) {
    return new Promise((resolve) => {
      let done = false;
      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          try { ws.close(); } catch { /* ignore */ }
          resolve(null);
        }
      }, 1200);

      let ws;
      try {
        ws = new WebSocket(url);
      } catch {
        clearTimeout(timer);
        resolve(null);
        return;
      }

      ws.onopen = () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(ws);
        }
      };
      ws.onerror = () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(null);
        }
      };
    });
  }

  setupWsListeners(ws) {
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        this.handleServerMessage(data);
      } catch {
        /* ignore */
      }
    };
    ws.onclose = () => {
      if (this.transportMode === 'ws' && this.roomCode) {
        // Attempt seamless fallback to cloud/broadcast if local ws drops
        this.notify();
      }
    };
  }

  sendRaw(msg) {
    const payload = { ...msg, roomCode: this.roomCode, senderClientId: this.clientId };
    if (this.transportMode === 'ws' && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
    // Always also broadcast on BroadcastChannel & Cloud Relay if active so hybrid peers stay synced
    if (this.cloudRelay?.connected) {
      this.cloudRelay.publish(this.roomCode, payload);
    }
    if (this.bc) {
      try {
        this.bc.postMessage(payload);
      } catch {
        /* ignore */
      }
    }
  }

  // Create a room as Host
  async createRoom({ name, tokenId, mode = 'classic', maxRounds = 0, bots = [] }) {
    this.connecting = true;
    this.error = null;
    this.notify();

    const code = generateRoomCode();
    this.roomCode = code;
    this.isHost = true;

    await this.connectTransport(code);

    const hostMember = {
      clientId: this.clientId,
      name: (name || 'Host').trim() || 'Player 1',
      tokenId: tokenId || 'auto',
      isHost: true,
      isAi: false,
      ready: true,
      connected: true,
    };

    this.lobby = {
      code,
      hostClientId: this.clientId,
      mode,
      maxRounds,
      status: 'lobby',
      members: [hostMember, ...bots],
      chat: [
        {
          id: Date.now(),
          system: true,
          text: `Room ${code} created! Share the code with your friends.`,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    this.saveSession();
    this.connecting = false;

    if (this.transportMode === 'ws') {
      this.sendRaw({
        type: 'CREATE_ROOM',
        roomCode: code,
        payload: { lobby: this.lobby, clientId: this.clientId },
      });
    } else {
      this.broadcastLobbyState();
    }

    this.notify();
    return code;
  }

  // Join an existing room as Guest
  async joinRoom({ roomCode, name, tokenId }) {
    const cleanCode = (roomCode || '').trim().toUpperCase();
    if (cleanCode.length < 3) {
      this.error = 'Please enter a valid 4-character Room Code.';
      this.notify();
      return false;
    }

    this.connecting = true;
    this.error = null;
    this.roomCode = cleanCode;
    this.isHost = false;
    this.lobby = null;
    this.notify();

    await this.connectTransport(cleanCode);

    const playerSpec = {
      clientId: this.clientId,
      name: (name || '').trim() || 'Friend',
      tokenId: tokenId || 'chai',
      isHost: false,
      isAi: false,
      ready: true,
      connected: true,
    };

    // Wait for either server response or P2P Host response
    return new Promise((resolve) => {
      this.joinResolver = resolve;
      this.sendRaw({
        type: 'JOIN_ROOM',
        roomCode: cleanCode,
        payload: { player: playerSpec, clientId: this.clientId },
      });

      this.joinTimeout = setTimeout(() => {
        if (this.joinResolver) {
          this.joinResolver = null;
          this.connecting = false;
          this.error = `Room "${cleanCode}" not found or host is offline. Check the code!`;
          this.roomCode = null;
          this.notify();
          resolve(false);
        }
      }, 4500);
    });
  }

  // Handle messages when connected to dedicated WS server (`server.js` or Vite `/ws`)
  handleServerMessage(data) {
    const { type } = data;
    if (type === 'ERROR') {
      clearTimeout(this.joinTimeout);
      this.connecting = false;
      this.error = data.message || 'Could not join room.';
      if (this.joinResolver) {
        const r = this.joinResolver;
        this.joinResolver = null;
        r(false);
      }
      this.notify();
      return;
    }

    if (type === 'ROOM_CREATED' || type === 'LOBBY_UPDATED') {
      clearTimeout(this.joinTimeout);
      this.connecting = false;
      this.lobby = data.lobby;
      this.isHost = this.lobby?.hostClientId === this.clientId;
      this.saveSession();
      if (this.joinResolver) {
        const r = this.joinResolver;
        this.joinResolver = null;
        r(true);
      }
      this.notify();
      return;
    }

    if (type === 'PEER_ENVELOPE') {
      this.handlePeerEnvelope(data.envelope);
      return;
    }

    // Or direct envelope from server
    this.handlePeerEnvelope(data);
  }

  // Peer-to-peer / Host-authoritative protocol handler (works across WS, Cloud Relay, and BroadcastChannel)
  handlePeerEnvelope(env) {
    if (!env || env.roomCode !== this.roomCode) return;
    const { type, payload, senderClientId } = env;

    // 1. Guest requests to join room -> Host processes & broadcasts updated lobby (or current game state if reconnecting)
    if (type === 'JOIN_ROOM' && this.isHost && this.lobby) {
      const incoming = payload.player;
      const existingIdx = this.lobby.members.findIndex((m) => m.clientId === incoming.clientId);

      if (existingIdx >= 0) {
        this.lobby.members[existingIdx] = {
          ...this.lobby.members[existingIdx],
          name: incoming.name || this.lobby.members[existingIdx].name,
          connected: true,
        };
      } else {
        const humanAndBotCount = this.lobby.members.length;
        if (humanAndBotCount >= 6) {
          // If there is a bot, replace one bot with the human friend!
          const botIdx = this.lobby.members.findIndex((m) => m.isAi);
          if (botIdx >= 0) {
            this.lobby.members.splice(botIdx, 1);
          } else {
            this.sendRaw({
              type: 'JOIN_REJECTED',
              targetClientId: incoming.clientId,
              reason: 'Room is full (Max 6 players)!',
            });
            return;
          }
        }
        // Pick an unused token for the joining friend
        const ALL_TOKENS = ['auto', 'chai', 'bat', 'scooter', 'elephant', 'chappal'];
        const usedTokens = new Set(this.lobby.members.map((m) => m.tokenId));
        const assignedToken = !usedTokens.has(incoming.tokenId)
          ? incoming.tokenId
          : ALL_TOKENS.find((t) => !usedTokens.has(t)) || incoming.tokenId;

        this.lobby.members.push({
          ...incoming,
          tokenId: assignedToken,
          isHost: false,
          isAi: false,
          ready: true,
          connected: true,
        });

        this.lobby.chat = [
          ...this.lobby.chat.slice(-40),
          {
            id: Date.now() + Math.random(),
            system: true,
            text: `🎉 ${incoming.name} joined the room!`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }

      this.broadcastLobbyState();
      // If game already started, also send current state so reconnecting player jumps right in
      if (this.lobby.status === 'playing' && this.gameHandlers?.onRequestFullSync) {
        this.gameHandlers.onRequestFullSync(incoming.clientId);
      }
      this.notify();
      return;
    }

    if (type === 'JOIN_REJECTED' && env.targetClientId === this.clientId) {
      clearTimeout(this.joinTimeout);
      this.connecting = false;
      this.error = env.reason || 'Room is full!';
      if (this.joinResolver) {
        const r = this.joinResolver;
        this.joinResolver = null;
        r(false);
      }
      this.notify();
      return;
    }

    // 2. Host broadcasts lobby state
    if (type === 'LOBBY_SYNC') {
      clearTimeout(this.joinTimeout);
      this.connecting = false;
      this.lobby = payload.lobby;
      this.isHost = this.lobby?.hostClientId === this.clientId;
      this.saveSession();
      if (this.joinResolver) {
        const r = this.joinResolver;
        this.joinResolver = null;
        r(true);
      }
      this.notify();
      return;
    }

    // 3. Guest updates their seat (name / token / ready)
    if (type === 'MEMBER_UPDATE' && this.isHost && this.lobby) {
      const { clientId, patch } = payload;
      const idx = this.lobby.members.findIndex((m) => m.clientId === clientId);
      if (idx >= 0) {
        if (patch.tokenId) {
          const otherIdx = this.lobby.members.findIndex((m, i) => i !== idx && m.tokenId === patch.tokenId);
          if (otherIdx >= 0 && this.lobby.members[otherIdx].isAi) {
            this.lobby.members[otherIdx].tokenId = this.lobby.members[idx].tokenId;
          }
        }
        this.lobby.members[idx] = { ...this.lobby.members[idx], ...patch };
        this.broadcastLobbyState();
        this.notify();
      }
      return;
    }

    // 4. Chat message in lobby or in-game
    if (type === 'CHAT_MSG') {
      if (this.lobby) {
        const exists = this.lobby.chat.some((c) => c.id === payload.id);
        if (!exists) {
          this.lobby = {
            ...this.lobby,
            chat: [...this.lobby.chat.slice(-50), payload],
          };
          this.notify();
        }
      }
      this.gameHandlers?.onChatMessage?.(payload);
      return;
    }

    // 5. Quick Reaction / Taunt in-game
    if (type === 'REACTION') {
      if (senderClientId !== this.clientId) {
        this.gameHandlers?.onReaction?.(payload);
      }
      return;
    }

    // 6. Game Started / State Sync from Host -> Guests
    if (type === 'STATE_SYNC' && !this.isHost) {
      if (this.lobby && this.lobby.status !== 'playing') {
        this.lobby = { ...this.lobby, status: 'playing' };
      }
      clearTimeout(this.joinTimeout);
      this.connecting = false;
      if (this.joinResolver) {
        const r = this.joinResolver;
        this.joinResolver = null;
        r(true);
      }
      this.gameHandlers?.onStateSync?.(payload.state, payload.sfx);
      this.notify();
      return;
    }

    // 7. Player Action from Guest -> Host
    if (type === 'PLAYER_ACTION' && this.isHost) {
      this.gameHandlers?.onRemoteAction?.(payload, senderClientId);
      return;
    }

    // 8. Member left
    if (type === 'LEAVE_ROOM' && this.isHost && this.lobby) {
      const leaver = this.lobby.members.find((m) => m.clientId === senderClientId);
      if (this.lobby.status === 'lobby') {
        this.lobby.members = this.lobby.members.filter((m) => m.clientId !== senderClientId);
      } else if (leaver) {
        leaver.connected = false;
      }
      if (leaver) {
        this.lobby.chat = [
          ...this.lobby.chat.slice(-40),
          {
            id: Date.now() + Math.random(),
            system: true,
            text: `👋 ${leaver.name} left the room.`,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      this.broadcastLobbyState();
      this.notify();
    }
  }

  broadcastLobbyState() {
    if (!this.isHost || !this.lobby) return;
    this.sendRaw({
      type: 'LOBBY_SYNC',
      payload: { lobby: this.lobby },
    });
  }

  updateMyMember(patch) {
    if (!this.lobby) return;
    if (this.isHost) {
      const idx = this.lobby.members.findIndex((m) => m.clientId === this.clientId);
      if (idx >= 0) {
        if (patch.tokenId) {
          const otherIdx = this.lobby.members.findIndex((m, i) => i !== idx && m.tokenId === patch.tokenId);
          if (otherIdx >= 0) {
            this.lobby.members[otherIdx].tokenId = this.lobby.members[idx].tokenId;
          }
        }
        this.lobby.members[idx] = { ...this.lobby.members[idx], ...patch };
        this.broadcastLobbyState();
        this.notify();
      }
    } else {
      this.sendRaw({
        type: 'MEMBER_UPDATE',
        payload: { clientId: this.clientId, patch },
      });
    }
  }

  updateLobbySettings(patch) {
    if (!this.isHost || !this.lobby) return;
    this.lobby = { ...this.lobby, ...patch };
    this.broadcastLobbyState();
    this.notify();
  }

  addBotToLobby(botId, tokenId) {
    if (!this.isHost || !this.lobby || this.lobby.members.length >= 6) return;
    const ALL_TOKENS = ['auto', 'chai', 'bat', 'scooter', 'elephant', 'chappal'];
    const ALL_BOTS = ['gupta', 'bunty', 'tauji', 'aunty', 'chintu', 'simran'];
    const usedTokens = new Set(this.lobby.members.map((m) => m.tokenId));
    const usedBots = new Set(this.lobby.members.filter((m) => m.isAi).map((m) => m.botId));
    const chosenBot = botId && !usedBots.has(botId) ? botId : ALL_BOTS.find((b) => !usedBots.has(b)) || 'gupta';
    const chosenToken = tokenId && !usedTokens.has(tokenId) ? tokenId : ALL_TOKENS.find((t) => !usedTokens.has(t)) || 'scooter';

    this.lobby = {
      ...this.lobby,
      members: [
        ...this.lobby.members,
        {
          clientId: `bot_${chosenBot}_${Date.now().toString(36).slice(-3)}`,
          name: '',
          botId: chosenBot,
          tokenId: chosenToken,
          isHost: false,
          isAi: true,
          ready: true,
          connected: true,
        },
      ],
    };
    this.broadcastLobbyState();
    this.notify();
  }

  removeMemberFromLobby(clientId) {
    if (!this.isHost || !this.lobby) return;
    this.lobby = {
      ...this.lobby,
      members: this.lobby.members.filter((m) => m.clientId !== clientId),
    };
    this.broadcastLobbyState();
    this.notify();
  }

  sendChat(senderName, senderColor, text) {
    if (!text?.trim() || !this.roomCode) return;
    const msg = {
      id: `${this.clientId}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      clientId: this.clientId,
      sender: senderName,
      color: senderColor || '#ffd34d',
      text: text.trim().slice(0, 140),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    if (this.lobby) {
      this.lobby = {
        ...this.lobby,
        chat: [...this.lobby.chat.slice(-50), msg],
      };
      this.notify();
    }
    this.gameHandlers?.onChatMessage?.(msg);
    this.sendRaw({ type: 'CHAT_MSG', payload: msg });
  }

  sendReaction(reactionPayload) {
    if (!this.roomCode) return;
    this.sendRaw({ type: 'REACTION', payload: reactionPayload });
  }

  broadcastGameState(serializableState, sfx = null) {
    if (!this.isHost || !this.roomCode) return;
    if (this.lobby && this.lobby.status !== 'playing') {
      this.lobby = { ...this.lobby, status: 'playing' };
    }
    this.sendRaw({
      type: 'STATE_SYNC',
      payload: { state: serializableState, sfx },
    });
  }

  sendPlayerAction(actionPayload) {
    if (!this.roomCode) return;
    this.sendRaw({
      type: 'PLAYER_ACTION',
      payload: actionPayload,
    });
  }

  saveSession() {
    try {
      if (this.roomCode) {
        sessionStorage.setItem(ROOM_SESSION_KEY, JSON.stringify({ roomCode: this.roomCode, isHost: this.isHost }));
      }
    } catch {
      /* ignore */
    }
  }

  DisconnectTransportOnly() {
    clearTimeout(this.joinTimeout);
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
    if (this.cloudRelay) {
      this.cloudRelay.close();
      this.cloudRelay = null;
    }
    this.transportMode = 'disconnected';
  }

  leaveRoom() {
    if (this.roomCode) {
      try {
        this.sendRaw({ type: 'LEAVE_ROOM', payload: { clientId: this.clientId } });
      } catch {
        /* ignore */
      }
    }
    this.DisconnectTransportOnly();
    this.roomCode = null;
    this.isHost = false;
    this.lobby = null;
    this.error = null;
    this.connecting = false;
    try {
      sessionStorage.removeItem(ROOM_SESSION_KEY);
    } catch {
      /* ignore */
    }
    this.notify();
  }
}

export const mp = new MultiplayerClient();
