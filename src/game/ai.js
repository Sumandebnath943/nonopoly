// Bot brains. Each bot profile (data/characters.js) tunes buffer, risk and auction appetite.

import { TILES, GROUPS, JAIL_FINE } from '../data/board';
import { botById } from '../data/characters';
import { countOwnedInGroup, canBuild, unmortgageCost, ownedIds, isTradeable } from './rules';

const groupKey = (tile) => tile.group || null;

function setContext(state, pid, tile) {
  const g = groupKey(tile);
  if (!g) return { completes: false, blocks: false, size: 1 };
  const size = GROUPS[g].ids.length;
  const mine = countOwnedInGroup(state, g, pid);
  const completes = mine === size - 1;
  const blocks = state.players.some(
    (p) => p.id !== pid && !p.bankrupt && countOwnedInGroup(state, g, p.id) === size - 1,
  );
  return { completes, blocks, size, mine };
}

export function decideBuy(state, player, tileId) {
  const bot = botById(player.botId);
  const tile = TILES[tileId];
  if (player.cash < tile.price) return { buy: false, line: 'Paisa kam pad gaya. Auction it!' };
  const { completes, blocks } = setContext(state, player.id, tile);
  let buffer = bot.buffer;
  if (completes || blocks) buffer *= 0.35;
  if (bot.likes.includes(groupKey(tile))) buffer *= 0.7;
  const after = player.cash - tile.price;
  if (completes || after >= buffer) return { buy: true, line: bot.lines.buy };
  if (after > 30000 && Math.random() < bot.risk) return { buy: true, line: bot.lines.buy };
  return { buy: false, line: bot.lines.pass };
}

export function decideBid(state, player, tileId, high, increment) {
  const bot = botById(player.botId);
  const tile = TILES[tileId];
  const next = high + increment;
  const { completes, blocks } = setContext(state, player.id, tile);
  let mult = bot.auctionMax;
  if (completes) mult += 0.6;
  else if (blocks) mult += 0.3;
  if (bot.likes.includes(groupKey(tile))) mult += 0.1;
  const ceiling = Math.min(player.cash - Math.min(bot.buffer, 60000), Math.floor(tile.price * mult));
  if (next > ceiling) return null;
  // Occasionally jump the bid to keep auctions lively.
  const jump = high > 0 && Math.random() < bot.risk * 0.4 ? increment * 4 : 0;
  return Math.min(ceiling, next + jump);
}

export function decideJail(state, player) {
  const bot = botById(player.botId);
  if (player.jailCards > 0) return 'card';
  // Late game the jail is a safe place to sit while others pay rent; early game get out.
  const ownedCount = state.deeds.filter((d) => d && d.owner).length;
  const lateGame = ownedCount > 20;
  if (player.cash >= JAIL_FINE + bot.buffer * 0.5 && !lateGame) return 'pay';
  return 'roll';
}

// Plan building upgrades (even-build rule respected by re-checking after each step).
export function planBuilds(state, player) {
  const bot = botById(player.botId);
  const reserve = Math.max(60000, bot.buffer * 0.6);
  const plans = [];
  let sim = state;
  let guard = 0;
  while (guard++ < 30) {
    const me = sim.players.find((p) => p.id === player.id);
    const options = ownedIds(sim, player.id)
      .filter((id) => canBuild(sim, player.id, id).ok && me.cash - TILES[id].houseCost >= reserve)
      .sort((a, b) => sim.deeds[a].level - sim.deeds[b].level || TILES[b].price - TILES[a].price);
    if (!options.length) break;
    const id = options[0];
    plans.push(id);
    sim = {
      ...sim,
      players: sim.players.map((p) => (p.id === player.id ? { ...p, cash: p.cash - TILES[id].houseCost } : p)),
      deeds: sim.deeds.map((d, i) => (i === id ? { ...d, level: d.level + 1 } : d)),
    };
  }
  return plans;
}

export function planUnmortgage(state, player) {
  const bot = botById(player.botId);
  return ownedIds(state, player.id)
    .filter((id) => state.deeds[id].mortgaged)
    .filter((id) => player.cash - unmortgageCost(id) > bot.buffer * 1.5);
}

export function evaluateTrade(state, botPlayer, trade) {
  const bot = botById(botPlayer.botId);
  const { giveCash = 0, giveIds = [], getCash = 0, getIds = [] } = trade; // from the proposer's view
  if (getCash > botPlayer.cash) return { accept: false, line: 'I don’t have that much cash lying around!' };
  if ([...giveIds, ...getIds].some((id) => !isTradeable(state, id))) {
    return { accept: false, line: 'Sell the buildings first, then we talk.' };
  }

  const valueOf = (id, receiverId) => {
    const tile = TILES[id];
    let v = state.deeds[id].mortgaged ? tile.price * 0.6 : tile.price;
    if (tile.group) {
      const size = GROUPS[tile.group].ids.length;
      const have = countOwnedInGroup(state, tile.group, receiverId);
      if (have === size - 1) v *= 2.2; // completes a set
      else if (have > 0) v *= 1.25;
    }
    return v;
  };

  let botGets = giveCash;
  giveIds.forEach((id) => { botGets += valueOf(id, botPlayer.id); });
  let botGives = getCash;
  getIds.forEach((id) => {
    const tile = TILES[id];
    let v = valueOf(id, trade.fromId);
    if (tile.group && countOwnedInGroup(state, tile.group, botPlayer.id) === GROUPS[tile.group].ids.length) v *= 1.8;
    botGives += v;
  });

  const margin = 1.15 - bot.risk * 0.25;
  if (botGets >= botGives * margin) return { accept: true, line: 'Deal pakki! Shake hands.' };
  if (botGets >= botGives * 0.85) return { accept: false, line: 'Close... add a little more and it’s done.' };
  return { accept: false, line: 'Are you joking? This deal is all in your favour.' };
}
