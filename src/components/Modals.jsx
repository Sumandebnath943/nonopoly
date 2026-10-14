import { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';
import { TILES, GROUPS, isOwnable } from '../data/board';
import { botById } from '../data/characters';
import { TileArt } from '../art/tileArt';
import { PlayerAvatar } from '../art/characters';
import { Logo, Rangoli } from '../art/decor';
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
        <DeedCard tileId={tileId} deed={deed} owner={owner} />
      ) : (
        <div className="info-card">
          <TileArt id={tileId} className="info-art" />
          <div className="info-name">{tile.name}</div>
          <div className="info-city">{tile.city}</div>
          <p>{tile.desc}</p>
        </div>
      )}
      {here.length > 0 && (
        <div className="deed-here">
          Standing here: {here.map((p) => <span key={p.id} className="here-chip" style={{ '--pc': p.color }}>{p.name}</span>)}
        </div>
      )}
      {mine && (
        <div className="deed-actions">
          {tile.type === 'property' && !deed.mortgaged && (
            <>
              <button className="btn btn-sm btn-green" disabled={!can || !build.ok} onClick={() => game.build(viewer.id, tileId)} title={build.reason}>
                + Build {rupeesShort(tile.houseCost)}
              </button>
              <button className="btn btn-sm" disabled={!can || !sell.ok} onClick={() => game.sellBuilding(viewer.id, tileId)} title={sell.reason}>
                − Sell building
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
          {!canManage && <div className="deed-note">Manage this on your turn.</div>}
          {canManage && !build.ok && build.reason && tile.type === 'property' && !deed.mortgaged && <div className="deed-note">{build.reason}</div>}
        </div>
      )}
    </Modal>
  );
}

