// Bot brains. Each bot profile (data/characters.js) tunes buffer, risk, auction appetite,
// spot upgrades, and proactive trade generation.

import { TILES, GROUPS, JAIL_FINE } from '../data/board';
import { botById } from '../data/characters';
import { rupeesShort } from '../utils/format';
import {
  countOwnedInGroup,
  canBuild,
  canSpotUpgrade,
  unmortgageCost,
  ownedIds,
  ownsGroup,
  netWorth,
  isTradeable,
} from './rules';

const groupKey = (tile) => tile.group || null;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function setContext(state, pid, tile) {
  const g = groupKey(tile);
  if (!g) return { completes: false, blocks: false, blockedPlayer: null, size: 1 };
  const size = GROUPS[g].ids.length;
  const mine = countOwnedInGroup(state, g, pid);
  const completes = mine === size - 1;
  const blockedPlayer = state.players.find(
    (p) => p.id !== pid && !p.bankrupt && countOwnedInGroup(state, g, p.id) === size - 1,
  ) || null;
  const blocks = !!blockedPlayer;
  return { completes, blocks, blockedPlayer, size, mine };
}

export function decideBuy(state, player, tileId) {
  const bot = botById(player.botId);
  const tile = TILES[tileId];
  if (player.cash < tile.price) {
    return {
      buy: false,
      line: `Jeb mein abhi ${rupeesShort(player.cash)} hi hai—chalo ${tile.short} ki Neelaami karte hain!`,
    };
  }
  const { completes, blocks, blockedPlayer } = setContext(state, player.id, tile);
  let buffer = bot.buffer;
  if (completes || blocks) buffer *= 0.25;
  if (bot.likes.includes(groupKey(tile))) buffer *= 0.65;
  const after = player.cash - tile.price;
  const shouldBuy = completes || after >= buffer || (after > 25000 && Math.random() < bot.risk);

  if (shouldBuy) {
    if (blocks && blockedPlayer) {
      const gName = tile.group ? GROUPS[tile.group]?.name : tile.short;
      const blockLines = {
        gupta: `Arre ${blockedPlayer.name} ji, ${gName} poora karne ka irada tha kya? Ab ${tile.short} Gupta Ji ke naam!`,
        bunty: `Sorry ${blockedPlayer.name} bro, just cockblocked your ${gName} monopoly! Strategic moat!`,
        tauji: `Kyun ${blockedPlayer.name}, ${gName} pe kabza karne ka sapna tha? ${tile.short} pe Tauji ka khunta gad gaya!`,
        aunty: `Haye ${blockedPlayer.name} beta, bura mat maanna—${tile.short} toh Pammi Aunty hi lengi!`,
        chintu: `Prank ho gaya ${blockedPlayer.name} ke saath! Snatched ${tile.short} right before their monopoly! 😂`,
        simran: `Sorry ${blockedPlayer.name}, I can’t let you complete ${gName}. Acquiring ${tile.short} as a defensive block.`,
      };
      return { buy: true, line: blockLines[player.botId] || bot.lines.buy };
    }
    return { buy: true, line: bot.lines.buy };
  }
  return { buy: false, line: bot.lines.pass };
}

export function decideBid(state, player, tileId, high, increment) {
  const bot = botById(player.botId);
  const tile = TILES[tileId];
  const next = high + increment;
  const { completes, blocks } = setContext(state, player.id, tile);
  let mult = bot.auctionMax;
  if (completes) mult += 0.65;
  else if (blocks) mult += 0.35;
  if (bot.likes.includes(groupKey(tile))) mult += 0.12;
  const ceiling = Math.min(player.cash - Math.min(bot.buffer, 50000), Math.floor(tile.price * mult));
  if (next > ceiling) return null;
  const jump = high > 0 && Math.random() < bot.risk * 0.4 ? increment * 3 : 0;
  return Math.min(ceiling, next + jump);
}

export function decideJail(state, player) {
  const bot = botById(player.botId);
  if (player.jailCards > 0) return 'card';
  const ownedCount = state.deeds.filter((d) => d && d.owner).length;
  const lateGame = ownedCount > 22;
  if (player.cash >= JAIL_FINE + bot.buffer * 0.5 && !lateGame) return 'pay';
  return 'roll';
}

