import { TILES, GROUPS, BUILDINGS, JAIL_FINE } from '../data/board';
import { botById } from '../data/characters';
import { Rangoli, Gullak, Logo } from '../art/decor';
import { Parrot, Aunty, Svg } from '../art/tileArt';
import { PlayerAvatar } from '../art/characters';
import { game } from '../game/engine';
import { liquidationValue } from '../game/rules';
import { rupees, rupeesShort } from '../utils/format';
import Dice from './Dice';
import { DeedCard, Rupees } from './ui';

const TOAST_ICON = {
  shagun: '🪔', double: '🎲', tax: '🧾', rent: '💸', chai: '☕', info: '📜', free: '🔓', jail: '⛓️', haveli: '🏰', trade: '🤝', chat: '💬',
};

function effectLabel(action) {
  switch (action.type) {
    case 'gain': return { text: `+${rupees(action.amount)}`, tone: 'gain' };
    case 'pay': return { text: `−${rupees(action.amount)}`, tone: 'loss' };
    case 'kitty': return { text: `−${rupees(action.amount)} into the Gullak`, tone: 'loss' };
    case 'collectAll': return { text: `+${rupees(action.amount)} from every player`, tone: 'gain' };
    case 'payAll': return { text: `−${rupees(action.amount)} to every player`, tone: 'loss' };
    case 'bail': return { text: 'Bail Pass: keep it!', tone: 'gain' };
    case 'jail': return { text: 'Go straight to Tihar', tone: 'loss' };
    case 'goto': return { text: `Move to ${TILES[action.tile].short}`, tone: 'info' };
    case 'back': return { text: `Go back ${action.steps} spaces`, tone: 'info' };
    case 'nearestTransport': return { text: 'Next Rail & Metro · double rent', tone: 'info' };
    case 'repairs': return { text: `${rupeesShort(action.perLevel)}/building · ${rupeesShort(action.perHaveli)}/Haveli`, tone: 'loss' };
    default: return { text: '', tone: 'info' };
  }
}

function Deck({ type }) {
  return (
    <div className={`deck deck-${type}`} aria-hidden="true">
      <span className="deck-card d3" />
      <span className="deck-card d2" />
      <span className="deck-card d1">
        <Svg className="deck-art">{type === 'kismet' ? <Parrot /> : <Aunty />}</Svg>
        <span className="deck-name">{type === 'kismet' ? 'Kismet' : 'Rishtedaar'}</span>
      </span>
    </div>
  );
}