// ---------------- Trade ----------------
function PropPick({ ids, picked, toggle, s }) {
  if (!ids.length) return <div className="trade-empty">No properties</div>;
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
      <button className="mini-btn" onClick={() => set(Math.max(0, value - CASH_STEP))} aria-label="Less cash">−</button>
      <span>{rupees(value)}</span>
      <button className="mini-btn" onClick={() => set(Math.min(max, value + CASH_STEP))} aria-label="More cash">+</button>
      <button className="mini-btn" onClick={() => set(Math.min(max, value + CASH_STEP * 10))}>+1L</button>
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
  const [confirmHuman, setConfirmHuman] = useState(false);
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
          game.executeTrade(trade);
          onClose();
        }, 1300);
      } else {
        sounds.tension();
      }
    } else {
      setConfirmHuman(true);
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
          <h2>Make a deal</h2>
        </div>
      </div>
      <div className="trade-partners">
        {others.map((p) => (
          <button key={p.id} className={`partner ${p.id === partnerId ? 'on' : ''}`} style={{ '--pc': p.color }} onClick={() => { setPartnerId(p.id); setGetIds([]); setGetCash(0); setReply(null); setConfirmHuman(false); }}>
            <PlayerAvatar player={p} className="sm" />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
      {partner && (
        <div className="trade-cols">
          <div className="trade-col" style={{ '--pc': me.color }}>
            <div className="trade-col-head"><PlayerAvatar player={me} className="xs" /> You give</div>
            <CashInput {...cashProps(trade.giveCash, setGiveCash, me.cash)} />
            <PropPick s={s} ids={R.ownedIds(s, me.id)} picked={giveIds} toggle={toggle(setGiveIds)} />
          </div>
          <div className="trade-swap">⇄</div>
          <div className="trade-col" style={{ '--pc': partner.color }}>
            <div className="trade-col-head"><PlayerAvatar player={partner} className="xs" /> {partner.name} gives</div>
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
      {confirmHuman ? (
        <div className="trade-confirm">
          <span>Pass the device to <b>{partner.name}</b>. Do you accept this deal?</span>
          <div className="dock-row">
            <button className="btn btn-sm btn-green" onClick={() => { game.executeTrade(trade); onClose(); }}>Accept</button>
            <button className="btn btn-sm btn-red" onClick={() => { setConfirmHuman(false); setReply({ accept: false, line: 'No deal!' }); }}>Reject</button>
          </div>
        </div>
      ) : (
        <div className="modal-foot">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-pink" disabled={empty || reply?.accept} onClick={propose}>Propose deal ➜</button>
        </div>
      )}
    </Modal>
  );
}

// ---------------- Rules ----------------
export function RulesModal({ onClose }) {
  const rules = [
    ['🎲', 'Roll & move', 'Roll two dice and move round India anticlockwise. Doubles mean roll again, but three doubles in a row gets you an overspeeding challan and a trip to Tihar.'],
    ['🪔', 'Shagun', 'Every time you pass START (Shubh Aarambh), the elders give you ₹2,00,000.'],
    ['🏷️', 'Buy or auction', 'Land on an unowned property to buy it at list price. Pass, and it goes to a live auction (neelaami) where everyone can bid.'],
    ['💸', 'Kiraya (rent)', 'Land on someone else’s property and you pay rent. Own a full colour set and rent on empty plots doubles.'],
    ['🏗️', 'Build', 'With a full set, build evenly: Chai Tapri → Dhaba → Showroom → Mega Mall → Royal Haveli. Rents explode.'],
    ['📜', 'Girvi (mortgage)', 'Short on cash? Mortgage a property for half its price. No rent while it’s mortgaged. Redeem it for the mortgage amount plus 10%.'],
    ['🦜', 'Kismet & Rishtedaar', 'The parrot astrologer’s cards bring jackpots, challans and train rides. The relatives bring shagun, loans and drama.'],
    ['🚨', 'ED Raid & Tihar', 'Land on ED Raid and you go straight to jail. To get out: pay ₹50,000, use a Bail Pass, or roll doubles (you get 3 tries).'],
    ['☕', 'Jugaad Gullak', 'Every tax and fine goes into the Gullak. Land on Jugaad Junction to win the whole thing.'],
    ['💀', 'Diwaliya', 'If you can’t pay even after selling and mortgaging, you’re bankrupt. Last tycoon standing (or richest when the rounds run out) wins.'],
  ];
  return (
    <Modal onClose={onClose} className="modal-rules" label="How to play">
      <CloseBtn onClose={onClose} />
      <div className="modal-head">
        <span className="modal-emoji">📖</span>
        <div>
          <div className="modal-kicker">Niyam aur Kanoon</div>
          <h2>How to play Nonopoly</h2>
        </div>
      </div>
      <div className="rules-grid">
        {rules.map(([icon, title, text]) => (
          <div key={title} className="rule">
            <span className="rule-icon">{icon}</span>
            <div>
              <b>{title}</b>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="modal-foot">
        <button className="btn" onClick={onClose}>Samajh gaya! Let’s play</button>
      </div>
    </Modal>
  );
}

// ---------------- Victory ----------------
export function Victory({ s, onHome, onReplay }) {
  const winner = s.players.find((p) => p.id === s.winner);
  const ranking = useMemo(
    () => [...s.players].sort((a, b) => (a.bankrupt - b.bankrupt) || R.netWorth(s, b.id) - R.netWorth(s, a.id)),
    [s],
  );

  useEffect(() => {
    const colors = ['#ff9f1c', '#ffd23f', '#e5007d', '#13c2b3', '#ffffff'];
    let stop = false;
    const end = Date.now() + 4000;
    (function frame() {
      if (stop) return;
      confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    const fw = setInterval(() => {
      confetti({ particleCount: 70, spread: 360, startVelocity: 28, ticks: 120, origin: { x: Math.random(), y: Math.random() * 0.4 + 0.1 }, colors, gravity: 0.6 });
    }, 900);
    const t = setTimeout(() => clearInterval(fw), 6500);
    return () => { stop = true; clearInterval(fw); clearTimeout(t); };
  }, []);

  if (!winner) return null;
  const line = winner.isAi ? botById(winner.botId).lines.collect : 'Sabse bada seth: the biggest tycoon at the table!';
  return (
    <div className="victory">
      <div className="victory-card">
        <Rangoli className="victory-rangoli" />
        <div className="victory-kicker">{s.winReason === 'rounds' ? 'Richest after the final round' : 'Last tycoon standing'}</div>
        <Logo size="md" />
        <div className="victory-champ">
          <span className="victory-crown">👑</span>
          <PlayerAvatar player={winner} className="xl" />
        </div>
        <h2 className="victory-name">{winner.name}</h2>
        <div className="victory-title">Nonopoly Champion</div>
        <p className="victory-line">“{line}”</p>
        <ol className="standings">
          {ranking.map((p, i) => (
            <li key={p.id} className={p.bankrupt ? 'out' : ''} style={{ '--pc': p.color }}>
              <span className="rank">{i + 1}</span>
              <PlayerAvatar player={p} className="xs" />
              <span className="st-name">{p.name}</span>
              <span className="st-worth">{p.bankrupt ? 'Diwaliya' : rupees(R.netWorth(s, p.id))}</span>
            </li>
          ))}
        </ol>
        <div className="dock-row">
          <button className="btn btn-lg" onClick={onReplay}>Play again</button>
          <button className="btn btn-ghost" onClick={onHome}>Home</button>
        </div>
      </div>
    </div>
  );
}
