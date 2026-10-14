// Pure rule helpers. `state.deeds[id]` = { owner, level, mortgaged } for ownable tiles, null otherwise.

import { TILES, GROUPS, TRANSPORT_IDS, UTILITY_IDS, isOwnable } from '../data/board';

export const UNMORTGAGE_RATE = 1.1;

export const deedOf = (state, id) => state.deeds[id];
export const ownerOf = (state, id) => state.deeds[id]?.owner ?? null;

export function ownedIds(state, pid) {
  return TILES.filter((t) => isOwnable(t) && state.deeds[t.id]?.owner === pid).map((t) => t.id);
}

export function countOwnedInGroup(state, group, pid) {
  return GROUPS[group].ids.filter((id) => state.deeds[id]?.owner === pid).length;
}

export function ownsGroup(state, group, pid) {
  return !!group && GROUPS[group].ids.every((id) => state.deeds[id]?.owner === pid);
}

export function groupHasBuildings(state, group) {
  return GROUPS[group].ids.some((id) => (state.deeds[id]?.level || 0) > 0);
}

export function rentFor(state, id, diceTotal = 7) {
  const tile = TILES[id];
  const deed = state.deeds[id];
  if (!deed || !deed.owner || deed.mortgaged) return 0;
  if (tile.type === 'transport') {
    const n = TRANSPORT_IDS.filter((t) => state.deeds[t].owner === deed.owner).length;
    return 25000 * 2 ** (n - 1);
  }
  if (tile.type === 'utility') {
    const n = UTILITY_IDS.filter((t) => state.deeds[t].owner === deed.owner).length;
    return diceTotal * (n === 2 ? 10000 : 4000);
  }
  if (deed.level > 0) return tile.rent[deed.level];
  return ownsGroup(state, tile.group, deed.owner) ? tile.rent[0] * 2 : tile.rent[0];
}

export function canBuild(state, pid, id) {
  const tile = TILES[id];
  const deed = state.deeds[id];
  const player = state.players.find((p) => p.id === pid);
  if (!deed || tile.type !== 'property' || deed.owner !== pid) return { ok: false, reason: 'Not yours' };
  if (!ownsGroup(state, tile.group, pid)) return { ok: false, reason: 'Own the full colour set first' };
  const group = GROUPS[tile.group].ids.map((g) => state.deeds[g]);
  if (group.some((d) => d.mortgaged)) return { ok: false, reason: 'Redeem the set first' };
  if (deed.level >= 5) return { ok: false, reason: 'Already a Haveli' };
  const min = Math.min(...group.map((d) => d.level));
  if (deed.level > min) return { ok: false, reason: 'Build evenly across the set' };
  if (player.cash < tile.houseCost) return { ok: false, reason: 'Not enough cash' };
  return { ok: true };
}

export function canSell(state, pid, id) {
  const tile = TILES[id];
  const deed = state.deeds[id];
  if (!deed || tile.type !== 'property' || deed.owner !== pid || deed.level === 0) return { ok: false };
  const max = Math.max(...GROUPS[tile.group].ids.map((g) => state.deeds[g].level));
  if (deed.level < max) return { ok: false, reason: 'Sell evenly across the set' };
  return { ok: true };
}

export function canMortgage(state, pid, id) {
  const tile = TILES[id];
  const deed = state.deeds[id];
  if (!deed || deed.owner !== pid || deed.mortgaged) return { ok: false };
  if (tile.group && tile.type === 'property' && groupHasBuildings(state, tile.group)) {
    return { ok: false, reason: 'Sell buildings in this set first' };
  }
  return { ok: true };
}

export const unmortgageCost = (id) => Math.ceil((TILES[id].mortgage * UNMORTGAGE_RATE) / 1000) * 1000;

export function canUnmortgage(state, pid, id) {
  const deed = state.deeds[id];
  const player = state.players.find((p) => p.id === pid);
  if (!deed || deed.owner !== pid || !deed.mortgaged) return { ok: false };
  if (player.cash < unmortgageCost(id)) return { ok: false, reason: 'Not enough cash' };
  return { ok: true };
}

export function netWorth(state, pid) {
  const p = state.players.find((x) => x.id === pid);
  let total = p.cash;
  ownedIds(state, pid).forEach((id) => {
    const tile = TILES[id];
    const d = state.deeds[id];
    total += d.mortgaged ? tile.mortgage : tile.price;
    total += (d.level || 0) * (tile.houseCost || 0);
  });
  return total;
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
  if (tile.type !== 'property') return true;
  return !groupHasBuildings(state, tile.group);
}