export function decideSpotUpgrade(state, player, tileId) {
  const chk = canSpotUpgrade(state, player.id, tileId);
  if (!chk.ok) return false;
  const bot = botById(player.botId);
  const reserve = Math.max(50000, bot.buffer * 0.5);
  return player.cash - chk.cost >= reserve;
}

// Plan building upgrades (even-build rule respected by re-checking after each step).
export function planBuilds(state, player) {
  const bot = botById(player.botId);
  const reserve = Math.max(55000, bot.buffer * 0.55);
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
    .filter((id) => player.cash - unmortgageCost(id) > bot.buffer * 1.4);
}

// Proactive AI trade generator: Finds a trade that completes a colour group for `botPlayer`
// (either swapping a single property that helps the partner, or offering a generous cash buyout).
export function findBestTrade(state, botPlayer) {
  const bot = botById(botPlayer.botId);
  const myTradeable = ownedIds(state, botPlayer.id).filter((id) => isTradeable(state, id));

  const colorGroups = ['brown', 'sky', 'pink', 'orange', 'red', 'yellow', 'green', 'blue'];
  for (const g of colorGroups) {
    const ids = GROUPS[g].ids;
    const mine = ids.filter((id) => state.deeds[id]?.owner === botPlayer.id);
    // We need all but 1 in this group!
    if (mine.length !== ids.length - 1) continue;
    const missingId = ids.find((id) => state.deeds[id]?.owner && state.deeds[id]?.owner !== botPlayer.id);
    if (missingId === undefined || !isTradeable(state, missingId)) continue;

    const targetOwnerId = state.deeds[missingId].owner;
    const targetOwner = state.players.find((p) => p.id === targetOwnerId && !p.bankrupt);
    if (!targetOwner) continue;

    const missingTile = TILES[missingId];

    // Option 1: Do we hold a single property in another group where `targetOwner` already holds pieces?
    const swapCandidate = myTradeable.find((myId) => {
      const myTile = TILES[myId];
      if (!myTile.group || myTile.group === g) return false;
      const myCountThere = countOwnedInGroup(state, myTile.group, botPlayer.id);
      const theirCountThere = countOwnedInGroup(state, myTile.group, targetOwnerId);
      return myCountThere === 1 && theirCountThere >= 1;
    });

    if (swapCandidate !== undefined) {
      const giveTile = TILES[swapCandidate];
      const diff = missingTile.price - giveTile.price;
      const giveCash = diff > 0 ? Math.min(Math.max(20000, diff + 30000), Math.floor(botPlayer.cash * 0.45)) : 0;
      const getCash = diff < -40000 ? Math.min(Math.abs(diff), Math.floor(targetOwner.cash * 0.35)) : 0;
      if (botPlayer.cash - giveCash >= 60000) {
        return {
          fromId: botPlayer.id,
          toId: targetOwnerId,
          giveIds: [swapCandidate],
          getIds: [missingId],
          giveCash,
          getCash,
        };
      }
    }

    // Option 2: Cash buyout offer for the missing piece if the bot has plenty of cash
    const offerPrice = Math.round((missingTile.price * (1.45 + bot.risk * 0.25)) / 10000) * 10000;
    if (botPlayer.cash - offerPrice >= Math.max(100000, bot.buffer)) {
      return {
        fromId: botPlayer.id,
        toId: targetOwnerId,
        giveIds: [],
        getIds: [missingId],
        giveCash: offerPrice,
        getCash: 0,
      };
    }
  }
  return null;
}

