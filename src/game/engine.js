// Nonopoly game director.
// Turns run as async scripts (roll → walk → resolve → decide) so animations, bots and
// human prompts happen in a strict order. React reads the state via useGame().

import { useSyncExternalStore } from 'react';
import {
  TILES, GROUPS, START_SALARY, JAIL_FINE, JAIL_TILE, STARTING_KITTY, TRANSPORT_IDS, isOwnable,
} from '../data/board';
import { KISMET, RISHTEDAAR } from '../data/cards';
import { botById, tokenById } from '../data/characters';
import * as R from './rules';
import * as AI from './ai';
import { sounds } from '../utils/sound';
import { rupees } from '../utils/format';

class Cancelled extends Error {}

const SAVE_KEY = 'nonopoly.save.v2';
const SETTINGS_KEY = 'nonopoly.settings.v2';

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
    players: [],
    deeds: blankDeeds(),
    turn: 0,
    round: 1,
    dice: [3, 4],
    rollId: 0,
    rolling: false,
    doubles: 0,
    lastDouble: false,
    kitty: STARTING_KITTY,
    prompt: null,
    thinking: null,
    speech: null,
    moment: null,
    toasts: [],
    card: null,
    auction: null,
    log: [],
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
    this.timers = new Set();
  }

  // ---------- store plumbing ----------
  subscribe = (fn) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getState = () => this.state;

  set(patch) {
    const next = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = { ...this.state, ...next };
    this.listeners.forEach((l) => l());
  }

  player(pid) {
    return this.state.players.find((p) => p.id === pid);
  }

  current() {
    return this.state.players[this.state.turn];
  }

  updatePlayer(pid, patch) {
    this.set((s) => ({
      players: s.players.map((p) => (p.id === pid ? { ...p, ...(typeof patch === 'function' ? patch(p) : patch) } : p)),
    }));
  }

  updateDeed(id, patch) {
    this.set((s) => ({ deeds: s.deeds.map((d, i) => (i === id ? { ...d, ...patch } : d)) }));
  }

  // ---------- timing ----------
  factor() {
    return this.state.settings.speed === 'fast' ? 0.5 : 1;
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

  // ---------- UI feedback ----------
  log(text, opts = {}) {
    const id = ++this.seq;
    this.set((s) => ({ log: [{ id, text, pid: opts.pid ?? null, tone: opts.tone || 'info', round: s.round }, ...s.log].slice(0, 150) }));
  }

  headline(text) {
    this.set({ headline: { id: ++this.seq, text } });
  }

  delta(pid, amount) {
    if (!amount) return;
    const id = ++this.seq;
    this.set((s) => ({ deltas: [...s.deltas, { id, pid, amount }] }));
    this.later(() => this.set((s) => ({ deltas: s.deltas.filter((d) => d.id !== id) })), 1900);
  }

  addCash(pid, amount) {
    this.updatePlayer(pid, (p) => ({ cash: p.cash + amount }));
    this.delta(pid, amount);
  }

  say(pid, text, ms = 2800) {
    if (!text) return;
    const id = ++this.seq;
    this.set({ speech: { id, pid, text } });
    this.later(() => {
      if (this.state.speech?.id === id) this.set({ speech: null });
    }, ms);
  }

  toast(spec, ms = 2400) {
    const id = ++this.seq;
    this.set((s) => ({ toasts: [...s.toasts.slice(-2), { id, ...spec }] }));
    this.later(() => this.set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), ms);
  }

  async moment(spec, ms = 1900) {
    const id = ++this.seq;
    this.set({ moment: { id, ...spec } });
    try {
      await this.wait(ms);
    } finally {
      if (this.state.moment?.id === id) this.set({ moment: null });
    }
  }

  async think(pid, ms = 900) {
    this.set({ thinking: pid });
    await this.wait(ms);
    this.set({ thinking: null });
  }

  // ---------- prompts ----------
  ask(pid, spec) {
    return new Promise((resolve, reject) => {
      const id = ++this.seq;
      this.pending = { id, resolve, reject };
      this.set({ prompt: { id, pid, ...spec }, thinking: null });
    });
  }

  respond(value, promptId) {
    const p = this.pending;
    if (!p || (promptId && promptId !== p.id)) return;
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
    if (this.pending) {
      const p = this.pending;
      this.pending = null;
      p.reject(new Cancelled());
    }
  }

  newGame(config) {
    this.cancel();
    const players = config.players.map((p, i) => ({
      id: `p${i + 1}`,
      seat: i,
      name: p.name.trim() || (p.isAi ? botById(p.botId).name : `Player ${i + 1}`),
      tokenId: p.tokenId,
      color: p.color,
      isAi: p.isAi,
      botId: p.isAi ? p.botId : null,
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
      players.forEach((p, i) => {
        [pool[i * 2], pool[i * 2 + 1]].forEach((id) => {
          if (id !== undefined) deeds[id] = { ...deeds[id], owner: p.id };
        });
      });
    }
    this.state = {
      ...blankState(this.state.settings),
      status: 'playing',
      config,
      players,
      deeds,
    };
    this.listeners.forEach((l) => l());
    this.log(`Game on! ${players.length} tycoons line up at START with ${rupees(config.startCash)} each.`, { tone: 'big' });
    this.headline('Nonopoly season begins! Tycoons gather at Shubh Aarambh.');
    this.run();
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
    try {
      const { status, config, players, deeds, turn, round, kitty, decks, log, dice } = this.state;
      localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 2, status, config, players, deeds, turn, round, kitty, decks, log: log.slice(0, 40), dice, savedAt: Date.now() }));
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
    this.state = { ...blankState(this.state.settings), ...rest, status: 'playing' };
    this.listeners.forEach((l) => l());
    this.log('Welcome back! The game continues.', { tone: 'big' });
    this.run();
    return true;
  }

  quit() {
    this.cancel();
    this.set({ status: 'idle', prompt: null, moment: null, card: null, auction: null, thinking: null, speech: null, toasts: [], moving: null, rolling: false });
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
    do {
      i = (i + 1) % players.length;
      if (i === 0) round++;
    } while (players[i].bankrupt);
    if (round !== this.state.round) this.log(`Round ${round} begins.`, { tone: 'round' });
    this.set({ turn: i, round, doubles: 0, lastDouble: false, landed: null });
  }

  checkEnd() {
    const alive = this.state.players.filter((p) => !p.bankrupt);
    if (alive.length <= 1) {
      this.finish(alive[0]?.id, 'last');
      return true;
    }
    const max = this.state.config.maxRounds;
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
    this.set({ status: 'over', winner: winnerId, winReason: reason, prompt: null, moment: null, thinking: null });
    if (w) {
      this.log(`🏆 **${w.name}** is the Nonopoly champion!`, { pid: w.id, tone: 'big' });
      this.headline(`${w.name} crowned Nonopoly champion! Dhol-nagade, fireworks, mithai for all!`);
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
      if (p.isAi) await this.think(pid, 650);
      else await this.ask(pid, { type: 'roll' });

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
        sounds.dhol();
      }
      await this.moveBy(pid, a + b);
      await this.resolve(pid, a + b);
      p = this.player(pid);
      if (p.bankrupt || p.inJail || !dbl) break;
      this.log(`🎲 Doubles! **${p.name}** rolls again.`, { pid });
      this.toast({ kind: 'double', title: 'Doubles!', sub: `${p.name} rolls again`, tone: 'gain' }, 1800);
    }
    if (!this.player(pid).bankrupt) await this.endPhase(pid);
  }

  async roll(pid) {
    const a = 1 + Math.floor(Math.random() * 6);
    const b = 1 + Math.floor(Math.random() * 6);
    sounds.dice();
    this.set((s) => ({ rolling: true, rollId: s.rollId + 1, dice: [a, b], lastDouble: a === b, landed: null }));
    await this.wait(1000);
    this.set({ rolling: false });
    const p = this.player(pid);
    this.log(`🎲 **${p.name}** rolled ${a} + ${b} = ${a + b}${a === b ? ' (doubles!)' : ''}`, { pid });
    return [a, b];
  }

  async moveBy(pid, steps) {
    const dir = Math.sign(steps);
    const n = Math.abs(steps);
    this.set({ moving: pid });
    for (let i = 0; i < n; i++) {
      const p = this.player(pid);
      const pos = (p.pos + dir + 40) % 40;
      this.updatePlayer(pid, { pos });
      sounds.hop();
      if (pos === 0 && dir > 0) this.passStart(pid);
      await this.wait(i === n - 1 ? 300 : 190);
    }
    this.set({ moving: null });
  }

  async walkTo(pid, target) {
    const steps = (target - this.player(pid).pos + 40) % 40;
    if (steps) await this.moveBy(pid, steps);
  }

  passStart(pid) {
    const p = this.player(pid);
    this.addCash(pid, START_SALARY);
    sounds.sitar();
    this.toast({ kind: 'shagun', title: 'Shagun!', sub: `${p.name} completed a lap`, amount: START_SALARY, tone: 'gain', pid });
    this.log(`🪔 **${p.name}** crossed START and got ${rupees(START_SALARY)} Shagun.`, { pid, tone: 'gain' });
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
        sounds.victory();
        this.set({ kitty: 0 });
        await this.moment({ kind: 'jackpot', pid, amount: k }, 2400);
        this.addCash(pid, k);
        this.log(`☕ JACKPOT! **${p.name}** broke the Jugaad Gullak open for ${rupees(k)}!`, { pid, tone: 'gain' });
        this.headline(`${p.name} hits the Jugaad Junction jackpot: ${rupees(k)}!`);
      } else {
        this.toast({ kind: 'chai', title: 'Chai break', sub: 'The Gullak is empty', tone: 'info' });
        this.log(`☕ **${p.name}** sips cutting chai. The Gullak is empty.`, { pid });
      }
    } else if (tile.corner === 'jail') {
      this.log(`👋 **${p.name}** is just visiting Tihar.`, { pid });
    }
  }

  async resolveTax(pid, tile) {
    const p = this.player(pid);
    sounds.tension();
    this.toast({ kind: 'tax', title: tile.short, sub: `${p.name} pays up`, amount: -tile.amount, tone: 'loss', pid });
    this.log(`🧾 **${p.name}** paid ${rupees(tile.amount)} for ${tile.name}. It went into the Gullak.`, { pid, tone: 'loss' });
    await this.wait(500);
    await this.charge(pid, tile.amount, 'kitty', tile.name);
  }

  async resolveOwnable(pid, tile, roll, opts) {
    const deed = this.state.deeds[tile.id];
    const p = this.player(pid);
    if (!deed.owner) return this.offer(pid, tile.id);
    if (deed.owner === pid) {
      this.log(`🏠 **${p.name}** visits their own ${tile.name}.`, { pid });
      return;
    }
    const owner = this.player(deed.owner);
    if (deed.mortgaged) {
      this.toast({ kind: 'info', title: 'Girvi!', sub: `${tile.short} is mortgaged, so no rent`, tone: 'info' });
      this.log(`📜 ${tile.name} is mortgaged, so **${p.name}** pays nothing.`, { pid });
      return;
    }
    let rent = R.rentFor(this.state, tile.id, roll);
    if (opts.doubleRent) rent *= 2;
    sounds.cash();
    if (rent >= 300000) {
      await this.moment({ kind: 'bigrent', pid, to: owner.id, amount: rent, tileId: tile.id }, 2000);
    } else {
      this.toast({ kind: 'rent', title: 'Kiraya!', sub: `${p.name} → ${owner.name}`, amount: -rent, tone: 'loss', pid, to: owner.id });
    }
    if (p.isAi && Math.random() < 0.5) this.say(pid, botById(p.botId).lines.pay);
    else if (owner.isAi) this.say(owner.id, botById(owner.botId).lines.collect);
    this.log(`💸 **${p.name}** paid ${rupees(rent)} rent to **${owner.name}** for ${tile.name}.`, { pid, tone: 'loss' });
    await this.wait(500);
    await this.charge(pid, rent, owner.id, `Rent for ${tile.name}`);
  }

  async offer(pid, id) {
    const tile = TILES[id];
    const p = this.player(pid);
    let choice;
    if (p.isAi) {
      await this.think(pid, 1000);
      const d = AI.decideBuy(this.state, p, id);
      choice = d.buy ? 'buy' : 'auction';
      this.say(pid, d.line);
    } else {
      choice = await this.ask(pid, { type: 'buy', tileId: id });
    }
    if (choice === 'buy' && this.player(pid).cash >= tile.price) await this.purchase(pid, id, tile.price);
    else await this.auction(id, pid);
  }

  async purchase(pid, id, price, viaAuction = false) {
    const tile = TILES[id];
    const p = this.player(pid);
    this.addCash(pid, -price);
    this.updateDeed(id, { owner: pid });
    sounds.stamp();
    this.log(`🏷️ **${p.name}** ${viaAuction ? 'won the auction for' : 'bought'} ${tile.name} for ${rupees(price)}.`, { pid, tone: 'gain' });
    this.headline(`${p.name} snaps up ${tile.name} (${tile.city}) for ${rupees(price)}!`);
    await this.moment({ kind: 'sold', pid, tileId: id, amount: price, auction: viaAuction }, 1800);
    const g = tile.group;
    if (g && R.ownsGroup(this.state, g, pid)) {
      sounds.dhol();
      this.log(`👑 **${p.name}** owns the whole ${GROUPS[g].name} set!${tile.type === 'property' ? ' Rents double and building is unlocked.' : ''}`, { pid, tone: 'big' });
      this.headline(`MONOPOLY ALERT: ${p.name} controls all of ${GROUPS[g].name}!`);
      await this.moment({ kind: 'monopoly', pid, group: g }, 2400);
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
    sounds.dhol();
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
        await this.think(bidderId, 700);
        action = AI.decideBid(this.state, b, id, high, inc) ?? 'pass';
      } else {
        action = await this.ask(bidderId, { type: 'bid', tileId: id, high, min, inc });
      }
      if (action === 'pass') {
        passed.add(bidderId);
      } else {
        high = Math.max(min, Math.min(Number(action) || min, b.cash));
        leader = bidderId;
        sounds.bid();
        if (b.isAi && Math.random() < 0.3) this.say(bidderId, botById(b.botId).lines.bid, 1800);
      }
      this.set((s) => ({
        auction: { ...s.auction, high, leaderId: leader, passed: [...passed], bidderId: null, last: { pid: bidderId, pass: action === 'pass', amount: high } },
      }));
    }

    this.set((s) => ({ auction: { ...s.auction, done: true, bidderId: null } }));
    await this.wait(1100);
    this.set({ auction: null });
    if (leader) await this.purchase(leader, id, high, true);
    else this.log(`🔨 No bids. ${tile.name} stays with the sarkar.`);
  }

  // ---------- cards ----------
  async drawCard(pid, deck) {
    let pile = this.state.decks[deck];
    const cards = deck === 'kismet' ? KISMET : RISHTEDAAR;
    if (!pile.length) pile = freshDeck(cards);
    const [idx, ...rest] = pile;
    const card = cards[idx];
    sounds.whoosh();
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
        sounds.cash();
        this.addCash(pid, a.amount);
        this.log(`💰 **${p.name}** collected ${rupees(a.amount)}.`, { pid, tone: 'gain' });
        break;
      case 'pay':
        await this.charge(pid, a.amount, 'bank', card.title);
        break;
      case 'kitty':
        await this.charge(pid, a.amount, 'kitty', card.title);
        break;
      case 'collectAll':
        sounds.coins();
        for (const o of others()) await this.charge(o.id, a.amount, pid, card.title);
        break;
      case 'payAll':
        for (const o of others()) {
          if (this.player(pid).bankrupt) break;
          await this.charge(pid, a.amount, o.id, card.title);
        }
        break;
      case 'bail':
        sounds.sitar();
        this.updatePlayer(pid, (x) => ({ jailCards: x.jailCards + 1 }));
        this.log(`📜 **${p.name}** pockets a Bail Pass.`, { pid, tone: 'gain' });
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
        else this.log(`😌 **${p.name}** has no buildings, so there's nothing to repair.`, { pid });
        break;
      }
      default:
        break;
    }
  }

  // ---------- jail ----------
  async sendToJail(pid, reason) {
    const p = this.player(pid);
    sounds.siren();
    this.set({ doubles: 0, lastDouble: false });
    await this.moment({ kind: 'raid', pid, reason }, 2300);
    this.updatePlayer(pid, { pos: JAIL_TILE, inJail: true, jailTurns: 0 });
    this.set({ landed: JAIL_TILE });
    this.headline(`BREAKING: ${p.name} sent to Tihar Jail! Sources say the false ceiling was "very full".`);
    await this.wait(700);
  }

  async jailTurn(pid) {
    const p = this.player(pid);
    let choice;
    if (p.isAi) {
      await this.think(pid, 800);
      choice = AI.decideJail(this.state, p);
      if (choice === 'pay' && p.cash < JAIL_FINE) choice = 'roll';
      if (choice !== 'roll') this.say(pid, botById(p.botId).lines.jail);
    } else {
      choice = await this.ask(pid, { type: 'jail' });
    }

    if (choice === 'card' && p.jailCards > 0) {
      sounds.sitar();
      this.updatePlayer(pid, (x) => ({ jailCards: x.jailCards - 1, inJail: false, jailTurns: 0 }));
      this.toast({ kind: 'free', title: 'Bail Pass used!', sub: `${p.name} walks out of Tihar`, tone: 'gain' });
      this.log(`📜 **${p.name}** used a Bail Pass and walked out of Tihar.`, { pid, tone: 'gain' });
      return 'free';
    }
    if (choice === 'pay') {
      const ok = await this.charge(pid, JAIL_FINE, 'kitty', 'Bail');
      if (!ok) return 'done';
      this.updatePlayer(pid, { inJail: false, jailTurns: 0 });
      this.toast({ kind: 'free', title: 'Bail paid', sub: `${p.name} is out`, amount: -JAIL_FINE, tone: 'loss' });
      this.log(`👮 **${p.name}** paid ${rupees(JAIL_FINE)} bail.`, { pid });
      return 'free';
    }

    const [a, b] = await this.roll(pid);
    if (a === b) {
      sounds.victory();
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
        this.sellBuilding(pid, sellable[0]);
        continue;
      }
      const mortgageable = R.ownedIds(this.state, pid)
        .filter((id) => R.canMortgage(this.state, pid, id).ok)
        .sort((a, b) => TILES[a].price - TILES[b].price);
      if (mortgageable.length) {
        this.mortgage(pid, mortgageable[0]);
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
    sounds.tension();
    if (p.isAi) this.say(pid, botById(p.botId).lines.bankrupt, 3200);
    const heir = toPlayer ? this.player(toPlayer) : null;
    this.log(`💀 **${p.name}** is DIWALIYA (bankrupt)!${heir ? ` Everything goes to **${heir.name}**.` : ' The bank takes back the properties.'}`, { pid, tone: 'loss' });
    this.headline(`MARKET SHOCK: ${p.name} declares bankruptcy!${heir ? ` ${heir.name} takes over the empire.` : ''}`);
    await this.moment({ kind: 'bankrupt', pid, to: toPlayer }, 2600);
  }

  async endPhase(pid) {
    const p = this.player(pid);
    if (p.isAi) {
      await this.wait(350);
      AI.planUnmortgage(this.state, p).forEach((id) => this.unmortgage(pid, id));
      for (const id of AI.planBuilds(this.state, this.player(pid))) {
        this.build(pid, id);
        await this.wait(420);
      }
      await this.wait(450);
    } else {
      await this.ask(pid, { type: 'end' });
    }
  }

  // ---------- property management (also called by the UI) ----------
  canManage(pid) {
    const s = this.state;
    const pr = s.prompt;
    return s.status === 'playing' && !!pr && pr.pid === pid && ['roll', 'end', 'jail', 'debt'].includes(pr.type);
  }

  build(pid, id) {
    const chk = R.canBuild(this.state, pid, id);
    if (!chk.ok) return chk;
    const tile = TILES[id];
    const level = this.state.deeds[id].level + 1;
    this.addCash(pid, -tile.houseCost);
    this.updateDeed(id, { level });
    this.set({ built: { id, n: ++this.seq } });
    sounds.build();
    const p = this.player(pid);
    const what = ['', 'a Chai Tapri', 'a Highway Dhaba', 'a Swanky Showroom', 'a Mega Mall', 'a ROYAL HAVELI'][level];
    this.log(`🏗️ **${p.name}** built ${what} on ${tile.name}.`, { pid, tone: 'gain' });
    if (level === 5) {
      this.toast({ kind: 'haveli', title: 'Royal Haveli!', sub: `${tile.short} is fit for a Maharaja`, tone: 'gain' });
      this.headline(`${p.name} unveils a Royal Haveli on ${tile.name}. Neighbours file RTI.`);
    }
    return { ok: true };
  }

  sellBuilding(pid, id) {
    if (!R.canSell(this.state, pid, id).ok) return;
    const tile = TILES[id];
    const refund = tile.houseCost / 2;
    this.updateDeed(id, { level: this.state.deeds[id].level - 1 });
    this.addCash(pid, refund);
    this.log(`🔧 **${this.player(pid).name}** sold a building on ${tile.name} for ${rupees(refund)}.`, { pid });
  }

  mortgage(pid, id) {
    if (!R.canMortgage(this.state, pid, id).ok) return;
    const tile = TILES[id];
    this.updateDeed(id, { mortgaged: true });
    this.addCash(pid, tile.mortgage);
    sounds.tension();
    this.log(`📜 **${this.player(pid).name}** mortgaged ${tile.name} (girvi) for ${rupees(tile.mortgage)}.`, { pid });
  }

  unmortgage(pid, id) {
    if (!R.canUnmortgage(this.state, pid, id).ok) return;
    const tile = TILES[id];
    const cost = R.unmortgageCost(id);
    this.updateDeed(id, { mortgaged: false });
    this.addCash(pid, -cost);
    sounds.cash();
    this.log(`✨ **${this.player(pid).name}** freed ${tile.name} from girvi for ${rupees(cost)}.`, { pid });
  }

  // trade = { fromId, toId, giveCash, giveIds, getCash, getIds } (from the proposer's view)
  executeTrade(trade) {
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
    sounds.coins();
    const parts = [];
    if (giveIds.length || giveCash) parts.push(`${a.name} gives ${[...giveIds.map((id) => TILES[id].short), giveCash ? rupees(giveCash) : null].filter(Boolean).join(' + ')}`);
    if (getIds.length || getCash) parts.push(`${b.name} gives ${[...getIds.map((id) => TILES[id].short), getCash ? rupees(getCash) : null].filter(Boolean).join(' + ')}`);
    this.log(`🤝 Sauda pakka! ${parts.join('; ')}.`, { pid: fromId, tone: 'big' });
    this.toast({ kind: 'trade', title: 'Sauda Pakka!', sub: `${a.name} ⇄ ${b.name}`, tone: 'gain' });
    [fromId, toId].forEach((pid) => {
      Object.keys(GROUPS).forEach((g) => {
        if ([...giveIds, ...getIds].some((id) => TILES[id].group === g) && R.ownsGroup(this.state, g, pid)) {
          this.log(`👑 **${this.player(pid).name}** now owns the whole ${GROUPS[g].name} set!`, { pid, tone: 'big' });
        }
      });
    });
    return true;
  }
}

export const game = new Game();

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.cancel());
}

// Dev-only handle for poking at game state from the browser console.
if (import.meta.env.DEV) window.__nonopoly = game;

export function useGame() {
  return useSyncExternalStore(game.subscribe, game.getState);
}

export const tokenOf = (p) => tokenById(p.tokenId);
