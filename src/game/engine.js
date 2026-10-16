// Nonopoly game director (Local + Real-Time Online Multiplayer).
// Turns run as async scripts (roll → walk → resolve → decide) so animations, bots,
// local humans, and online friends stay in strict lockstep. React reads state via useGame().

import { useSyncExternalStore } from 'react';
import {
  TILES, GROUPS, BUILDINGS, START_SALARY, JAIL_FINE, JAIL_TILE, STARTING_KITTY, TRANSPORT_IDS, isOwnable,
} from '../data/board';
import { KISMET, RISHTEDAAR } from '../data/cards';
import { botById, tokenById, PREWRITTEN_TRASH_TALKS } from '../data/characters';
import * as R from './rules';
import * as AI from './ai';
import { sounds } from '../utils/sound';
import { rupees } from '../utils/format';
import { mp } from './multiplayer';

class Cancelled extends Error {}

const SAVE_KEY = 'nonopoly.save.v2';
const SETTINGS_KEY = 'nonopoly.settings.v2';

export { PREWRITTEN_TRASH_TALKS };
export const QUICK_REACTIONS = PREWRITTEN_TRASH_TALKS;

const BOOM_GROUPS = ['brown', 'sky', 'pink', 'orange', 'red', 'yellow', 'green', 'blue'];

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const freshDeck = (cards) => shuffle(cards.map((_, i) => i));
const blankDeeds = () => TILES.map((t) => (isOwnable(t) ? { owner: null, level: 0, mortgaged: false } : null));