function Toasts({ toasts, players }) {
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => {
        const p = players.find((x) => x.id === t.pid);
        return (
          <div key={t.id} className={`toast toast-${t.tone}`} style={{ '--pc': p?.color || '#ffd34d' }}>
            <span className="toast-icon">{t.icon || TOAST_ICON[t.kind] || '✨'}</span>
            <span className="toast-text">
              <b>{t.title}</b>
              {t.sub && <small>{t.sub}</small>}
            </span>
            {t.amount ? <span className={`toast-amt ${t.amount > 0 ? 'gain' : 'loss'}`}>{t.amount > 0 ? '+' : '−'}{rupeesShort(Math.abs(t.amount))}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

function CardReveal({ card, prompt, players }) {
  const p = players.find((x) => x.id === card.pid);
  const eff = effectLabel(card.card.action);
  const mine = prompt?.type === 'card' && prompt.pid === card.pid && game.isControllableByMe(card.pid);
  return (
    <div className="card-stage">
      <div className={`fcard fcard-${card.deck}`} key={card.id}>
        <div className="fcard-inner">
          <div className="fcard-face fcard-back">
            <Svg className="fcard-back-art">{card.deck === 'kismet' ? <Parrot /> : <Aunty />}</Svg>
            <span>{card.deck === 'kismet' ? 'Kismet' : 'Rishtedaar'}</span>
          </div>
          <div className="fcard-face fcard-front">
            <div className="fcard-head">
              <Svg className="fcard-head-art">{card.deck === 'kismet' ? <Parrot /> : <Aunty />}</Svg>
              <span>{card.deck === 'kismet' ? 'Kismet · Tota-wala Jyotish' : 'Rishtedaar · Family Surprise'}</span>
            </div>
            <div className="fcard-icon">{card.card.icon}</div>
            <div className="fcard-title">{card.card.title}</div>
            <p className="fcard-text">{card.card.text}</p>
            <div className={`fcard-effect ${eff.tone}`}>{eff.text}</div>
            {mine ? (
              <button className="btn btn-sm fcard-ok" onClick={() => game.respond('ok', prompt.id)} autoFocus>
                Theek hai!
              </button>
            ) : (
              <div className="fcard-who">{p?.name} drew this card</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuctionPanel({ auction, prompt, players }) {
  const tile = TILES[auction.tileId];
  const leader = players.find((p) => p.id === auction.leaderId);
  const bidder = players.find((p) => p.id === auction.bidderId);
  const myBid = prompt?.type === 'bid' && game.isControllableByMe(prompt.pid) ? prompt : null;
  const me = myBid ? players.find((p) => p.id === myBid.pid) : null;
  const steps = myBid ? [1, 3, 6].map((k) => myBid.high + myBid.inc * k).filter((v, i) => i === 0 || v <= me.cash) : [];
  return (
    <div className="auction">
      <div className="auction-head">
        <span className="gavel">🔨</span>
        <div>
          <div className="auction-kicker">Neelaami · Live Auction</div>
          <div className="auction-tile">{tile.name}</div>
        </div>
      </div>
      <div className="auction-bid">
        <div className="auction-label">{auction.done ? (leader ? 'Sold for' : 'No bids') : 'Highest bid'}</div>
        <div className="auction-amount" key={auction.high}>{auction.high ? rupees(auction.high) : '—'}</div>
        <div className="auction-leader">
          {leader ? <><PlayerAvatar player={leader} className="xs" /> {leader.name}</> : <span className="dim">List price {rupees(tile.price)}</span>}
        </div>
      </div>
      <div className="auction-bidders">
        {players.filter((p) => !p.bankrupt).map((p) => (
          <span key={p.id} className={`ab ${auction.passed.includes(p.id) ? 'passed' : ''} ${p.id === auction.bidderId ? 'now' : ''} ${p.id === auction.leaderId ? 'lead' : ''}`}>
            <PlayerAvatar player={p} className="xs" />
          </span>
        ))}
      </div>
      {myBid ? (
        <div className="auction-actions">
          <div className="auction-you">{me.name}, your bid · cash {rupeesShort(me.cash)}</div>
          <div className="auction-btns">
            {steps.map((v) => (
              <button key={v} className="btn btn-sm btn-green" disabled={v > me.cash} onClick={() => game.respond(v, myBid.id)}>
                {rupeesShort(v)}
              </button>
            ))}
            <button className="btn btn-sm btn-red" onClick={() => game.respond('pass', myBid.id)}>Pass</button>
          </div>
        </div>
      ) : (
        <div className="auction-status">
          {auction.done ? (leader ? `🎉 Sold to ${leader.name}!` : 'Nobody bid. It stays with the bank.') : bidder ? <>{bidder.name} is bidding<span className="dots" /></> : 'Going once…'}
        </div>
      )}
    </div>
  );
}

function Dock({ s, onTrade, onOpenDeed }) {
  const current = s.players[s.turn];
  const prompt = s.prompt;
  const pp = prompt ? s.players.find((p) => p.id === prompt.pid) : null;
  const speech = s.speech && s.players.find((p) => p.id === s.speech.pid);

  if (!current) return null;

  if (prompt && pp && game.isControllableByMe(pp.id)) {
    const respond = (v) => game.respond(v, prompt.id);
    if (prompt.type === 'roll') {
      return (
        <div className="dock">
          <TurnLabel player={pp} text={s.doubles > 0 ? 'Doubles! Bonus roll' : 'Tap dice or Roll'} />
          <button className="btn btn-xl roll-btn" onClick={() => respond('roll')} autoFocus>
            <span className="roll-ico">🎲</span> {s.doubles > 0 ? 'Roll Again' : 'Roll Dice'}
          </button>
          <button className="link-btn" onClick={onTrade}>🤝 Propose Trade · Build in <b>Empire</b></button>
        </div>
      );
    }
    if (prompt.type === 'jail') {
      return (
        <div className="dock">
          <TurnLabel player={pp} text={`In Tihar · attempt ${pp.jailTurns + 1} of 3`} />
          <div className="dock-row">
            <button className="btn btn-sm btn-teal" onClick={() => respond('roll')}>🎲 Roll doubles</button>
            <button className="btn btn-sm" disabled={pp.cash < JAIL_FINE} onClick={() => respond('pay')}>Pay {rupeesShort(JAIL_FINE)} bail</button>
            {pp.jailCards > 0 && <button className="btn btn-sm btn-pink" onClick={() => respond('card')}>📜 Use Bail Pass</button>}
          </div>
        </div>
      );
    }
    if (prompt.type === 'buy') {
      const tile = TILES[prompt.tileId];
      const afford = pp.cash >= tile.price;
      return (
        <div className="dock dock-buy">
          <div className="dock-ask" style={{ '--pc': pp.color }}>{pp.name}, buy this landmark?</div>
          <button className="dock-deed" onClick={() => onOpenDeed(tile.id)} title="See full deed">
            <DeedCard tileId={tile.id} boomGroup={s.boomGroup} compact />
          </button>
          <div className="dock-row">
            <button className="btn btn-green" disabled={!afford} onClick={() => respond('buy')} autoFocus>
              Buy · {rupeesShort(tile.price)}
            </button>
            <button className="btn btn-plum" onClick={() => respond('auction')}>🔨 Auction</button>
          </div>
          {!afford && <div className="dock-hint">Not enough cash. Mortgage from Empire, or send to Auction.</div>}
        </div>
      );
    }
    if (prompt.type === 'upgrade') {
      const tile = TILES[prompt.tileId];
      const bName = BUILDINGS[prompt.nextLevel]?.name || 'Building';
      const newRent = tile.rent[prompt.nextLevel];
      return (
        <div className="dock dock-buy">
          <div className="dock-ask" style={{ '--pc': pp.color }}>🏗️ Landed on your {tile.short}! Upgrade it?</div>
          <div className="dock-hint">
            Build a <b>{bName}</b> right now — rent jumps to <b>{rupeesShort(newRent)}</b>!
          </div>
          <div className="dock-row">
            <button className="btn btn-green" onClick={() => respond('upgrade')} autoFocus>
              🏗️ Build {bName} · {rupeesShort(prompt.cost)}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => respond('pass')}>Skip</button>
          </div>
        </div>
      );
    }
    if (prompt.type === 'takeover') {
      const tile = TILES[prompt.tileId];
      const owner = s.players.find((p) => p.id === prompt.ownerId);
      return (
        <div className="dock dock-buy dock-takeover">
          <div className="dock-ask" style={{ '--pc': pp.color }}>
            🏴‍☠️ {prompt.completesMine ? 'Complete Your Monopoly!' : 'Hostile Takeover Opportunity!'}
          </div>
          <div className="dock-hint">
            Buy out <b>{tile.name}</b> from <b>{owner?.name}</b> for <b>{rupees(prompt.cost)}</b>!
            {prompt.completesMine && ' (Unlocks full colour set & Havelis!)'}
          </div>
          <div className="dock-row">
            <button className="btn btn-pink" onClick={() => respond('takeover')} autoFocus>
              🏴‍☠️ Takeover · {rupeesShort(prompt.cost)}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => respond('pass')}>Pass</button>
          </div>
        </div>
      );
    }
    if (prompt.type === 'end') {
      return (
        <div className="dock">
          <TurnLabel player={pp} text="Build, trade, or finish turn" />
          <div className="dock-row">
            <button className="btn btn-lg btn-pink" onClick={() => respond('end')} autoFocus>End Turn ➜</button>
          </div>
          <button className="link-btn" onClick={onTrade}>🤝 Open Sauda Bazaar (Trade)</button>
        </div>
      );
    }
    if (prompt.type === 'debt') {
      const canRaise = pp.cash + liquidationValue(s, pp.id) >= prompt.amount;
      const creditor = s.players.find((p) => p.id === prompt.creditor);
      return (
        <div className="dock dock-debt">
          <div className="debt-title">Udhaar! You owe {rupees(prompt.amount)}</div>
          <div className="dock-hint">
            {prompt.reason}{creditor ? ` → ${creditor.name}` : ''}. You have {rupees(pp.cash)}. Sell buildings or mortgage from your Empire.
          </div>
          <div className="dock-row">
            <button className="btn btn-sm btn-green" disabled={pp.cash < prompt.amount} onClick={() => respond('pay')}>Pay now</button>
            <button className="btn btn-sm" disabled={!canRaise} onClick={() => respond('auto')}>Auto-raise cash</button>
            <button className="btn btn-sm btn-red" onClick={() => respond('bankrupt')}>Go bankrupt</button>
          </div>
        </div>
      );
    }
  }

  // Watching an Online Friend's turn or Bot turn
  const activeActor = pp || current;
  const busy = s.rolling
    ? 'Shaking the dice'
    : s.moving
      ? 'Cruising across India'
      : s.thinking
        ? 'Plotting next move'
        : prompt?.type === 'buy'
          ? `Inspecting ${TILES[prompt.tileId]?.short}`
          : prompt?.type === 'takeover'
            ? `Eyeing a takeover on ${TILES[prompt.tileId]?.short}`
            : prompt?.type === 'upgrade'
              ? `Upgrading ${TILES[prompt.tileId]?.short}`
              : prompt?.type === 'end'
                ? 'Managing Empire'
                : prompt?.type === 'roll'
                  ? 'Ready to roll'
                  : '';

  return (
    <div className="dock dock-watch">
      <TurnLabel
        player={activeActor}
        text={activeActor.isAi ? `${botById(activeActor.botId).title} · ${busy || 'Playing'}` : busy ? `${busy}…` : 'Online turn'}
      />
      {speech ? (
        <div className="speech" key={s.speech.id} style={{ '--pc': speech.color }}>
          <b>{speech.name}:</b> “{s.speech.text}”
        </div>
      ) : (
        <div className="watch-status">
          {busy}{busy && <span className="dots" />}
        </div>
      )}
      {s.online?.active && s.online?.isHost && !activeActor.isAi && !game.isControllableByMe(activeActor.id) && (
        <button className="link-btn" onClick={() => game.convertToBot(activeActor.id)} title="Switch AFK friend to AI Bot">
          🤖 Player offline? Switch {activeActor.name} to Bot
        </button>
      )}
    </div>
  );
}

function TurnLabel({ player, text }) {
  return (
    <div className="turn-label" style={{ '--pc': player.color }}>
      <PlayerAvatar player={player} className="sm" />
      <div>
        <div className="turn-name">{player.name}’s Turn</div>
        <div className="turn-sub">{text}</div>
      </div>
    </div>
  );
}

export default function BoardCenter({ s, onTrade, onOpenDeed }) {
  const max = s.config?.maxRounds;
  const canRoll = s.prompt?.type === 'roll' && game.isControllableByMe(s.prompt.pid);
  const boomGroup = s.boomGroup ? GROUPS[s.boomGroup] : null;
  const multTxt = s.bullRun ? '1.75×' : '1.5×';

  return (
    <div className={`center ${s.bullRun ? 'bull-run-active' : ''}`}>
      <Rangoli className="center-rangoli" />
      <Deck type="kismet" />
      <Deck type="rishtedaar" />
      <div className="center-top">
        <Logo size="md" className="center-logo" />
        <div className="center-badges-row">
          <span className="center-round">Round {s.round}{max ? ` / ${max}` : ''}</span>
          {boomGroup && (
            <span className="center-boom-pill" style={{ '--g': boomGroup.color }} title={`Bazaar Utsav: ${boomGroup.name} rents are ${multTxt} this round!`}>
              🔥 {boomGroup.name} {multTxt}
            </span>
          )}
          {s.bullRun && (
            <span className="center-bull-pill" title="Sensex Bull Run: Hostile Takeovers unlocked!">
              🐂 KABZA OPEN
            </span>
          )}
        </div>
      </div>
      <div className="center-mid">
        <Dice
          dice={s.dice}
          rollId={s.rollId}
          rolling={s.rolling}
          double={s.lastDouble}
          canRoll={canRoll}
          onRoll={() => canRoll && game.respond('roll', s.prompt.id)}
        />
        <Dock s={s} onTrade={onTrade} onOpenDeed={onOpenDeed} />
      </div>
      <div className="gullak-box" title="Jugaad Gullak: every tax and fine lands here. Land on Jugaad Junction to win it all!">
        <Gullak className="gullak-art" />
        <div>
          <div className="gullak-label">Jugaad Gullak</div>
          <Rupees value={s.kitty} className="gullak-amt" />
        </div>
      </div>
      <Toasts toasts={s.toasts} players={s.players} />
      {s.card && <CardReveal card={s.card} prompt={s.prompt} players={s.players} />}
      {s.auction && <AuctionPanel auction={s.auction} prompt={s.prompt} players={s.players} />}
    </div>
  );
}
