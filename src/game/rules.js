// Pure rule helpers for Nonopoly.
// `state.deeds[id]` = { owner, level, mortgaged } for ownable tiles, null otherwise.

import { TILES, GROUPS, TRANSPORT_IDS, UTILITY_IDS, isOwnable } from '../data/board';

export const UNMORTGAGE_RATE = 1.1;

export const deedOf = (state, id) => state.deeds[id];
export const ownerOf = (state, id) => state.deeds[id]?.owner ?? null;

export function ownedIds(state, pid) {
  return TILES.filter((t) => isOwnable(t) && state.deeds[t.id]?.owner === pid).map((t) => t.id);
}

export function unownedPropertyCount(state) {
  return TILES.filter((t) => isOwnable(t) && !state.deeds[t.id]?.owner).length;
}

export function countOwnedInGroup(state, group, pid) {
  if (!group || !GROUPS[group]) return 0;
  return GROUPS[group].ids.filter((id) => state.deeds[id]?.owner === pid).length;
}

export function ownsGroup(state, group, pid) {
  return !!group && !!GROUPS[group] && GROUPS[group].ids.every((id) => state.deeds[id]?.owner === pid);
}

export function groupHasBuildings(state, group) {
  if (!group || !GROUPS[group]) return false;
  return GROUPS[group].ids.some((id) => (state.deeds[id]?.level || 0) > 0);
}

export function rentFor(state, id, diceTotal = 7) {
  const tile = TILES[id];
  const deed = state.deeds[id];
  if (!deed || !deed.owner || deed.mortgaged) return 0;
  let base = 0;
  if (tile.type === 'transport') {
    const n = TRANSPORT_IDS.filter((t) => state.deeds[t]?.owner === deed.owner).length;
    base = 25000 * 2 ** Math.max(0, n - 1);
  } else if (tile.type === 'utility') {
    const n = UTILITY_IDS.filter((t) => state.deeds[t]?.owner === deed.owner).length;
    base = diceTotal * (n === 2 ? 10000 : 4000);
  } else if (deed.level > 0) {
    base = tile.rent[deed.level];
  } else {
    base = ownsGroup(state, tile.group, deed.owner) ? tile.rent[0] * 2 : tile.rent[0];
  }
  // Bazaar Utsav (Boom City) 1.5x multiplier (or 2x during late-game Bull Run!)
  if (state.boomGroup && tile.group === state.boomGroup) {
    const mult = state.bullRun ? 1.75 : 1.5;
    base = Math.round((base * mult) / 1000) * 1000;
  }
  return base;
}

export function canBuild(state, pid, id) {
  const tile = TILES[id];
  const deed = state.deeds[id];
  const player = state.players.find((p) => p.id === pid);
  if (!player || !deed || tile.type !== 'property' || deed.owner !== pid) {
    return { ok: false, reason: 'Not yours' };
  }
  if (!ownsGroup(state, tile.group, pid)) {
    return { ok: false, reason: 'Own the full colour set (or land here to build a Tapri/Dhaba)' };
  }
  const group = GROUPS[tile.group].ids.map((g) => state.deeds[g]);
  if (group.some((d) => d.mortgaged)) return { ok: false, reason: 'Redeem mortgaged plots in this set first' };
  if (deed.level >= 5) return { ok: false, reason: 'Already a Royal Haveli' };
  const min = Math.min(...group.map((d) => d.level));
  if (deed.level > min) return { ok: false, reason: 'Build evenly across the colour set' };
  if (player.cash < tile.houseCost) return { ok: false, reason: 'Not enough cash' };
  return { ok: true };
}

// Desi Jugaad Spot Upgrade: When landing directly on your own property, you can upgrade it
// up to Level 2 (Highway Dhaba) even before completing the full colour set!
export function canSpotUpgrade(state, pid, id) {
  const tile = TILES[id];
  const deed = state.deeds[id];
  const player = state.players.find((p) => p.id === pid);
  if (!player || !deed || tile.type !== 'property' || deed.owner !== pid || deed.mortgaged) {
    return { ok: false };
  }
  const fullSet = ownsGroup(state, tile.group, pid);
  const maxAllowed = fullSet ? 5 : 2;
  if (deed.level >= maxAllowed) return { ok: false };
  if (player.cash < tile.houseCost) return { ok: false, reason: 'Not enough cash' };
  return { ok: true, cost: tile.houseCost, nextLevel: deed.level + 1, fullSet };
}