function loadSettings() {
  try {
    return { speed: 'normal', muted: false, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { speed: 'normal', muted: false };
  }
}

function blankState(settings) {
  return {
    status: 'idle',
    config: null,
    online: { active: false, roomCode: null, isHost: false },
    players: [],
    deeds: blankDeeds(),
    turn: 0,
    round: 1,
    boomGroup: 'orange',
    bullRun: false,
    dice: [3, 4],
    rollId: 0,
    rolling: false,
    doubles: 0,
    lastDouble: false,
    kitty: STARTING_KITTY,
    prompt: null,
    pendingTrade: null,
    thinking: null,
    speech: null,
    moment: null,
    toasts: [],
    card: null,
    auction: null,
    log: [],
    chat: [],
    unreadChat: 0,
    deltas: [],
    landed: null,
    moving: null,
    winner: null,
    winReason: null,
    headline: null,
    decks: { kismet: freshDeck(KISMET), rishtedaar: freshDeck(RISHTEDAAR) },
    settings,
    built: null,
  };
}

class Game {
  constructor() {
    const settings = loadSettings();
    sounds.setMuted(settings.muted);
    this.state = blankState(settings);
    this.listeners = new Set();
    this.sid = 0;
    this.seq = 0;
    this.pending = null;
    this.momentResolver = null;
    this.timers = new Set();
    this.chatOpen = false;
    this.lastBotTradeRound = 0;

    mp.setGameHandlers({
      onStateSync: (remoteState, sfx) => this.applyRemoteState(remoteState, sfx),
      onRemoteAction: (actionPayload, senderClientId) => this.handleRemoteAction(actionPayload, senderClientId),
      onChatMessage: (msg) => this.receiveChatMessage(msg),
      onReaction: (reaction) => this.receiveReaction(reaction, false),
      onRequestFullSync: () => {
        if (this.state.online?.active && this.state.online?.isHost && this.state.status !== 'idle') {
          this.syncOnline(null);
        }
      },
    });
  }

  // ---------- store plumbing ----------
  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getState = () => this.state;

  set(patch, sfx = null) {
    const next = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = { ...this.state, ...next };
    this.listeners.forEach((l) => l());
    if (this.state.online?.active && this.state.online?.isHost && this.state.status !== 'idle') {
      this.syncOnline(sfx);
    }
  }

  sfx(name, arg) {
    if (typeof sounds[name] === 'function') {
      sounds[name](arg);
    }
    if (this.state.online?.active && this.state.online?.isHost) {
      this.syncOnline({ name, arg, id: ++this.seq });
    }
  }

  syncOnline(sfx = null) {
    if (!this.state.online?.active || !this.state.online?.isHost) return;
    const {
      status, config, players, deeds, turn, round, boomGroup, bullRun, dice, rollId, rolling,
      doubles, lastDouble, kitty, prompt, pendingTrade, thinking, speech, moment,
      toasts, card, auction, log, deltas, landed, moving, winner, winReason, headline, built,
    } = this.state;
    mp.broadcastGameState({
      status, config, players, deeds, turn, round, boomGroup, bullRun, dice, rollId, rolling,
      doubles, lastDouble, kitty, prompt, pendingTrade, thinking, speech, moment,
      toasts, card, auction, log: log.slice(0, 60), deltas, landed, moving, winner, winReason, headline, built,
    }, sfx);
  }

  applyRemoteState(remote, sfx) {
    if (!remote) return;
    const prevPromptId = this.state.prompt?.id;
    this.state = {
      ...this.state,
      ...remote,
      online: {
        active: true,
        roomCode: mp.roomCode,
        isHost: mp.isHost,
      },
      settings: this.state.settings,
      chat: this.state.chat,
      unreadChat: this.state.unreadChat,
    };

    if (sfx && sfx.id !== this.lastRemoteSfxId) {
      this.lastRemoteSfxId = sfx.id;
      if (typeof sounds[sfx.name] === 'function') {
        sounds[sfx.name](sfx.arg);
      }
    }

    if (remote.prompt && remote.prompt.id !== prevPromptId && this.isControllableByMe(remote.prompt.pid)) {
      sounds.turn();
    }

    this.listeners.forEach((l) => l());
  }

  handleRemoteAction(payload) {
    if (!this.state.online?.active || !this.state.online?.isHost) return;
    const { action } = payload;
    if (action === 'respond') {
      this.respond(payload.value, payload.promptId, true);
    } else if (action === 'build') {
      this.build(payload.pid, payload.id, true);
    } else if (action === 'sellBuilding') {
      this.sellBuilding(payload.pid, payload.id, true);
    } else if (action === 'mortgage') {
      this.mortgage(payload.pid, payload.id, true);
    } else if (action === 'unmortgage') {
      this.unmortgage(payload.pid, payload.id, true);
    } else if (action === 'proposeTrade') {
      this.proposeTrade(payload.trade, true);
    } else if (action === 'respondTrade') {
      this.respondTrade(payload.accept, true);
    }
  }

  player(pid) {
    return this.state.players.find((p) => p.id === pid);
  }

  current() {
    return this.state.players[this.state.turn];
  }

  isControllableByMe(pid) {
    const p = this.player(pid);
    if (!p || p.isAi) return false;
    if (!this.state.online?.active) return true;
    return p.clientId === mp.clientId;
  }

  myPlayer() {
    if (this.state.online?.active) {
      return this.state.players.find((p) => !p.isAi && p.clientId === mp.clientId) || null;
    }
    const pr = this.state.prompt ? this.player(this.state.prompt.pid) : null;
    if (pr && !pr.isAi) return pr;
    const cur = this.current();
    if (cur && !cur.isAi) return cur;
    return this.state.players.find((p) => !p.isAi) || null;
  }

  updatePlayer(pid, patch) {
    this.set((s) => ({
      players: s.players.map((p) => (p.id === pid ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p)),
    }));
  }

  updateDeed(id, patch) {
    this.set((s) => ({ deeds: s.deeds.map((d, i) => (i === id ? { ...d, ...patch } : d)) }));
  }

  convertToBot(pid) {
    if (this.state.online?.active && !this.state.online?.isHost) return;
    const p = this.player(pid);
    if (!p || p.isAi) return;
    const botId = p.botId || 'bunty';
    this.updatePlayer(pid, { isAi: true, botId, name: `${p.name} (Bot)` });
    this.log(`🤖 **${p.name}** is now on Auto-Pilot (Bot).`, { pid });
    if (this.state.prompt?.pid === pid) {
      const pr = this.state.prompt;
      if (pr.type === 'roll') this.respond('roll', pr.id, true);
      else if (pr.type === 'end') this.respond('end', pr.id, true);
      else if (pr.type === 'card') this.respond('ok', pr.id, true);
      else if (pr.type === 'buy') this.respond('auction', pr.id, true);
      else if (pr.type === 'bid') this.respond('pass', pr.id, true);
      else if (pr.type === 'jail') this.respond('roll', pr.id, true);
      else if (pr.type === 'debt') this.respond('auto', pr.id, true);
      else if (pr.type === 'takeover' || pr.type === 'upgrade') this.respond('pass', pr.id, true);
    }
  }

  // ---------- timing (3-speed control: chill, normal, fast) ----------
  factor() {
    const sp = this.state.settings.speed;
    if (sp === 'chill') return 1.38;
    if (sp === 'fast') return 0.46;
    return 1.0;
  }

  cycleSpeed() {
    const order = ['normal', 'fast', 'chill'];
    const cur = this.state.settings.speed || 'normal';
    const next = order[(order.indexOf(cur) + 1) % order.length];
    this.setSetting('speed', next);
    return next;
  }

  wait(ms) {
    const sid = this.sid;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.timers.delete(t);
        if (sid !== this.sid) reject(new Cancelled());
        else resolve();
      }, ms * this.factor());
      this.timers.add(t);
    });
  }

  later(fn, ms) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  // ---------- UI feedback & Cutscenes ----------
  log(text, opts = {}) {
    const id = ++this.seq;
    this.set((s) => ({ log: [{ id, text, pid: opts.pid ?? null, tone: opts.tone || 'info', round: s.round }, ...s.log].slice(0, 120) }));
  }

  headline(text) {
    this.set({ headline: { id: ++this.seq, text } });
  }

  delta(pid, amount) {
    if (!amount) return;
    const id = ++this.seq;
    this.set((s) => ({ deltas: [...s.deltas, { id, pid, amount }] }));
    this.later(() => this.set((s) => ({ deltas: s.deltas.filter((d) => d.id !== id) })), 2200);
  }

  addCash(pid, amount) {
    this.updatePlayer(pid, (p) => ({ cash: p.cash + amount }));
    this.delta(pid, amount);
  }

  say(pid, text, ms = 3600, toChat = false) {
    if (!text) return;
    const id = ++this.seq;
    const p = this.player(pid);
    this.set({ speech: { id, pid, text } });
    if (toChat && p) {
      const msg = {
        id: `bot_${id}`,
        sender: `${p.isAi ? '🤖 ' : ''}${p.name}`,
        color: p.color,
        text,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      this.state = {
        ...this.state,
        chat: [...this.state.chat.slice(-60), msg],
      };
      this.listeners.forEach((l) => l());
    }
    this.later(() => {
      if (this.state.speech?.id === id) this.set({ speech: null });
    }, ms);
  }

  toast(spec, ms = 2600) {
    const id = ++this.seq;
    this.set((s) => ({ toasts: [...s.toasts.slice(-2), { id, ...spec }] }));
    this.later(() => this.set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), ms);
  }

  async moment(spec, ms = 2400) {
    const id = ++this.seq;
    const sid = this.sid;
    this.set({ moment: { id, ...spec } });
    try {
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => {
          this.timers.delete(t);
          this.momentResolver = null;
          if (sid !== this.sid) reject(new Cancelled());
          else resolve();
        }, ms * this.factor());
        this.timers.add(t);
        this.momentResolver = () => {
          clearTimeout(t);
          this.timers.delete(t);
          this.momentResolver = null;
          resolve();
        };
      });
    } finally {
      if (this.state.moment?.id === id) this.set({ moment: null });
    }
  }

  skipMoment() {
    if (this.momentResolver) {
      sounds.click();
      this.momentResolver();
    }
  }

  async think(pid, ms = 1100) {
    this.set({ thinking: pid });
    await this.wait(ms);
    this.set({ thinking: null });
  }

  // ---------- Chat & Prewritten Trash-Talks ----------
  setChatOpen(open) {
    this.chatOpen = open;
    if (open && this.state.unreadChat > 0) {
      this.set({ unreadChat: 0 });
    }
  }

  triggerBotClapback(senderPlayer, targetPid = null) {
    if (this.state.online?.active && !this.state.online?.isHost) return;
    const bots = this.state.players.filter((p) => p.isAi && !p.bankrupt);
    if (!bots.length) return;
    const targetBot = targetPid ? bots.find((b) => b.id === targetPid) : null;
    const responder = targetBot || (Math.random() < 0.78 ? bots[Math.floor(Math.random() * bots.length)] : null);
    if (!responder) return;

    this.later(() => {
      if (this.state.status !== 'playing') return;
      const reply = AI.generateBotTrashTalk(this.state, responder, 'clapback', { sender: senderPlayer });
      if (reply) {
        sounds.pop();
        this.say(responder.id, reply, 3600, true);
        this.toast({
          kind: 'chat',
          icon: '🔥',
          title: `${responder.name} claps back!`,
          sub: reply,
          tone: 'info',
          pid: responder.id,
        }, 2800);
      }
    }, 1150);
  }

  sendChat(text) {
    if (!text?.trim()) return;
    const me = this.myPlayer() || this.current() || { name: 'Player', color: '#ffd34d', id: 'p1' };
    if (this.state.online?.active) {
      mp.sendChat(me.name, me.color, text);
    } else {
      this.receiveChatMessage({
        id: `local_${++this.seq}`,
        sender: me.name,
        color: me.color,
        text: text.trim().slice(0, 140),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      });
      this.triggerBotClapback(me);
    }
  }

  receiveChatMessage(msg) {
    if (!msg) return;
    const exists = this.state.chat.some((c) => c.id === msg.id);
    if (exists) return;
    sounds.pop();
    const senderPlayer = this.state.players.find((p) => p.name === msg.sender);
    if (senderPlayer) {
      this.say(senderPlayer.id, msg.text, 3400);
    }
    this.state = {
      ...this.state,
      chat: [...this.state.chat.slice(-60), msg],
      unreadChat: this.chatOpen ? 0 : this.state.unreadChat + 1,
    };
    this.listeners.forEach((l) => l());
  }

  sendReaction(reactionId, targetPid = null) {
    const r = PREWRITTEN_TRASH_TALKS.find((x) => x.id === reactionId);
    if (!r) return;
    const me = this.myPlayer() || this.current();
    if (!me) return;
    const targetPlayer = targetPid ? this.player(targetPid) : null;
    const finalText = targetPlayer && typeof r.targeted === 'function' ? r.targeted(targetPlayer.name) : r.text;

    const payload = {
      id: `re_${++this.seq}_${Date.now()}`,
      pid: me.id,
      sender: me.name,
      color: me.color,
      emoji: r.emoji,
      text: finalText,
      targetPid: targetPlayer?.id || null,
    };
    this.receiveReaction(payload, true);
    if (this.state.online?.active) {
      mp.sendReaction(payload);
    } else {
      this.triggerBotClapback(me, targetPlayer?.id || null);
    }
  }

  receiveReaction(payload, isLocal) {
    if (!payload) return;
    sounds.taunt();
    this.say(payload.pid, `${payload.emoji} ${payload.text}`, 3600);
    const chatEntry = {
      id: payload.id,
      sender: payload.sender,
      color: payload.color,
      text: `${payload.emoji} ${payload.text}`,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    if (!this.state.chat.some((c) => c.id === chatEntry.id)) {
      this.state = {
        ...this.state,
        chat: [...this.state.chat.slice(-60), chatEntry],
      };
      this.listeners.forEach((l) => l());
    }
    this.toast({
      kind: 'chat',
      icon: payload.emoji,
      title: payload.sender,
      sub: payload.text,
      tone: 'info',
      pid: payload.pid,
    }, 2700);
    if (isLocal && this.state.online?.active && this.state.online?.isHost) {
      this.syncOnline(null);
    }
  }

  // ---------- prompts ----------
  ask(pid, spec) {
    return new Promise((resolve, reject) => {
      const id = ++this.seq;
      this.pending = { id, resolve, reject };
      if (this.isControllableByMe(pid)) {
        sounds.turn();
      }
      this.set({ prompt: { id, pid, ...spec }, thinking: null });
    });
  }

  respond(value, promptId, fromRemote = false) {
    if (this.state.online?.active && !this.state.online?.isHost && !fromRemote) {
      sounds.click();
      mp.sendPlayerAction({ action: 'respond', value, promptId });
      return;
    }
    const p = this.pending;
    if (!p || (promptId && promptId !== p.id)) return;
    sounds.click();
    this.pending = null;
    this.set({ prompt: null });
    p.resolve(value);
  }

  // ---------- settings ----------
  setSetting(key, value) {
    const settings = { ...this.state.settings, [key]: value };
    if (key === 'muted') sounds.setMuted(value);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* private mode */
    }
    this.set({ settings });
  }

  // ---------- lifecycle ----------
  cancel() {
    this.sid++;
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.momentResolver = null;
    if (this.pending) {
      const p = this.pending;
      this.pending = null;
      p.reject(new Cancelled());
    }
  }

  newGame(config) {
    this.cancel();
    this.lastBotTradeRound = 0;
    if (config.speed) {
      this.setSetting('speed', config.speed);
    }
    const isOnline = !!config.online?.active;
    const players = config.players.map((p, i) => ({
      id: `p${i + 1}`,
      seat: i,
      clientId: p.clientId || null,
      name: p.name.trim() || (p.isAi ? botById(p.botId).name : `Player ${i + 1}`),
      tokenId: p.tokenId,
      color: p.color,
      isAi: p.isAi,
      botId: p.botId || (p.isAi ? 'gupta' : null),
      cash: config.startCash,
      pos: 0,
      inJail: false,
      jailTurns: 0,
      jailCards: 0,
      bankrupt: false,
    }));
    const deeds = blankDeeds();
    if (config.mode === 'express') {
      const pool = shuffle(TILES.filter((t) => t.type === 'property').map((t) => t.id));
      const plotsPerPlayer = players.length <= 3 ? 3 : 2;
      players.forEach((p, i) => {
        for (let k = 0; k < plotsPerPlayer; k++) {
          const id = pool[i * plotsPerPlayer + k];
          if (id !== undefined) deeds[id] = { ...deeds[id], owner: p.id };
        }
      });
    }
    const firstBoom = BOOM_GROUPS[Math.floor(Math.random() * BOOM_GROUPS.length)];
    this.state = {
      ...blankState(this.state.settings),
      status: 'playing',
      config,
      online: isOnline
        ? { active: true, roomCode: config.online.roomCode, isHost: config.online.isHost }
        : { active: false, roomCode: null, isHost: false },
      players,
      deeds,
      boomGroup: firstBoom,
      chat: config.initialChat || [],
    };
    this.listeners.forEach((l) => l());
    this.log(`🪔 Game on! ${players.length} tycoons line up at START with ${rupees(config.startCash)} each.`, { tone: 'big' });
    this.headline(`Nonopoly begins! 🔥 ${GROUPS[firstBoom].name} is Round 1's Boom City (1.5× rent)!`);
    if (!isOnline || config.online.isHost) {
      this.syncOnline({ name: 'victory', id: ++this.seq });
      this.run();
    }
  }

  joinOnlineGameAsGuest(roomCode) {
    this.cancel();
    this.state = {
      ...blankState(this.state.settings),
      status: 'playing',
      online: { active: true, roomCode, isHost: false },
      chat: mp.lobby?.chat || [],
    };
    this.listeners.forEach((l) => l());
  }

  hasSave() {
    return !!this.loadSave();
  }

  loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      return s && s.v === 2 && s.status === 'playing' ? s : null;
    } catch {
      return null;
    }
  }

  save() {
    if (this.state.online?.active) return;
    try {
      const { status, config, players, deeds, turn, round, boomGroup, bullRun, kitty, decks, log, dice } = this.state;
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 2, status, config, players, deeds, turn, round, boomGroup, bullRun, kitty, decks, log: log.slice(0, 40), dice, savedAt: Date.now(),
      }));
    } catch {
      /* storage full or disabled */
    }
  }

  clearSave() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
  }

  resume() {
    const saved = this.loadSave();
    if (!saved) return false;
    this.cancel();
    const { v: _v, savedAt: _t, ...rest } = saved;
    this.state = {
      ...blankState(this.state.settings),
      ...rest,
      online: { active: false, roomCode: null, isHost: false },
      status: 'playing',
    };
    this.listeners.forEach((l) => l());
    this.log('Welcome back! The game continues.', { tone: 'big' });
    this.run();
    return true;
  }

  quit() {
    this.cancel();
    if (this.state.online?.active) {
      mp.leaveRoom();
    }
    this.set({
      status: 'idle',
      online: { active: false, roomCode: null, isHost: false },
      prompt: null,
      pendingTrade: null,
      moment: null,
      card: null,
      auction: null,
      thinking: null,
      speech: null,
      toasts: [],
      moving: null,
      rolling: false,
    });
  }

  run() {
    const sid = this.sid;
    this.loop(sid).catch((e) => {
      if (!(e instanceof Cancelled)) console.error('[nonopoly] game loop crashed', e);
    });
  }

  // ---------- main loop ----------
  async loop(sid) {
    for (;;) {
      if (sid !== this.sid) return;
      if (this.checkEnd()) return;
      const p = this.current();
      if (!p.bankrupt) {
        this.save();
        await this.playTurn(p.id);
      }
      if (sid !== this.sid) return;
      if (this.checkEnd()) return;
      this.advance();
    }
  }

  advance() {
    const { players } = this.state;
    let i = this.state.turn;
    let round = this.state.round;
    let boomGroup = this.state.boomGroup;
    let bullRun = this.state.bullRun;
    do {
      i = (i + 1) % players.length;
      if (i === 0) {
        round++;
        boomGroup = BOOM_GROUPS[Math.floor(Math.random() * BOOM_GROUPS.length)];
      }
    } while (players[i].bankrupt);

    // Activate Bull Run when almost all properties are bought or Round >= 7
    const unowned = R.unownedPropertyCount(this.state);
    if (!bullRun && (unowned <= 3 || round >= 7)) {
      bullRun = true;
      this.log('🐂 **SENSEX BULL RUN BEGINS!** Boom City rents now surge 1.75× for the rest of the game!', { tone: 'big' });
      this.headline('🐂 SENSEX BULL RUN: Every Bazaar Utsav Boom City now charges 1.75× rent!');
    } else if (round !== this.state.round) {
      const gName = boomGroup ? GROUPS[boomGroup].name : '';
      const multTxt = bullRun ? '1.75×' : '1.5×';
      this.log(`Round ${round} begins! 🔥 Bazaar Utsav in ${gName} (${multTxt} rent this round).`, { tone: 'round' });
      if (boomGroup) {
        this.headline(`🔥 BAZAAR UTSAV: ${gName} rents surge ${multTxt} during Round ${round}!`);
      }
    }
    this.set({ turn: i, round, boomGroup, bullRun, doubles: 0, lastDouble: false, landed: null });
  }

  checkEnd() {
    const alive = this.state.players.filter((p) => !p.bankrupt);
    if (alive.length <= 1) {
      this.finish(alive[0]?.id, 'last');
      return true;
    }
    const targetWealth = this.state.config?.targetWealth;
    if (targetWealth) {
      const rich = alive.find((p) => R.netWorth(this.state, p.id) >= targetWealth);
      if (rich) {
        this.finish(rich.id, 'wealth');
        return true;
      }
    }
    const max = this.state.config?.maxRounds;
    if (max && this.state.round > max) {
      const best = [...alive].sort((a, b) => R.netWorth(this.state, b.id) - R.netWorth(this.state, a.id))[0];
      this.finish(best.id, 'rounds');
      return true;
    }
    return false;
  }

  finish(winnerId, reason) {
    this.clearSave();
    const w = this.player(winnerId);
    this.set(
      { status: 'over', winner: winnerId, winReason: reason, prompt: null, pendingTrade: null, moment: null, thinking: null },
      { name: 'victory', id: ++this.seq },
    );
    if (w) {
      this.log(`🏆 **${w.name}** is the Nonopoly Champion!`, { pid: w.id, tone: 'big' });
      this.headline(`${w.name} crowned Nonopoly Champion! Dhol-nagade, fireworks, mithai for all!`);
    }
    sounds.victory();
  }

  // ---------- a full turn ----------
  async playTurn(pid) {
    this.set({ doubles: 0, lastDouble: false });
    for (;;) {
      let p = this.player(pid);
      if (p.inJail) {
        const out = await this.jailTurn(pid);
        if (out === 'done') break;
      }
      p = this.player(pid);
      if (p.isAi) {
        if (this.state.doubles === 0 && Math.random() < 0.45) {
          const opener = AI.generateBotTrashTalk(this.state, p, 'turn_start');
          if (opener) this.say(pid, opener, 3200, true);
        }
        await this.think(pid, 1150);
      } else {
        await this.ask(pid, { type: 'roll' });
      }

      const [a, b] = await this.roll(pid);
      const dbl = a === b;
      if (dbl) {
        const d = this.state.doubles + 1;
        this.set({ doubles: d });
        if (d >= 3) {
          this.log(`🚨 Three doubles in a row! **${p.name}** gets an overspeeding challan.`, { pid, tone: 'loss' });
          await this.sendToJail(pid, 'speeding');
          break;
        }
        this.sfx('double');
      }
      if (p.isAi && (dbl || a + b >= 10) && Math.random() < 0.5) {
        const rollTaunt = AI.generateBotTrashTalk(this.state, p, 'big_roll', { total: a + b, isDouble: dbl });
        if (rollTaunt) this.say(pid, rollTaunt, 2800);
      }
      // Brief pause after dice land so players can clearly read the dice total before token hops
      await this.wait(520);
      await this.moveBy(pid, a + b);
      await this.wait(420);
      await this.resolve(pid, a + b);
      p = this.player(pid);
      if (p.bankrupt || p.inJail || !dbl) break;
      this.log(`🎲 Doubles! **${p.name}** gets a bonus roll.`, { pid });
      this.toast({ kind: 'double', title: 'Doubles!', sub: `${p.name} rolls again`, tone: 'gain' }, 2000);
      await this.wait(650);
    }
    if (!this.player(pid).bankrupt) await this.endPhase(pid);
  }

  async roll(pid) {
    const a = 1 + Math.floor(Math.random() * 6);
    const b = 1 + Math.floor(Math.random() * 6);
    this.sfx('dice');
    this.set((s) => ({ rolling: true, rollId: s.rollId + 1, dice: [a, b], lastDouble: a === b, landed: null }));
    await this.wait(940);
    this.set({ rolling: false });
    const p = this.player(pid);
    this.log(`🎲 **${p.name}** rolled ${a} + ${b} = ${a + b}${a === b ? ' (Doubles!)' : ''}`, { pid });
    return [a, b];
  }

  async moveBy(pid, steps) {
    const dir = Math.sign(steps);
    const n = Math.abs(steps);
    this.set({ moving: pid });
    let dodged = null;
    for (let i = 0; i < n; i++) {
      const p = this.player(pid);
      const pos = (p.pos + dir + 40) % 40;
      this.updatePlayer(pid, { pos });
      this.sfx('hop', i);
      if (pos === 0 && dir > 0) this.passStart(pid, i === n - 1);
      // Track if a bot stepped right past a high-rent rival tile without landing on it
      if (i < n - 1) {
        const d = this.state.deeds[pos];
        if (d && d.owner && d.owner !== pid && !d.mortgaged) {
          const r = R.rentFor(this.state, pos, 7);
          if (r >= 90000 && (!dodged || r > dodged.rent)) {
            dodged = { tile: TILES[pos], owner: this.player(d.owner), rent: r };
          }
        }
      }
      await this.wait(i === n - 1 ? 320 : 195);
    }
    this.set({ moving: null });
    const finalPlayer = this.player(pid);
    const finalDeed = this.state.deeds[finalPlayer.pos];
    const landedSafe = !finalDeed || !finalDeed.owner || finalDeed.owner === pid;
    if (finalPlayer.isAi && dodged && landedSafe && Math.random() < 0.55) {
      const dodgeLine = AI.generateBotTrashTalk(this.state, finalPlayer, 'dodged_rent', dodged);
      if (dodgeLine) this.say(pid, dodgeLine, 3000, true);
    }
  }

  async walkTo(pid, target) {
    const steps = (target - this.player(pid).pos + 40) % 40;
    if (steps) await this.moveBy(pid, steps);
  }

  passStart(pid, exactLanding = false) {
    const p = this.player(pid);
    const bonus = exactLanding ? START_SALARY + 100000 : START_SALARY;
    this.addCash(pid, bonus);
    this.sfx('sitar');
    this.toast({
      kind: 'shagun',
      title: exactLanding ? 'Bumper Shagun!' : 'Shagun!',
      sub: exactLanding ? `${p.name} landed right on START!` : `${p.name} completed a lap`,
      amount: bonus,
      tone: 'gain',
      pid,
    });
    this.log(`🪔 **${p.name}** ${exactLanding ? 'landed directly on' : 'crossed'} START and collected ${rupees(bonus)} Shagun!`, { pid, tone: 'gain' });
  }

  // ---------- landing ----------
  async resolve(pid, roll, opts = {}) {
    const tile = TILES[this.player(pid).pos];
    this.set({ landed: tile.id });
    if (tile.type === 'corner') return this.resolveCorner(pid, tile);
    if (tile.type === 'tax') return this.resolveTax(pid, tile);
    if (tile.type === 'chance') return this.drawCard(pid, 'kismet');
    if (tile.type === 'community') return this.drawCard(pid, 'rishtedaar');
    return this.resolveOwnable(pid, tile, roll, opts);
  }

  async resolveCorner(pid, tile) {
    const p = this.player(pid);
    if (tile.corner === 'gotojail') {
      this.log(`🚨 ED RAID! **${p.name}** is taken straight to Tihar Jail.`, { pid, tone: 'loss' });
      await this.sendToJail(pid, 'raid');
    } else if (tile.corner === 'parking') {
      const k = this.state.kitty;
      if (k > 0) {
        this.sfx('victory');
        this.set({ kitty: 0 });
        await this.moment({ kind: 'jackpot', pid, amount: k }, 2600);
        this.addCash(pid, k);
        this.log(`☕ JACKPOT! **${p.name}** broke the Jugaad Gullak open for ${rupees(k)}!`, { pid, tone: 'gain' });
        this.headline(`${p.name} hits the Jugaad Junction jackpot: ${rupees(k)}!`);
      } else {
        this.toast({ kind: 'chai', title: 'Chai break', sub: 'The Gullak is empty right now', tone: 'info' });
        this.log(`☕ **${p.name}** sips cutting chai. The Gullak is empty.`, { pid });
      }
      await this.wait(600);
    } else if (tile.corner === 'jail') {
      this.log(`👋 **${p.name}** is just visiting Tihar.`, { pid });
      await this.wait(500);
    }
  }

  async resolveTax(pid, tile) {
    const p = this.player(pid);
    this.sfx('tension');
    this.toast({ kind: 'tax', title: tile.short, sub: `${p.name} pays into Gullak`, amount: -tile.amount, tone: 'loss', pid });
    this.log(`🧾 **${p.name}** paid ${rupees(tile.amount)} for ${tile.name}. Added to Jugaad Gullak!`, { pid, tone: 'loss' });
    await this.wait(850);
    await this.charge(pid, tile.amount, 'kitty', tile.name);
  }

  async resolveOwnable(pid, tile, roll, opts) {
    const deed = this.state.deeds[tile.id];
    const p = this.player(pid);
    if (!deed.owner) return this.offer(pid, tile.id);

    // Landed on own property -> Check for Desi Jugaad Spot Upgrade!
    if (deed.owner === pid) {
      this.log(`🏠 **${p.name}** visits their own ${tile.name}.`, { pid });
      const upg = R.canSpotUpgrade(this.state, pid, tile.id);
      if (upg.ok) {
        let doUpg = false;
        if (p.isAi) {
          await this.think(pid, 950);
          doUpg = AI.decideSpotUpgrade(this.state, p, tile.id);
        } else {
          const ans = await this.ask(pid, {
            type: 'upgrade',
            tileId: tile.id,
            cost: upg.cost,
            nextLevel: upg.nextLevel,
          });
          doUpg = ans === 'upgrade';
        }
        if (doUpg) {
          await this.spotUpgrade(pid, tile.id);
        }
      } else {
        await this.wait(500);
      }
      return;
    }

    const owner = this.player(deed.owner);
    if (deed.mortgaged) {
      this.toast({ kind: 'info', title: 'Girvi!', sub: `${tile.short} is mortgaged — ₹0 rent`, tone: 'info' });
      this.log(`📜 ${tile.name} is mortgaged, so **${p.name}** pays nothing.`, { pid });
      await this.wait(700);
    } else {
      let rent = R.rentFor(this.state, tile.id, roll);
      if (opts.doubleRent) rent *= 2;
      this.sfx('cash');
      if (owner.isAi && (!p.isAi || Math.random() < 0.6)) {
        const line = AI.generateBotTrashTalk(this.state, owner, 'collect_rent', { payer: p, tile, rent });
        this.say(owner.id, line, 3600, true);
      } else if (p.isAi) {
        const line = AI.generateBotTrashTalk(this.state, p, 'pay_rent', { owner, tile, rent });
        this.say(pid, line, 3500, true);
      }

      this.log(`💸 **${p.name}** paid ${rupees(rent)} rent to **${owner.name}** for ${tile.name}.`, { pid, tone: 'loss' });

      if (rent >= 120000) {
        await this.moment({ kind: 'bigrent', pid, to: owner.id, amount: rent, tileId: tile.id }, 2500);
      } else {
        this.toast({ kind: 'rent', title: 'Kiraya!', sub: `${p.name} → ${owner.name}`, amount: -rent, tone: 'loss', pid, to: owner.id });
        await this.wait(950);
      }
      await this.charge(pid, rent, owner.id, `Rent for ${tile.name}`);
    }

    // Check if the player can launch a Hostile Takeover (Kabza Buyout) on this property!
    const refreshedPlayer = this.player(pid);
    if (!refreshedPlayer.bankrupt) {
      const tk = R.canTakeover(this.state, pid, tile.id);
      if (tk.ok) {
        let doTakeover = false;
        if (refreshedPlayer.isAi) {
          await this.think(pid, 1000);
          doTakeover = AI.decideTakeover(this.state, refreshedPlayer, tile.id);
        } else {
          const ans = await this.ask(pid, {
            type: 'takeover',
            tileId: tile.id,
            cost: tk.cost,
            ownerId: owner.id,
            completesMine: tk.completesMine,
          });
          doTakeover = ans === 'takeover';
        }
        if (doTakeover) {
          await this.executeTakeover(pid, tile.id, tk.cost, owner.id);
        }
      }
    }
  }

  async spotUpgrade(pid, id) {
    const chk = R.canSpotUpgrade(this.state, pid, id);
    if (!chk.ok) return;
    const tile = TILES[id];
    const level = chk.nextLevel;
    this.addCash(pid, -chk.cost);
    this.updateDeed(id, { level });
    this.set({ built: { id, n: ++this.seq } });
    this.sfx('build', level);
    const p = this.player(pid);
    const bName = BUILDINGS[level]?.name || 'Building';
    this.log(`🏗️ **${p.name}** upgraded ${tile.name} to a **${bName}** for ${rupees(chk.cost)}!`, { pid, tone: 'gain' });
    if (level === 5) {
      if (p.isAi) {
        const line = AI.generateBotTrashTalk(this.state, p, 'haveli', { tile });
        this.say(pid, line, 3600, true);
      }
      this.headline(`${p.name} unveils a Royal Haveli on ${tile.name}!`);
      await this.moment({ kind: 'haveli', pid, tileId: id }, 2600);
    } else {
      this.toast({ kind: 'haveli', title: `Upgraded to ${bName}!`, sub: tile.name, tone: 'gain', pid });
      await this.wait(750);
    }
  }

  async executeTakeover(pid, id, cost, prevOwnerId) {
    const tile = TILES[id];
    const p = this.player(pid);
    const prevOwner = this.player(prevOwnerId);
    if (!p || !prevOwner || p.cash < cost) return;
    this.addCash(pid, -cost);
    this.addCash(prevOwnerId, cost);
    this.updateDeed(id, { owner: pid, mortgaged: false });
    this.sfx('dhol');
    if (p.isAi) {
      const line = AI.generateBotTrashTalk(this.state, p, 'takeover', { victim: prevOwner, tile, cost });
      this.say(pid, line, 3800, true);
    }
    this.log(`🏴‍☠️ **HOSTILE TAKEOVER!** **${p.name}** bought out **${tile.name}** from **${prevOwner.name}** for ${rupees(cost)}!`, { pid, tone: 'big' });
    this.headline(`KABZA ALERT: ${p.name} executes a ${rupees(cost)} Hostile Takeover of ${tile.name} from ${prevOwner.name}!`);
    await this.moment({ kind: 'takeover', pid, to: prevOwnerId, tileId: id, amount: cost }, 2600);

    const g = tile.group;
    if (g && R.ownsGroup(this.state, g, pid)) {
      this.sfx('victory');
      if (p.isAi) {
        const line = AI.generateBotTrashTalk(this.state, p, 'monopoly', { group: g });
        this.say(pid, line, 3600, true);
      }
      this.log(`👑 **${p.name}** now controls the entire **${GROUPS[g].name}** monopoly!`, { pid, tone: 'big' });
      await this.moment({ kind: 'monopoly', pid, group: g }, 2600);
    }
  }

  async offer(pid, id) {
    const tile = TILES[id];
    const p = this.player(pid);
    let choice;
    if (p.isAi) {
      await this.think(pid, 1300);
      const d = AI.decideBuy(this.state, p, id);
      choice = d.buy ? 'buy' : 'auction';
      this.say(pid, d.line, 3400, true);
    } else {
      choice = await this.ask(pid, { type: 'buy', tileId: id });
    }
    if (choice === 'buy' && this.player(pid).cash >= tile.price) await this.purchase(pid, id, tile.price);
    else await this.auction(id, pid);
  }

  async purchase(pid, id, price, viaAuction = false, initiatorId = null) {
    const tile = TILES[id];
    const p = this.player(pid);
    this.addCash(pid, -price);
    this.updateDeed(id, { owner: pid });
    this.sfx('stamp');
    if (viaAuction && p.isAi) {
      const initiator = initiatorId ? this.player(initiatorId) : null;
      const winLine = AI.generateBotTrashTalk(this.state, p, 'auction_win', { tile, price, initiator });
      if (winLine) this.say(pid, winLine, 3400, true);
    }
    this.log(`🏷️ **${p.name}** ${viaAuction ? 'won the auction for' : 'bought'} ${tile.name} for ${rupees(price)}.`, { pid, tone: 'gain' });
    this.headline(`${p.name} snaps up ${tile.name} (${tile.city}) for ${rupees(price)}!`);
    await this.moment({ kind: 'sold', pid, tileId: id, amount: price, auction: viaAuction }, 2100);
    const g = tile.group;
    if (g && R.ownsGroup(this.state, g, pid)) {
      this.sfx('dhol');
      if (p.isAi) {
        const monoLine = AI.generateBotTrashTalk(this.state, p, 'monopoly', { group: g });
        this.say(pid, monoLine, 3600, true);
      }
      this.log(`👑 **${p.name}** owns the whole ${GROUPS[g].name} set!${tile.type === 'property' ? ' Rents double and Havelis are unlocked.' : ''}`, { pid, tone: 'big' });
      this.headline(`MONOPOLY ALERT: ${p.name} controls all of ${GROUPS[g].name}!`);
      await this.moment({ kind: 'monopoly', pid, group: g }, 2600);
    }
  }

  async auction(id, initiatorId) {
    const tile = TILES[id];
    const inc = tile.price >= 200000 ? 20000 : 10000;
    const alive = this.state.players.filter((p) => !p.bankrupt).map((p) => p.id);
    const start = alive.indexOf(initiatorId);
    const order = [...alive.slice(start + 1), ...alive.slice(0, start + 1)];
    const passed = new Set();
    let high = 0;
    let leader = null;
    this.set({ auction: { tileId: id, high, leaderId: null, passed: [], bidderId: null, inc, done: false, last: null } });
    this.sfx('dhol');
    this.log(`🔨 ${tile.name} goes under the hammer!`, { tone: 'big' });
    await this.wait(900);

    let i = 0;
    for (let guard = 0; guard < 300; guard++) {
      const active = order.filter((x) => !passed.has(x));
      if (!active.length || (leader && active.length === 1 && active[0] === leader)) break;
      const bidderId = order[i % order.length];
      i++;
      if (passed.has(bidderId) || bidderId === leader) continue;
      const b = this.player(bidderId);
      const min = high + inc;
      if (b.cash < min) {
        passed.add(bidderId);
        this.set((s) => ({ auction: { ...s.auction, passed: [...passed], last: { pid: bidderId, pass: true } } }));
        continue;
      }
      this.set((s) => ({ auction: { ...s.auction, bidderId } }));
      let action;
      if (b.isAi) {
        await this.think(bidderId, 780);
        action = AI.decideBid(this.state, b, id, high, inc) ?? 'pass';
      } else {
        action = await this.ask(bidderId, { type: 'bid', tileId: id, high, min, inc });
      }
      if (action === 'pass') {
        passed.add(bidderId);
      } else {
        high = Math.max(min, Math.min(Number(action) || min, b.cash));
        leader = bidderId;
        this.sfx('bid');
        if (b.isAi && Math.random() < 0.35) this.say(bidderId, botById(b.botId).lines.bid, 2200);
      }
      this.set((s) => ({
        auction: { ...s.auction, high, leaderId: leader, passed: [...passed], bidderId: null, last: { pid: bidderId, pass: action === 'pass', amount: high } },
      }));
    }

    this.set((s) => ({ auction: { ...s.auction, done: true, bidderId: null } }));
    await this.wait(1100);
    this.set({ auction: null });
    if (leader) await this.purchase(leader, id, high, true, initiatorId);
    else this.log(`🔨 No bids. ${tile.name} stays with the sarkar.`);
  }

  // ---------- cards ----------
  async drawCard(pid, deck) {
    let pile = this.state.decks[deck];
    const cards = deck === 'kismet' ? KISMET : RISHTEDAAR;
    if (!pile.length) pile = freshDeck(cards);
    const [idx, ...rest] = pile;
    const card = cards[idx];
    this.sfx('whoosh', deck);
    this.set((s) => ({ decks: { ...s.decks, [deck]: rest }, card: { id: ++this.seq, deck, card, pid } }));
    const p = this.player(pid);
    if (p.isAi) await this.wait(2800);
    else await this.ask(pid, { type: 'card' });
    this.set({ card: null });
    this.log(`${deck === 'kismet' ? '🦜' : '👵'} **${p.name}** drew “${card.title}”.`, { pid });
    await this.applyCard(pid, card);
  }

  async applyCard(pid, card) {
    const a = card.action;
    const p = this.player(pid);
    const others = () => this.state.players.filter((o) => o.id !== pid && !o.bankrupt);
    const lastRoll = this.state.dice[0] + this.state.dice[1];
    switch (a.type) {
      case 'gain':
        this.sfx('cash');
        this.addCash(pid, a.amount);
        this.log(`💰 **${p.name}** collected ${rupees(a.amount)}.`, { pid, tone: 'gain' });
        await this.wait(700);
        break;
      case 'pay':
        await this.charge(pid, a.amount, 'bank', card.title);
        await this.wait(650);
        break;
      case 'kitty':
        await this.charge(pid, a.amount, 'kitty', card.title);
        await this.wait(650);
        break;
      case 'collectAll':
        this.sfx('coins');
        for (const o of others()) await this.charge(o.id, a.amount, pid, card.title);
        await this.wait(700);
        break;
      case 'payAll':
        for (const o of others()) {
          if (this.player(pid).bankrupt) break;
          await this.charge(pid, a.amount, o.id, card.title);
        }
        await this.wait(700);
        break;
      case 'bail':
        this.sfx('sitar');
        this.updatePlayer(pid, (x) => ({ jailCards: x.jailCards + 1 }));
        this.log(`📜 **${p.name}** pockets a VIP Bail Pass.`, { pid, tone: 'gain' });
        await this.wait(650);
        break;
      case 'jail':
        await this.sendToJail(pid, 'raid');
        break;
      case 'goto':
        await this.walkTo(pid, a.tile);
        await this.resolve(pid, lastRoll);
        break;
      case 'back':
        await this.moveBy(pid, -a.steps);
        await this.resolve(pid, lastRoll);
        break;
      case 'nearestTransport': {
        const target = TRANSPORT_IDS.find((t) => t > p.pos) ?? TRANSPORT_IDS[0];
        await this.walkTo(pid, target);
        await this.resolve(pid, lastRoll, { doubleRent: true });
        break;
      }
      case 'repairs': {
        let cost = 0;
        R.ownedIds(this.state, pid).forEach((id) => {
          const lvl = this.state.deeds[id].level;
          cost += lvl === 5 ? a.perHaveli : lvl * a.perLevel;
        });
        if (cost > 0) await this.charge(pid, cost, 'kitty', card.title);
        else this.log(`😌 **${p.name}** has no buildings, so ₹0 repair cost.`, { pid });
        await this.wait(650);
        break;
      }
      default:
        break;
    }
  }

  // ---------- jail ----------
  async sendToJail(pid, reason) {
    const p = this.player(pid);
    this.sfx('siren');
    this.set({ doubles: 0, lastDouble: false });
    await this.moment({ kind: 'raid', pid, reason }, 2600);
    this.updatePlayer(pid, { pos: JAIL_TILE, inJail: true, jailTurns: 0 });
    this.set({ landed: JAIL_TILE });
    this.headline(`BREAKING: ${p.name} locked in Tihar Jail! Sources say the false ceiling was "very full".`);
    await this.wait(750);
  }

  async jailTurn(pid) {
    const p = this.player(pid);
    let choice;
    if (p.isAi) {
      await this.think(pid, 1000);
      choice = AI.decideJail(this.state, p);
      if (choice === 'pay' && p.cash < JAIL_FINE) choice = 'roll';
      if (choice !== 'roll') {
        this.say(pid, botById(p.botId).lines.jail, 3000, true);
      } else if (Math.random() < 0.65) {
        const stayLine = AI.generateBotTrashTalk(this.state, p, 'jail_stay');
        if (stayLine) this.say(pid, stayLine, 3200, true);
      }
    } else {
      choice = await this.ask(pid, { type: 'jail' });
    }

    if (choice === 'card' && p.jailCards > 0) {
      this.sfx('sitar');
      this.updatePlayer(pid, (x) => ({ jailCards: x.jailCards - 1, inJail: false, jailTurns: 0 }));
      this.toast({ kind: 'free', title: 'Bail Pass used!', sub: `${p.name} walks out of Tihar`, tone: 'gain' });
      this.log(`📜 **${p.name}** used a Bail Pass and walked out of Tihar.`, { pid, tone: 'gain' });
      await this.wait(600);
      return 'free';
    }
    if (choice === 'pay') {
      const ok = await this.charge(pid, JAIL_FINE, 'kitty', 'Bail');
      if (!ok) return 'done';
      this.updatePlayer(pid, { inJail: false, jailTurns: 0 });
      this.toast({ kind: 'free', title: 'Bail paid', sub: `${p.name} is out`, amount: -JAIL_FINE, tone: 'loss' });
      this.log(`👮 **${p.name}** paid ${rupees(JAIL_FINE)} bail.`, { pid });
      await this.wait(600);
      return 'free';
    }

    const [a, b] = await this.roll(pid);
    await this.wait(500);
    if (a === b) {
      this.sfx('victory');
      this.updatePlayer(pid, { inJail: false, jailTurns: 0 });
      this.toast({ kind: 'free', title: 'Jailbreak!', sub: `${p.name} rolled doubles`, tone: 'gain' });
      this.log(`🔓 **${p.name}** rolled doubles and escaped Tihar!`, { pid, tone: 'gain' });
      await this.moveBy(pid, a + b);
      await this.resolve(pid, a + b);
      return 'done';
    }
    const turns = p.jailTurns + 1;
    if (turns >= 3) {
      this.log(`⚖️ Third failed attempt. **${p.name}** must pay ${rupees(JAIL_FINE)} bail.`, { pid });
      const ok = await this.charge(pid, JAIL_FINE, 'kitty', 'Bail');
      if (!ok) return 'done';
      this.updatePlayer(pid, { inJail: false, jailTurns: 0 });
      await this.moveBy(pid, a + b);
      await this.resolve(pid, a + b);
      return 'done';
    }
    this.updatePlayer(pid, { jailTurns: turns });
    this.toast({ kind: 'jail', title: 'Still inside', sub: `Attempt ${turns} of 3`, tone: 'loss' });
    this.log(`⛓️ No doubles. **${p.name}** stays in Tihar (attempt ${turns}/3).`, { pid });
    await this.wait(700);
    return 'done';
  }

  // ---------- paying & bankruptcy ----------
  async charge(pid, amount, creditor, reason) {
    if (this.player(pid).cash < amount) {
      if (this.player(pid).isAi) {
        this.autoRaise(pid, amount);
      } else {
        while (this.player(pid).cash < amount) {
          const choice = await this.ask(pid, { type: 'debt', amount, creditor, reason });
          if (choice === 'bankrupt') break;
          if (choice === 'auto') {
            this.autoRaise(pid, amount);
            if (this.player(pid).cash < amount) break;
          }
        }
      }
    }
    if (this.player(pid).cash >= amount) {
      this.addCash(pid, -amount);
      if (creditor === 'kitty') this.set((s) => ({ kitty: s.kitty + amount }));
      else if (creditor && creditor !== 'bank') this.addCash(creditor, amount);
      return true;
    }
    await this.goBankrupt(pid, creditor);
    return false;
  }

  autoRaise(pid, amount) {
    for (let guard = 0; guard < 120 && this.player(pid).cash < amount; guard++) {
      const sellable = R.ownedIds(this.state, pid)
        .filter((id) => R.canSell(this.state, pid, id).ok)
        .sort((a, b) => this.state.deeds[b].level - this.state.deeds[a].level);
      if (sellable.length) {
        this.sellBuilding(pid, sellable[0], true);
        continue;
      }
      const mortgageable = R.ownedIds(this.state, pid)
        .filter((id) => R.canMortgage(this.state, pid, id).ok)
        .sort((a, b) => TILES[a].price - TILES[b].price);
      if (mortgageable.length) {
        this.mortgage(pid, mortgageable[0], true);
        continue;
      }
      break;
    }
  }

  async goBankrupt(pid, creditor) {
    const p = this.player(pid);
    const toPlayer = creditor && creditor !== 'bank' && creditor !== 'kitty' ? creditor : null;
    const ids = R.ownedIds(this.state, pid);
    const buildingCash = ids.reduce((sum, id) => sum + this.state.deeds[id].level * (TILES[id].houseCost || 0) / 2, 0);
    const cash = p.cash + buildingCash;
    this.set((s) => ({
      deeds: s.deeds.map((d, i) => {
        if (!ids.includes(i)) return d;
        return toPlayer ? { ...d, owner: toPlayer, level: 0 } : { owner: null, level: 0, mortgaged: false };
      }),
    }));
    if (toPlayer) {
      this.addCash(toPlayer, cash);
      if (p.jailCards) this.updatePlayer(toPlayer, (x) => ({ jailCards: x.jailCards + p.jailCards }));
    }
    this.updatePlayer(pid, { cash: 0, bankrupt: true, inJail: false, jailCards: 0 });
    this.sfx('tension');
    if (p.isAi) this.say(pid, botById(p.botId).lines.bankrupt, 3600);
    const heir = toPlayer ? this.player(toPlayer) : null;
    this.log(`💀 **${p.name}** is DIWALIYA (bankrupt)!${heir ? ` Everything goes to **${heir.name}**.` : ' Properties return to the market!'}`, { pid, tone: 'loss' });
    this.headline(`MARKET SHOCK: ${p.name} declares bankruptcy!${heir ? ` ${heir.name} takes over the empire.` : ''}`);
    await this.moment({ kind: 'bankrupt', pid, to: toPlayer }, 2800);
  }

  async endPhase(pid) {
    const p = this.player(pid);
    if (p.isAi) {
      await this.wait(500);
      // 1. Unmortgage deeds if flush with cash
      AI.planUnmortgage(this.state, p).forEach((id) => this.unmortgage(pid, id, true));

      // 2. Proactively look for a smart trade to complete a Monopoly!
      if (this.state.round > this.lastBotTradeRound) {
        const trade = AI.findBestTrade(this.state, this.player(pid));
        if (trade) {
          this.lastBotTradeRound = this.state.round;
          const partner = this.player(trade.toId);
          if (partner?.isAi) {
            const evalRes = AI.evaluateTrade(this.state, partner, trade);
            if (evalRes.accept) {
              this.say(pid, 'Sauda karte hain! Let’s complete our sets!', 2800);
              await this.wait(700);
              await this.executeTrade(trade, true);
            }
          } else if (partner && !partner.bankrupt) {
            // Propose trade to human player and wait briefly or let them respond
            this.say(pid, `${partner.name}, ek shandaar deal hai tumhare liye!`, 3200);
            this.proposeTrade(trade, true);
            await this.wait(1200);
          }
        }
      }

      // 3. Build houses / Havelis on owned monopolies
      for (const id of AI.planBuilds(this.state, this.player(pid))) {
        await this.build(pid, id, true, true);
        await this.wait(550);
      }
      await this.wait(750);
    } else {
      await this.ask(pid, { type: 'end' });
    }
  }

  // ---------- property management (also called by the UI) ----------
  canManage(pid) {
    const s = this.state;
    const pr = s.prompt;
    if (!this.isControllableByMe(pid)) return false;
    return s.status === 'playing' && !!pr && pr.pid === pid && ['roll', 'end', 'jail', 'debt', 'upgrade', 'takeover'].includes(pr.type);
  }

  async build(pid, id, fromRemote = false, awaitMoment = false) {
    if (this.state.online?.active && !this.state.online?.isHost && !fromRemote) {
      mp.sendPlayerAction({ action: 'build', pid, id });
      return { ok: true };
    }
    const chk = R.canBuild(this.state, pid, id);
    if (!chk.ok) return chk;
    const tile = TILES[id];
    const level = this.state.deeds[id].level + 1;
    this.addCash(pid, -tile.houseCost);
    this.updateDeed(id, { level });
    this.set({ built: { id, n: ++this.seq } });
    this.sfx('build', level);
    const p = this.player(pid);
    const what = ['', 'a Chai Tapri', 'a Highway Dhaba', 'a Swanky Showroom', 'a Mega Mall', 'a ROYAL HAVELI'][level];
    this.log(`🏗️ **${p.name}** built ${what} on ${tile.name}.`, { pid, tone: 'gain' });
    if (level === 5) {
      if (p.isAi) this.say(pid, botById(p.botId).lines.haveli);
      this.headline(`${p.name} unveils a Royal Haveli on ${tile.name}. Neighbours file RTI!`);
      if (awaitMoment) {
        await this.moment({ kind: 'haveli', pid, tileId: id }, 2500);
      } else {
        this.moment({ kind: 'haveli', pid, tileId: id }, 2500).catch(() => {});
      }
    }
    return { ok: true };
  }

  sellBuilding(pid, id, fromRemote = false) {
    if (this.state.online?.active && !this.state.online?.isHost && !fromRemote) {
      mp.sendPlayerAction({ action: 'sellBuilding', pid, id });
      return;
    }
    if (!R.canSell(this.state, pid, id).ok) return;
    const tile = TILES[id];
    const refund = tile.houseCost / 2;
    this.updateDeed(id, { level: this.state.deeds[id].level - 1 });
    this.addCash(pid, refund);
    this.sfx('cash');
    this.log(`🔧 **${this.player(pid).name}** sold a building on ${tile.name} for ${rupees(refund)}.`, { pid });
  }

  mortgage(pid, id, fromRemote = false) {
    if (this.state.online?.active && !this.state.online?.isHost && !fromRemote) {
      mp.sendPlayerAction({ action: 'mortgage', pid, id });
      return;
    }
    if (!R.canMortgage(this.state, pid, id).ok) return;
    const tile = TILES[id];
    this.updateDeed(id, { mortgaged: true });
    this.addCash(pid, tile.mortgage);
    this.sfx('tension');
    this.log(`📜 **${this.player(pid).name}** mortgaged ${tile.name} (girvi) for ${rupees(tile.mortgage)}.`, { pid });
  }

  unmortgage(pid, id, fromRemote = false) {
    if (this.state.online?.active && !this.state.online?.isHost && !fromRemote) {
      mp.sendPlayerAction({ action: 'unmortgage', pid, id });
      return;
    }
    if (!R.canUnmortgage(this.state, pid, id).ok) return;
    const tile = TILES[id];
    const cost = R.unmortgageCost(id);
    this.updateDeed(id, { mortgaged: false });
    this.addCash(pid, -cost);
    this.sfx('cash');
    this.log(`✨ **${this.player(pid).name}** freed ${tile.name} from girvi for ${rupees(cost)}.`, { pid });
  }

  // ---------- Trading (Local + Online Human & AI) ----------
  proposeTrade(trade, fromRemote = false) {
    if (this.state.online?.active && !this.state.online?.isHost && !fromRemote) {
      mp.sendPlayerAction({ action: 'proposeTrade', trade });
      return;
    }
    const partner = this.player(trade.toId);
    if (!partner) return;
    if (partner.isAi) {
      const r = AI.evaluateTrade(this.state, partner, trade);
      if (r.accept) {
        this.say(partner.id, r.line, 3000);
        this.executeTrade(trade);
      } else {
        this.sfx('tension');
        this.say(partner.id, r.line, 3000);
      }
      return r;
    }

    this.sfx('pop');
    this.set({
      pendingTrade: {
        id: ++this.seq,
        ...trade,
      },
    });
    return { pending: true };
  }

  respondTrade(accept, fromRemote = false) {
    if (this.state.online?.active && !this.state.online?.isHost && !fromRemote) {
      mp.sendPlayerAction({ action: 'respondTrade', accept });
      return;
    }
    const trade = this.state.pendingTrade;
    if (!trade) return;
    this.set({ pendingTrade: null });
    if (accept) {
      this.executeTrade(trade);
    } else {
      const partner = this.player(trade.toId);
      this.sfx('tension');
      if (partner) this.say(partner.id, 'Sauda cancel! Not interested.', 2600);
      this.toast({ kind: 'trade', title: 'Deal Rejected', sub: `${partner?.name || 'Player'} declined the offer`, tone: 'loss' });
    }
  }

  async executeTrade(trade, awaitMoment = false) {
    const { fromId, toId, giveCash = 0, giveIds = [], getCash = 0, getIds = [] } = trade;
    const a = this.player(fromId);
    const b = this.player(toId);
    if (!a || !b || a.cash < giveCash || b.cash < getCash) return false;
    if (giveIds.some((id) => this.state.deeds[id].owner !== fromId) || getIds.some((id) => this.state.deeds[id].owner !== toId)) return false;
    this.set((s) => ({
      deeds: s.deeds.map((d, i) => {
        if (giveIds.includes(i)) return { ...d, owner: toId };
        if (getIds.includes(i)) return { ...d, owner: fromId };
        return d;
      }),
    }));
    const net = getCash - giveCash;
    if (net) {
      this.addCash(fromId, net);
      this.addCash(toId, -net);
    }
    this.sfx('coins');
    const parts = [];
    if (giveIds.length || giveCash) parts.push(`${a.name} gives ${[...giveIds.map((id) => TILES[id].short), giveCash ? rupees(giveCash) : null].filter(Boolean).join(' + ')}`);
    if (getIds.length || getCash) parts.push(`${b.name} gives ${[...getIds.map((id) => TILES[id].short), getCash ? rupees(getCash) : null].filter(Boolean).join(' + ')}`);
    this.log(`🤝 Sauda pakka! ${parts.join('; ')}.`, { pid: fromId, tone: 'big' });
    this.toast({ kind: 'trade', title: 'Sauda Pakka!', sub: `${a.name} ⇄ ${b.name}`, tone: 'gain' });

    for (const pid of [fromId, toId]) {
      for (const g of Object.keys(GROUPS)) {
        if ([...giveIds, ...getIds].some((id) => TILES[id].group === g) && R.ownsGroup(this.state, g, pid)) {
          this.sfx('dhol');
          this.log(`👑 **${this.player(pid).name}** now owns the whole ${GROUPS[g].name} set!`, { pid, tone: 'big' });
          if (awaitMoment) {
            await this.moment({ kind: 'monopoly', pid, group: g }, 2500);
          } else {
            this.moment({ kind: 'monopoly', pid, group: g }, 2500).catch(() => {});
          }
        }
      }
    }
    return true;
  }
}

export const game = new Game();

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.cancel());
}

if (import.meta.env.DEV) window.__nonopoly = game;

export function useGame() {
  return useSyncExternalStore(game.subscribe, game.getState);
}

export const tokenOf = (p) => tokenById(p.tokenId);