export function evaluateTrade(state, botPlayer, trade) {
  const bot = botById(botPlayer.botId);
  const { giveCash = 0, giveIds = [], getCash = 0, getIds = [] } = trade; // from the proposer's view
  if (getCash > botPlayer.cash) return { accept: false, line: 'Itna cash abhi haath mein nahi hai!' };
  if ([...giveIds, ...getIds].some((id) => !isTradeable(state, id))) {
    return { accept: false, line: 'Pehle buildings becho, phir sauda karenge.' };
  }

  const valueOf = (id, receiverId) => {
    const tile = TILES[id];
    let v = state.deeds[id].mortgaged ? tile.price * 0.6 : tile.price;
    if (tile.group) {
      const size = GROUPS[tile.group].ids.length;
      const have = countOwnedInGroup(state, tile.group, receiverId);
      if (have === size - 1) v *= 2.15; // completes a set
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
    if (tile.group && countOwnedInGroup(state, tile.group, botPlayer.id) === GROUPS[tile.group].ids.length) v *= 1.75;
    botGives += v;
  });

  const margin = 1.1 - bot.risk * 0.22;
  if (botGets >= botGives * margin) return { accept: true, line: 'Sauda pakka! Haath milao!' };
  if (botGets >= botGives * 0.85) return { accept: false, line: 'Thoda aur meetha karo deal ko, tab baat banegi.' };
  return { accept: false, line: 'Mazaak kar rahe ho kya? Yeh deal bilkul घाटे ka sauda hai!' };
}