// Hostile Takeover (Kabza Buyout): Prevents mid/late-game stagnation when properties are split!
// Allowed when:
// - Either the player owns the other properties in this colour group (completes their monopoly!),
// - OR the market is mature: Round >= 5, or 4 or fewer ownable plots remain unowned.
// Cannot takeover a property if the current owner already owns the FULL colour group or has built a Showroom/Mall/Haveli (level >= 3).
export function takeoverCost(state, pid, id) {
  const tile = TILES[id];
  const deed = state.deeds[id];
  if (!tile || !deed || ! isOwnable(tile)) return 0;
  const g = tile.group;
  const size = g ? GROUPS[g].ids.length : 1;
  const myCount = g ? countOwnedInGroup(state, g, pid) : 0;
  const completesMine = g && size > 1 && myCount === size - 1;
  const mult = completesMine ? 1.8 : 2.0;
  const bldValue = (deed.level || 0) * (tile.houseCost || 0);
  return Math.round((tile.price * mult + bldValue) / 5000) * 5000;
}

export function canTakeover(state, pid, id) {
  const tile = TILES[id];
  const deed = state.deeds[id];
  const player = state.players.find((p) => p.id === pid);
  if (!player || !deed || !deed.owner || deed.owner === pid || tile.type !== 'property') {
    return { ok: false };
  }
  // Protected if owner holds the complete colour group or built level >= 3
  if (ownsGroup(state, tile.group, deed.owner) || (deed.level || 0) >= 3) {
    return { ok: false, reason: 'Protected monopoly / fortress' };
  }
  const size = GROUPS[tile.group].ids.length;
  const myCount = countOwnedInGroup(state, tile.group, pid);
  const completesMine = myCount === size - 1;
  const marketOpen = state.round >= 5 || unownedPropertyCount(state) <= 4;
  if (!completesMine && !marketOpen) {
    return { ok: false, reason: 'Hostile takeovers unlock in Round 5 or when completing a set' };
  }
  const cost = takeoverCost(state, pid, id);
  if (player.cash < cost) {
    return { ok: false, cost, completesMine, reason: 'Not enough cash for takeover' };
  }
  return { ok: true, cost, completesMine };
}

export function canSell(state, pid, id) {
  const tile = TILES[id];
  const deed = state.deeds[id];
  if (!deed || tile.type !== 'property' || deed.owner !== pid || deed.level === 0) return { ok: false };
  if (ownsGroup(state, tile.group, pid)) {
    const max = Math.max(...GROUPS[tile.group].ids.map((g) => state.deeds[g].level));
    if (deed.level < max) return { ok: false, reason: 'Sell evenly across the set' };
  }
  return { ok: true };
}

export function canMortgage(state, pid, id) {
  const tile = TILES[id];
  const deed = state.deeds[id];
  if (!deed || deed.owner !== pid || deed.mortgaged) return { ok: false };
  if ((deed.level || 0) > 0) {
    return { ok: false, reason: 'Sell buildings on this plot first' };
  }
  if (tile.group && tile.type === 'property' && ownsGroup(state, tile.group, pid) && groupHasBuildings(state, tile.group)) {
    return { ok: false, reason: 'Sell buildings in this set first' };
  }
  return { ok: true };
}

export const unmortgageCost = (id) => Math.ceil((TILES[id].mortgage * UNMORTGAGE_RATE) / 1000) * 1000;

export function canUnmortgage(state, pid, id) {
  const deed = state.deeds[id];
  const player = state.players.find((p) => p.id === pid);
  if (!player || !deed || deed.owner !== pid || !deed.mortgaged) return { ok: false };
  if (player.cash < unmortgageCost(id)) return { ok: false, reason: 'Not enough cash' };
  return { ok: true };
}

export function netWorth(state, pid) {
  const p = state.players.find((x) => x.id === pid);
  if (!p) return 0;
  let total = p.cash;
  ownedIds(state, pid).forEach((id) => {
    const tile = TILES[id];
    const d = state.deeds[id];
    total += d.mortgaged ? tile.mortgage : tile.price;
    total += (d.level || 0) * (tile.houseCost || 0);
  });
  return total;
}

export function wealthBreakdown(state, pid) {
  const p = state.players.find((x) => x.id === pid);
  if (!p) return { cash: 0, land: 0, buildings: 0, total: 0 };
  let land = 0;
  let buildings = 0;
  ownedIds(state, pid).forEach((id) => {
    const tile = TILES[id];
    const d = state.deeds[id];
    land += d.mortgaged ? tile.mortgage : tile.price;
    buildings += (d.level || 0) * (tile.houseCost || 0);
  });
  return { cash: p.cash, land, buildings, total: p.cash + land + buildings };
}

// Cash that could be raised by selling every building and mortgaging everything.
export function liquidationValue(state, pid) {
  let total = 0;
  ownedIds(state, pid).forEach((id) => {
    const tile = TILES[id];
    const d = state.deeds[id];
    total += (d.level || 0) * ((tile.houseCost || 0) / 2);
    if (!d.mortgaged) total += tile.mortgage;
  });
  return total;
}

export function isTradeable(state, id) {
  const tile = TILES[id];
  const deed = state.deeds[id];
  if (!deed || (deed.level || 0) > 0) return false;
  if (tile.type !== 'property') return true;
  return !groupHasBuildings(state, tile.group);
}
