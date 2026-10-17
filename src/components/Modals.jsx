import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';
import { TILES, GROUPS, isOwnable } from '../data/board';
import { botById } from '../data/characters';
import { TileArt } from '../art/tileArt';
import { PlayerAvatar } from '../art/characters';
import { Rangoli } from '../art/decor';
import { game } from '../game/engine';
import * as R from '../game/rules';
import { evaluateTrade } from '../game/ai';
import { rupees, rupeesShort } from '../utils/format';
import { sounds } from '../utils/sound';
import { DeedCard, Modal } from './ui';

const CloseBtn = ({ onClose }) => (
  <button className="modal-close" onClick={onClose} aria-label="Close">
    <X />
  </button>
);

// ---------------- Deed ----------------
export function DeedModal({ s, tileId, viewer, canManage, onClose }) {
  const tile = TILES[tileId];
  const deed = s.deeds[tileId];
  const owner = deed?.owner ? s.players.find((p) => p.id === deed.owner) : null;
  const mine = owner && viewer && owner.id === viewer.id;
  const can = mine && canManage;
  const build = mine ? R.canBuild(s, viewer.id, tileId) : { ok: false };
  const sell = mine ? R.canSell(s, viewer.id, tileId) : { ok: false };
  const mort = mine ? R.canMortgage(s, viewer.id, tileId) : { ok: false };
  const unm = mine ? R.canUnmortgage(s, viewer.id, tileId) : { ok: false };
  const here = s.players.filter((p) => !p.bankrupt && p.pos === tileId);

  return (
    <Modal onClose={onClose} className="modal-deed" label={tile.name}>
      <CloseBtn onClose={onClose} />
      {isOwnable(tile) ? (
        <DeedCard tileId={tileId} deed={deed} owner={owner} boomGroup={s.boomGroup} />
      ) : (
        <div className="info-card">
          <TileArt id={tileId} className="info-art" />
          <div className="info-name">{tile.name}</div>
          <div className="info-city">{tile.city}</div>
          <p>{tile.desc}</p>
        </div>
      )}
      {(here.length > 0 || mine) && (
        <div className="deed-modal-tray">
          {here.length > 0 && (
            <div className="deed-here">
              <span className="deed-here-label">On this tile:</span>
              {here.map((p) => <span key={p.id} className="here-chip" style={{ '--pc': p.color }}>{p.name}</span>)}
            </div>
          )}
          {mine && (
            <div className="deed-actions">
              <div className="deed-actions-row">
                {tile.type === 'property' && !deed.mortgaged && (
                  <>
                    <button className="btn btn-sm btn-green" disabled={!can || !build.ok} onClick={() => game.build(viewer.id, tileId)} title={build.reason}>
                      + Build {rupeesShort(tile.houseCost)}
                    </button>
                    <button className="btn btn-sm" disabled={!can || !sell.ok} onClick={() => game.sellBuilding(viewer.id, tileId)} title={sell.reason}>
                      − Sell Building
                    </button>
                  </>
                )}
                {deed.mortgaged ? (
                  <button className="btn btn-sm btn-teal" disabled={!can || !unm.ok} onClick={() => game.unmortgage(viewer.id, tileId)} title={unm.reason}>
                    Redeem {rupeesShort(R.unmortgageCost(tileId))}
                  </button>
                ) : (
                  <button className="btn btn-sm btn-red" disabled={!can || !mort.ok} onClick={() => game.mortgage(viewer.id, tileId)} title={mort.reason}>
                    Girvi +{rupeesShort(tile.mortgage)}
                  </button>
                )}
              </div>
              {!canManage && <div className="deed-note">You can manage buildings and Girvi on your turn.</div>}
              {canManage && !build.ok && build.reason && tile.type === 'property' && !deed.mortgaged && <div className="deed-note">{build.reason}</div>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ---------------- Trade ----------------
function PropPick({ ids, picked, toggle, s }) {
  if (!ids.length) return <div className="trade-empty">No properties owned</div>;
  return (
    <div className="trade-props">
      {ids.map((id) => {
        const tile = TILES[id];
        const ok = R.isTradeable(s, id);
        const on = picked.includes(id);
        return (
          <button key={id} className={`trade-prop ${on ? 'on' : ''}`} disabled={!ok} onClick={() => toggle(id)} style={{ '--g': GROUPS[tile.group]?.color }} title={ok ? tile.name : 'Sell the buildings in this set before trading'}>
            <TileArt id={id} className="trade-art" />
            <span>{tile.short}{s.deeds[id].mortgaged ? ' (girvi)' : ''}</span>
          </button>
        );
      })}
    </div>
  );
}

const CASH_STEP = 10000;

function CashInput({ value, set, max }) {
  return (
    <div className="cash-input">
      <button className="mini-btn" disabled={value <= 0} onClick={() => set(Math.max(0, value - CASH_STEP * 10))} title="Subtract ₹1 Lakh">−1L</button>
      <button className="mini-btn" disabled={value <= 0} onClick={() => set(Math.max(0, value - CASH_STEP))} aria-label="Less cash">−10K</button>
      <span className="cash-input-val">{rupees(value)}</span>
      <button className="mini-btn" disabled={value >= max} onClick={() => set(Math.min(max, value + CASH_STEP))} aria-label="More cash">+10K</button>
      <button className="mini-btn" disabled={value >= max} onClick={() => set(Math.min(max, value + CASH_STEP * 10))} title="Add ₹1 Lakh">+1L</button>
      {value > 0 && <button className="mini-btn cash-clear" onClick={() => set(0)} title="Reset cash to ₹0">✕</button>}
    </div>
  );
}

export function TradeModal({ s, me, onClose }) {
  const others = s.players.filter((p) => p.id !== me.id && !p.bankrupt);
  const [partnerId, setPartnerId] = useState(others[0]?.id);
  const [giveIds, setGiveIds] = useState([]);
  const [getIds, setGetIds] = useState([]);
  const [giveCash, setGiveCash] = useState(0);
  const [getCash, setGetCash] = useState(0);
  const [reply, setReply] = useState(null);
  const partner = s.players.find((p) => p.id === partnerId);

  const toggle = (setter) => (id) => {
    setReply(null);
    setter((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
  };
  const trade = { fromId: me.id, toId: partnerId, giveIds, getIds, giveCash: +giveCash || 0, getCash: +getCash || 0 };
  const empty = !giveIds.length && !getIds.length && !trade.giveCash && !trade.getCash;

  const propose = () => {
    if (!partner || empty) return;
    if (partner.isAi) {
      const r = evaluateTrade(s, partner, trade);
      setReply(r);
      if (r.accept) {
        sounds.victory();
        setTimeout(() => {
          game.proposeTrade(trade);
          onClose();
        }, 1100);
      } else {
        sounds.tension();
      }
    } else {
      game.proposeTrade(trade);
      onClose();
    }
  };

  const cashProps = (value, set, max) => ({ value, max, set: (v) => { setReply(null); set(v); } });

  return (
    <Modal onClose={onClose} className="modal-trade" label="Sauda Bazaar">
      <CloseBtn onClose={onClose} />
      <div className="modal-head">
        <span className="modal-emoji">🤝</span>
        <div>
          <div className="modal-kicker">Sauda Bazaar</div>
          <h2>Make a Deal</h2>
        </div>
      </div>
      <div className="trade-partners">
        {others.map((p) => (
          <button key={p.id} className={`partner ${p.id === partnerId ? 'on' : ''}`} style={{ '--pc': p.color }} onClick={() => { setPartnerId(p.id); setGetIds([]); setGetCash(0); setReply(null); }}>
            <PlayerAvatar player={p} className="sm" />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
      {partner && (
        <div className="trade-cols">
          <div className="trade-col" style={{ '--pc': me.color }}>
            <div className="trade-col-head">
              <PlayerAvatar player={me} className="xs" />
              <span>You give</span>
              <span className="trade-col-cash">{rupeesShort(me.cash)}</span>
            </div>
            <CashInput {...cashProps(trade.giveCash, setGiveCash, me.cash)} />
            <PropPick s={s} ids={R.ownedIds(s, me.id)} picked={giveIds} toggle={toggle(setGiveIds)} />
          </div>
          <div className="trade-swap">⇄</div>
          <div className="trade-col" style={{ '--pc': partner.color }}>
            <div className="trade-col-head">
              <PlayerAvatar player={partner} className="xs" />
              <span>{partner.name} gives</span>
              <span className="trade-col-cash">{rupeesShort(partner.cash)}</span>
            </div>
            <CashInput {...cashProps(trade.getCash, setGetCash, partner.cash)} />
            <PropPick s={s} ids={R.ownedIds(s, partner.id)} picked={getIds} toggle={toggle(setGetIds)} />
          </div>
        </div>
      )}
      {reply && (
        <div className={`trade-reply ${reply.accept ? 'yes' : 'no'}`}>
          {partner && <PlayerAvatar player={partner} className="sm" />}
          <span><b>{partner?.name}:</b> “{reply.line}”</span>
        </div>
      )}
      <div className="modal-foot">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-pink" disabled={empty || reply?.accept} onClick={propose}>Propose Deal ➜</button>
      </div>
    </Modal>
  );
}

// ---------------- Incoming Live Trade Offer (Online & Pass-and-Play) ----------------
export function IncomingTradeModal({ s }) {
  const trade = s.pendingTrade;
  if (!trade) return null;
  const from = s.players.find((p) => p.id === trade.fromId);
  const to = s.players.find((p) => p.id === trade.toId);
  if (!from || !to) return null;

  const isRecipient = game.isControllableByMe(to.id);
  const isSender = game.isControllableByMe(from.id);

  if (!isRecipient && !isSender) return null;

  const renderBundle = (cash, ids) => (
    <div className="offer-bundle">
      {cash > 0 && <div className="offer-cash">💰 {rupees(cash)}</div>}
      {ids.map((id) => (
        <div key={id} className="offer-prop" style={{ '--g': GROUPS[TILES[id].group]?.color }}>
          <TileArt id={id} className="trade-art" />
          <span>{TILES[id].name}</span>
        </div>
      ))}
      {!cash && !ids.length && <div className="trade-empty">Nothing</div>}
    </div>
  );

  return (
    <Modal onClose={() => game.respondTrade(false)} className="modal-trade" label="Sauda Offer">
      <div className="modal-head">
        <span className="modal-emoji">🤝</span>
        <div>
          <div className="modal-kicker">Sauda Bazaar Offer</div>
          <h2>{isRecipient ? `${from.name} wants a deal with you!` : `Waiting for ${to.name}…`}</h2>
        </div>
      </div>

      <div className="trade-cols">
        <div className="trade-col" style={{ '--pc': from.color }}>
          <div className="trade-col-head"><PlayerAvatar player={from} className="xs" /> {from.name} gives</div>
          {renderBundle(trade.giveCash, trade.giveIds)}
        </div>
        <div className="trade-swap">⇄</div>
        <div className="trade-col" style={{ '--pc': to.color }}>
          <div className="trade-col-head"><PlayerAvatar player={to} className="xs" /> {to.name} gives</div>
          {renderBundle(trade.getCash, trade.getIds)}
        </div>
      </div>

      {isRecipient ? (
        <div className="modal-foot">
          <button className="btn btn-red" onClick={() => game.respondTrade(false)}>Reject ❌</button>
          <button className="btn btn-green" onClick={() => game.respondTrade(true)}>Accept Sauda 🤝</button>
        </div>
      ) : (
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={() => game.respondTrade(false)}>Cancel Offer</button>
        </div>
      )}
    </Modal>
  );
}

// ---------------- Rules ----------------
// Every number here mirrors rules.js / engine.js / board.js exactly — nothing invented.
const RULE_TABS = [
  {
    id: 'basics',
    icon: '🎲',
    label: 'Basics',
    intro: 'Travel round India, buy landmarks, collect kiraya and bankrupt your rivals. Up to 6 tycoons: friends, bots, or both.',
    rules: [
      ['💰', 'Starting Cash', 'Classic Seth: everyone starts with ₹15,00,000. Express Jugaad: ₹25,00,000 plus free random starter plots (3 each with 2–3 players, 2 each with 4–6).'],
      ['🎲', 'Roll & Move', 'Roll two dice and move anticlockwise. Rolling doubles gives you another roll. Three doubles in a row = overspeeding challan, straight to Tihar Jail.'],
      ['🪔', 'Shagun (Passing START)', 'Every time you cross START you collect ₹2,00,000. Land exactly on START for a Bumper Shagun of ₹3,00,000.'],
      ['🧾', 'Taxes', 'Income Tax Notice costs ₹2,00,000 and Big Fat Wedding Tax costs ₹1,00,000. Both go into the Jugaad Gullak, not the bank.'],
      ['☕', 'Jugaad Gullak Jackpot', 'The Gullak starts with ₹1,00,000 and collects every tax, bail and Gullak fine. Land on Jugaad Junction (top-left corner) to take the whole pot.'],
      ['🤝', 'Trading', 'On your turn, open Trade to swap plots and cash with anyone. A colour set with any building on it cannot be traded until the buildings are sold. Bots propose deals too.'],
    ],
  },
  {
    id: 'property',
    icon: '🏷️',
    label: 'Property & Rent',
    intro: 'There are 28 ownable tiles: 22 colour plots in 8 sets, 4 Rail & Metro lines and 2 Utilities.',
    rules: [
      ['🏷️', 'Buy or Neelaami', 'Land on an unowned tile to buy it at the printed price. Decline, or lack the cash, and it goes to a live Neelaami auction where everyone can bid, including you. Bids rise by ₹10,000 (₹20,000 for plots priced ₹2L+). The highest bid wins; if nobody bids, it stays with the sarkar.'],
      ['💸', 'Rent (Kiraya)', 'Land on a rival’s tile and you pay rent. Owning the full colour set doubles the rent on empty plots. Buildings raise rent a lot (see the deed card for each level).'],
      ['🚆', 'Rail & Metro', 'Rent is ₹25,000 for 1 line, ₹50,000 for 2, ₹1,00,000 for 3 and ₹2,00,000 for all 4.'],
      ['⚡', 'Utilities', 'Rent is dice total × ₹4,000 with one utility, or dice total × ₹10,000 if you own both Bijli Board and UPI Network.'],
      ['📜', 'Girvi (Mortgage)', 'Mortgage an empty plot to the bank for half its price. Mortgaged plots charge ₹0 rent. Redeem one by paying the mortgage value + 10%. You must sell buildings in a set before mortgaging any plot in it.'],
      ['🔥', 'Bazaar Utsav (Boom City)', 'Every round a random colour set becomes the Boom City and its rent is multiplied by 1.5× for that round.'],
      ['🐂', 'Sensex Bull Run', 'From Round 7, or once only 3 or fewer tiles are unowned, the Bull Run starts for the rest of the game: Boom City rent goes up to 1.75×.'],
    ],
  },
  {
    id: 'build',
    icon: '🏗️',
    label: 'Building',
    intro: 'Five building levels per plot: Chai Tapri → Highway Dhaba → Swanky Showroom → Mega Mall → Royal Haveli.',
    rules: [
      ['👑', 'Full-Set Building', 'Own every plot in a colour set (none mortgaged) to build anytime on your turn. Each level costs the plot’s building price.'],
      ['⚖️', 'Even Building Rule', 'Build evenly: no plot in a set can be more than one level ahead of the others. Selling works the same way in reverse.'],
      ['🛠️', 'Spot Upgrade (Desi Jugaad)', 'Land on your own unmortgaged plot to upgrade it one level on the spot. Without the full set you can go up to a Highway Dhaba (level 2). With the full set you can go all the way to a Royal Haveli.'],
      ['🏰', 'Royal Haveli', 'Level 5 is the Royal Haveli, with the highest rent on the deed. A Haveli landing is the scariest moment in the game.'],
      ['🔧', 'Selling Buildings', 'Sell one building at a time back to the bank for half its build cost. Useful when you need cash to pay rent.'],
    ],
  },
  {
    id: 'power',
    icon: '🎯',
    label: 'Deals & Strategy',
    intro: 'Master the Sauda Bazaar, auctions, and Boom City multipliers to dominate the board.',
    rules: [
      ['🎯', 'Monopoly Radar', 'The Empire panel highlights every colour set where you are one plot away from a full monopoly, plus who holds the missing piece so you can negotiate a trade.'],
      ['🤝', 'Smart Bot Deals', 'Each AI rival has a distinct negotiation style. Offer fair cash or swap plots that help both sides, and watch out when a deal would hand a rival a full colour set.'],
      ['🔨', 'Neelaami Bargains', 'Whenever a player passes on an unowned plot, it goes to live auction starting at half price. Keep cash reserves ready to snipe key plots at a discount.'],
      ['🔥', 'Boom City & Bull Run', 'A random colour set gets a 1.5× rent boost each round—rising to 1.75× once the Sensex Bull Run begins. Prioritize building on sets with high foot traffic.'],
      ['⚡', 'Spot Upgrade Advantage', 'Even before completing a colour set, landing on your own plot lets you build up to a Highway Dhaba (level 2), multiplying early-game kiraya.'],
    ],
  },
  {
    id: 'jail',
    icon: '⛓️',
    label: 'Jail, Cards & Debt',
    intro: 'Tihar Jail, fortune cards and the Diwaliya rules.',
    rules: [
      ['🚨', 'Going to Tihar', 'You go to Tihar if you land on ED Raid, draw a jail card, or roll three doubles in a row. You do not collect Shagun on the way.'],
      ['🔑', 'Getting Out', 'On your turn: pay ₹50,000 bail, use a VIP Bail Pass, or try for doubles. Doubles free you and you move by that roll. After a 3rd failed attempt you must pay ₹50,000 and move. You still collect rent while inside.'],
      ['🦜', 'Kismet Cards', '20 parrot-astrologer cards: cash windfalls, fines, travel to landmarks, nearest Rail & Metro at double rent, repair bills, and more.'],
      ['👵', 'Rishtedaar Cards', '20 family cards: Diwali bonuses, shagun from every player, loans to cousins, Lawyer Chacha’s VIP Bail Pass, and plenty of drama.'],
      ['🆘', 'Can’t Pay?', 'Sell buildings and mortgage plots to raise cash (or tap Auto-Raise). If you still cannot pay, you are Diwaliya (bankrupt).'],
      ['💀', 'Diwaliya', 'If you go bankrupt to a player, they get all your plots, plus your cash and buildings converted at half value. Bankrupt to the bank or Gullak, and your plots return to the market.'],
    ],
  },
  {
    id: 'win',
    icon: '🏆',
    label: 'Winning & Adda',
    intro: 'Pick a win condition in setup, then trash-talk your way to the top.',
    rules: [
      ['🏆', 'Last Tycoon Standing', 'Bankrupt everyone else. The last solvent player wins.'],
      ['💎', '₹45L Crorepati', 'The first player whose Net Worth reaches ₹45,00,000 wins instantly.'],
      ['⏱️', '20-Round Blitz', 'After 20 rounds the richest player by Net Worth wins.'],
      ['📊', 'Net Worth', 'Net Worth = cash + price of every plot you own (mortgage value if it is girvi) + the build cost of every building.'],
      ['🌐', 'Online With Friends', 'Create a room, share the 4-letter code or invite link, and play live. The host’s device runs the game; empty seats can be filled with bots.'],
      ['🔥', 'Trash-Talk', 'Use the Desi Trash-Talk dock (left panel), tap 🔥 on any rival’s card for a targeted roast, or open Adda to pick a target and category. Bots read the game state and clap back by name.'],
    ],
  },
];

export function RulesModal({ onClose }) {
  const [tabId, setTabId] = useState(RULE_TABS[0].id);
  const tab = RULE_TABS.find((t) => t.id === tabId) || RULE_TABS[0];
  return (
    <Modal onClose={onClose} className="modal-rules modal-rulebook" label="How to play">
      <CloseBtn onClose={onClose} />
      <div className="modal-head">
        <span className="modal-emoji">📖</span>
        <div>
          <div className="modal-kicker">Niyam aur Kanoon · Official Rulebook</div>
          <h2>How to play Nonopoly</h2>
        </div>
      </div>
      <div className="rule-tabs" role="tablist">
        {RULE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={t.id === tab.id}
            className={t.id === tab.id ? 'on' : ''}
            onClick={() => { sounds.click(); setTabId(t.id); }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
      <div className="rule-tab-body" key={tab.id}>
        <p className="rule-intro">{tab.intro}</p>
        <div className="rules-grid">
          {tab.rules.map(([icon, title, text]) => (
            <div key={title} className="rule">
              <span className="rule-icon">{icon}</span>
              <div>
                <b>{title}</b>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn" onClick={onClose}>Samajh gaya! Let’s play</button>
      </div>
    </Modal>
  );
}

// ---------------- Victory ----------------
const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const COLOR_GROUPS = ['brown', 'sky', 'pink', 'orange', 'red', 'yellow', 'green', 'blue'];
const countMonopolies = (s, pid) => COLOR_GROUPS.filter((g) => R.ownsGroup(s, g, pid)).length;

export function Victory({ s, onHome, onReplay }) {
  const winner = s.players.find((p) => p.id === s.winner);
  const ranking = useMemo(
    () => [...s.players].sort((a, b) => (a.bankrupt - b.bankrupt) || R.netWorth(s, b.id) - R.netWorth(s, a.id)),
    [s],
  );

  useEffect(() => {
    const colors = ['#ff9f1c', '#ffd23f', '#e5007d', '#13c2b3', '#ffffff'];
    let stop = false;
    const end = Date.now() + 3500;
    (function frame() {
      if (stop) return;
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    return () => { stop = true; };
  }, []);

  if (!winner) return null;
  const line = winner.isAi ? botById(winner.botId).lines.collect : 'Sabse bada seth: the biggest tycoon at the table!';
  const winKicker = s.winReason === 'wealth'
    ? '💎 Crorepati Target Achieved'
    : s.winReason === 'rounds'
      ? `⏱️ Richest Tycoon After Round ${s.round}`
      : `🏆 Last Tycoon Standing · Round ${s.round}`;

  const winnerWorth = R.netWorth(s, winner.id);
  const winnerDeeds = R.ownedIds(s, winner.id).length;
  const winnerSets = countMonopolies(s, winner.id);
  const winnerBuildings = Object.values(s.deeds).reduce(
    (sum, d) => (d?.owner === winner.id ? sum + (d.level || 0) : sum),
    0,
  );

  return (
    <div className="victory">
      <div className="victory-card" style={{ '--champ-c': winner.color }}>
        <Rangoli className="victory-rangoli" />

        <div className="victory-top">
          <div className="victory-kicker">{winKicker}</div>
          <div className="victory-sub-brand">NONOPOLY · GREAT INDIAN PROPERTY TAMASHA</div>
        </div>

        <div className="victory-hero">
          <div className="victory-champ">
            <span className="victory-crown" aria-hidden="true">👑</span>
            <PlayerAvatar player={winner} className="xl" />
          </div>
          <div className="victory-hero-info">
            <div className="victory-title">Sabse Bada Seth · Champion</div>
            <h2 className="victory-name">{winner.name}</h2>
            <p className="victory-line">“{line}”</p>
          </div>
        </div>

        <div className="victory-stats">
          <div className="v-stat highlight">
            <span>Net Worth</span>
            <b>{rupees(winnerWorth)}</b>
          </div>
          <div className="v-stat">
            <span>Cash in Hand</span>
            <b>{rupeesShort(winner.cash)}</b>
          </div>
          <div className="v-stat">
            <span>Deeds Owned</span>
            <b>{winnerDeeds} {winnerDeeds === 1 ? 'Plot' : 'Plots'}</b>
          </div>
          <div className="v-stat">
            <span>Empire</span>
            <b>{winnerSets} {winnerSets === 1 ? 'Set' : 'Sets'} · {winnerBuildings} 🏗️</b>
          </div>
        </div>

        <div className="standings-wrap">
          <div className="standings-head">
            <span>Final Standings</span>
            <span>Net Worth</span>
          </div>
          <ol className="standings">
            {ranking.map((p, i) => {
              const deedsCount = R.ownedIds(s, p.id).length;
              const setsCount = countMonopolies(s, p.id);
              return (
                <li key={p.id} className={`${p.bankrupt ? 'out' : ''} ${i === 0 ? 'first' : ''}`} style={{ '--pc': p.color }}>
                  <span className={`rank ${i < 3 && !p.bankrupt ? `medal-${i + 1}` : ''}`}>
                    {!p.bankrupt && i < 3 ? RANK_MEDALS[i] : `#${i + 1}`}
                  </span>
                  <PlayerAvatar player={p} className="xs" />
                  <div className="st-info">
                    <span className="st-name">{p.name}</span>
                    <span className="st-meta">
                      {p.bankrupt
                        ? 'Eliminated'
                        : `${deedsCount} ${deedsCount === 1 ? 'deed' : 'deeds'}${setsCount > 0 ? ` · ${setsCount} ★` : ''}`}
                    </span>
                  </div>
                  {p.bankrupt ? (
                    <span className="st-badge-out">DIWALIYA</span>
                  ) : (
                    <span className="st-worth">{rupees(R.netWorth(s, p.id))}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="victory-actions">
          <button className="btn btn-lg" onClick={onReplay}>🎲 Play Again</button>
          <button className="btn btn-lg btn-ghost" onClick={onHome}>🏠 Back to Lobby</button>
        </div>
      </div>
    </div>
  );
}