// ============================================================================
// SMART CONTEXT-AWARE BOT TRASH-TALK ENGINE
// Adapts to bot persona, their turn/play, and their specific opponent's state
// ============================================================================
export function generateBotTrashTalk(state, botPlayer, event, ctx = {}) {
  if (!botPlayer) return null;
  const bot = botById(botPlayer.botId);
  const rivals = state.players.filter((p) => p.id !== botPlayer.id && !p.bankrupt);
  if (!rivals.length) return null;

  const myNw = netWorth(state, botPlayer.id);
  const sortedRivals = [...rivals].sort((a, b) => netWorth(state, b.id) - netWorth(state, a.id));
  const leader = sortedRivals[0];
  const poorest = sortedRivals[sortedRivals.length - 1];
  const jailedRival = rivals.find((p) => p.inJail);
  const colorGroups = ['brown', 'sky', 'pink', 'orange', 'red', 'yellow', 'green', 'blue'];
  const myMonopolies = colorGroups.filter((g) => ownsGroup(state, g, botPlayer.id));

  switch (event) {
    case 'turn_start': {
      // 1. If an opponent is sitting in Tihar Jail, roast them by name!
      if (jailedRival && Math.random() < 0.55) {
        return pick([
          `Kyun ${jailedRival.name}, Tihar ki chakki pees rahe ho jab tak main saari market khareed raha hoon! 😂`,
          `${jailedRival.name} andar band hai—chalo jaldi se saare prime plots kabze mein le lo!`,
          `Haye ${jailedRival.name}, Tihar mein chai-biskoot bhejoon ya ₹50K bail ka chanda karein?`,
        ]);
      }
      // 2. If the poorest opponent is running low on cash (< ₹1.8L)
      if (poorest && poorest.cash < 180000 && Math.random() < 0.5) {
        return pick([
          `Arre ${poorest.name}, wallet mein sirf ${rupeesShort(poorest.cash)} bacha hai! Girvi ki tayyari kar lo!`,
          `${poorest.name} ki tijori khaali hone wali hai—bus ek dafa mere plot pe aa ja!`,
          `${poorest.name} bro, your cash burn is terrifying. Bankruptcy speedrun?`,
        ]);
      }
      // 3. Call out the richest rival if they are ahead
      if (leader && netWorth(state, leader.id) > myNw + 150000 && Math.random() < 0.5) {
        return pick([
          `${leader.name} abhi #1 pe uchhal raha hai—iss chakkar mein hisaab barabar karunga!`,
          `Watch your back ${leader.name}, your #1 spot is temporary!`,
          `${leader.name} seth ban ke ghoom raha hai, abhi पासा palatne wala hai!`,
        ]);
      }
      // 4. If bot is #1 leader, flex on the table
      if (leader && myNw > netWorth(state, leader.id) + 120000 && Math.random() < 0.45) {
        return pick([
          `${rupeesShort(myNw)} Net Worth! Tum sab mere kirayedaar banoge aaj!`,
          `Dekho table pe asli Crorepati kaun hai—${botPlayer.name} on top! 👑`,
          `Mere Haveli aur plots ke aage sabki bolti band hai!`,
        ]);
      }
      return null;
    }

    case 'big_roll': {
      const { total, isDouble } = ctx;
      if (isDouble) {
        return pick([
          `Doubles (${total})! ${leader ? `${leader.name}, darr ke rehna` : 'Bonus turn incoming'}! 🎲`,
          `Jodijamaal roll! Aaj kismat aur bazaar dono ${botPlayer.name} ke saath hain!`,
        ]);
      }
      if (total >= 10) {
        return pick([
          `Seedha ${total} aaya hai! Express train ki tarah nikalunga!`,
          `Big ${total} on the dice! Out of the way ${leader?.name || 'everyone'}!`,
        ]);
      }
      return null;
    }

    case 'dodged_rent': {
      // Bot stepped right past an expensive rival property without landing on it!
      const { owner, tile } = ctx;
      if (!owner || !tile) return null;
      return pick([
        `Haha ${owner.name}! Tere ${tile.short} ke saamne se bina ₹1 diye nikal gaya! 👋`,
        `Nice try ${owner.name}, dodged your ${tile.short} trap like a pro!`,
        `Dekhta reh gaya ${owner.name}! ${tile.short} ko tata-bye-bye bol ke aage nikal gaya!`,
      ]);
    }

    case 'collect_rent': {
      const { payer, tile, rent } = ctx;
      if (!payer || !tile) return bot.lines.collect;
      const rStr = rupeesShort(rent);
      const payerLeft = payer.cash - rent;

      if (payerLeft < 100000) {
        return pick([
          `Arre ${payer.name}, ${rStr} dene ke baad jeb khaali ho gayi! Plots girvi rakho ab! 🤑`,
          `${payer.name} ka bank balance ventilator pe aa gaya! Thanks for the ${rStr}!`,
          `Oof ${payer.name}, ${tile.short} ka ${rStr} kiraya deke toh tumhara diwala nikalne wala hai!`,
        ]);
      }
      if (rent >= 120000) {
        const personaBig = {
          gupta: `Laao ${payer.name} ji, ${tile.short} ka ${rStr} pakka kiraya! Munimji, tijori mein daalo!`,
          bunty: `BOOM! ${rStr} recurring revenue straight from ${payer.name}’s wallet! Love ${tile.short}!`,
          tauji: `${payer.name}, Tauji ke ${tile.short} pe aaye ho toh ${rStr} toll nikaalo chupchap!`,
          aunty: `Haye ${payer.name} beta, ${tile.short} aaye ho toh ${rStr} shagun lifafe mein deke jaao!`,
          chintu: `MASSIVE ${rStr} SUPERCHAT from ${payer.name} at ${tile.short}! Chat spam W! 🔥`,
          simran: `${rStr} high-margin yield collected from ${payer.name} on ${tile.short}. Textbook ROI.`,
        };
        return personaBig[botPlayer.botId] || bot.lines.collect;
      }
      return pick([
        `Shukriya ${payer.name}! ${tile.short} ka ${rStr} kiraya time pe mil gaya!`,
        `Keep funding my empire ${payer.name}! +${rStr} from ${tile.short}!`,
        `Abhi toh sirf ${rStr} liya hai ${payer.name}, agle chakkar mein ${tile.short} pe Haveli milegi!`,
      ]);
    }

    case 'pay_rent': {
      const { owner, tile, rent } = ctx;
      if (!owner || !tile) return bot.lines.pay;
      const rStr = rupeesShort(rent);
      if (rent <= 26000) {
        return pick([
          `Le ${owner.name}, ${rStr} chillar rakh le—isne se cutting chai pee lena! ☕`,
          `Bro ${owner.name}, ${rStr} at ${tile.short}? That’s literally pocket change for me.`,
          `Itna sasta kiraya ${owner.name}? ${rStr} toh main tip mein de deta hoon!`,
        ]);
      }
      if (rent >= 120000) {
        return pick([
          `Loot macha rakhi hai ${owner.name} ne ${tile.short} pe! ${rStr} wapas vasoolunga sood samet!`,
          `Enjoy that ${rStr} ${owner.name}—wait till you step onto my Haveli row!`,
          `Aaj ${owner.name} ko ${rStr} diya hai, agle round mein iska hisaab barabar karunga!`,
        ]);
      }
      return pick([
        `Ye lo ${rStr} ${owner.name}, par yaad rakhna agla chakkar mera hoga!`,
        `${owner.name} ko ${rStr} de raha hoon—par ${tile.short} pe meri nazar hai!`,
      ]);
    }

    case 'auction_win': {
      const { tile, price, initiator } = ctx;
      if (!tile) return bot.lines.buy;
      if (price < tile.price && initiator && initiator.id !== botPlayer.id) {
        return pick([
          `Shukriya ${initiator.name}! ${rupeesShort(tile.price)} ka ${tile.short} sirf ${rupeesShort(price)} mein chhod diya! 😂`,
          `What a steal! ${initiator.name} passed on ${tile.short} and I grabbed it for ${rupeesShort(price)}!`,
        ]);
      }
      return pick([
        `Neelaami mein ${botPlayer.name} ke aage kisi ki boli nahi chalti! ${tile.short} hamara!`,
        `Outbid the whole table for ${tile.short}! Paisa bolta hai!`,
      ]);
    }

    case 'haveli': {
      const { tile } = ctx;
      const targetName = leader ? leader.name : 'sab log';
      return pick([
        `${tile?.short || 'Yahan'} pe Shahi Haveli khadi ho gayi! ${targetName}, ab idhar kadam rakh ke dikhao! 🏰`,
        bot.lines.haveli,
      ]);
    }

    case 'monopoly': {
      const { group } = ctx;
      const gName = group ? GROUPS[group]?.name : 'Poora Bazaar';
      return pick([
        `Poora ${gName} ab ${botPlayer.name} ke kabze mein! ${leader ? `${leader.name},` : 'Ab'} kiraya double aur Haveli tayyar! 👑`,
        bot.lines.monopoly,
      ]);
    }

    case 'jail_stay': {
      return pick([
        `Bahar har kadam pe kiraya hai—main toh Tihar mein aaram se baith ke rent ginunga! 😎`,
        `Smart tycoons stay inside Tihar late-game while ${leader?.name || 'you all'} pay rent outside!`,
      ]);
    }

    case 'clapback': {
      const { sender } = ctx;
      const sName = sender?.name || 'Bhai';
      const sNw = sender ? netWorth(state, sender.id) : 0;
      const sMonos = sender ? colorGroups.filter((g) => ownsGroup(state, g, sender.id)).length : 0;

      if (sender?.inJail) {
        return pick([
          `Oye ${sName}, pehle Tihar Jail se bahar toh nikal, phir ${botPlayer.name} ko roast karna! ⛓️`,
          `${sName} salaakhon ke peeche se badi-badi baatein kar raha hai! Pehle ₹50K bail bhar! 😂`,
        ]);
      }
      if (sender && sNw < myNw - 80000) {
        return pick([
          `Pehle apna Net Worth dekh ${sName} (${rupeesShort(sNw)}), phir ${rupeesShort(myNw)} wale Seth se panga lena!`,
          `${sName} bro, your Net Worth is ${rupeesShort(sNw)}. Talk to me when you cross ${rupeesShort(myNw)}!`,
        ]);
      }
      if (sender && sMonos === 0 && myMonopolies.length > 0) {
        return pick([
          `Zero monopoly leke ghoom raha hai ${sName} aur tevar Ambani jaise! 😂`,
          `Mere paas ${myMonopolies.length} Monopoly set hai ${sName}, tere paas kya hai?`,
        ]);
      }
      const personaClapbacks = {
        gupta: `Baatein kam karo ${sName}, meri dukaan pe aao toh kiraya ready rakhna!`,
        bunty: `Cute trash-talk ${sName} bro, let’s see your P&L statement after this round!`,
        tauji: `Halki aawaz mein baat kar ${sName}, warna tere saare plot Neelaami mein khareed lunga!`,
        aunty: `Haye ${sName} beta, itna attitude achi baat nahi—abhi colony group mein batati hoon!`,
        chintu: `${sName} trying to roast me for clout! Ratio + L + pay rent bro! 😂`,
        simran: `Statistically speaking ${sName}, your bankruptcy probability just went up 18%.`,
      };
      return personaClapbacks[botPlayer.botId] || `Dekhte hain ${sName}, asli Crorepati kaun banta hai!`;
    }

    default:
      return null;
  }
}
