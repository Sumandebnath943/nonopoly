import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TILES, GROUPS } from '../data/board';
import { TileArt, RaidSiren } from '../art/tileArt';
import { Gullak } from '../art/decor';
import { PlayerAvatar } from '../art/characters';
import { rupees } from '../utils/format';

const FESTIVE = ['#ff9f1c', '#ffd23f', '#e5007d', '#13c2b3', '#1aa85a', '#ff4fa3', '#ffffff'];
let rupeeShape;
const rupee = () => {
  if (!rupeeShape) {
    try {
      rupeeShape = confetti.shapeFromText({ text: '₹', scalar: 2.2, color: '#1aa85a' });
    } catch {
      rupeeShape = null;
    }
  }
  return rupeeShape;
};

function burst(kind, color) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  if (kind === 'sold') {
    confetti({ particleCount: 70, spread: 75, startVelocity: 38, origin: { y: 0.6 }, colors: FESTIVE, scalar: 0.9 });
  } else if (kind === 'monopoly') {
    const end = Date.now() + 1100;
    const colors = [color, '#ffd23f', '#ffffff', '#ff4fa3'];
    (function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors });
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    setTimeout(() => confetti({ particleCount: 120, spread: 120, startVelocity: 45, origin: { y: 0.45 }, colors, ticks: 260 }), 350);
  } else if (kind === 'jackpot') {
    const shape = rupee();
    confetti({ particleCount: 90, spread: 100, startVelocity: 42, origin: { y: 0.55 }, colors: ['#ffd23f', '#f5b800', '#1aa85a'], ...(shape ? { shapes: [shape, 'circle'], scalar: 1.6 } : {}) });
    setTimeout(() => confetti({ particleCount: 60, spread: 140, origin: { y: 0.5 }, colors: ['#ffd23f', '#ff9f1c'], ...(shape ? { shapes: [shape], scalar: 1.8 } : {}) }), 400);
  } else if (kind === 'bigrent') {
    const shape = rupee();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.55 }, colors: ['#1aa85a', '#ffd23f'], ...(shape ? { shapes: [shape], scalar: 1.6 } : {}) });
  }
}

export default function Moments({ s }) {
  const m = s.moment;
  const player = m ? s.players.find((p) => p.id === m.pid) : null;
  const other = m?.to ? s.players.find((p) => p.id === m.to) : null;

  useEffect(() => {
    if (!m) return;
    burst(m.kind, m.group ? GROUPS[m.group].color : player?.color);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m?.id]);

  if (!m) return null;

  if (m.kind === 'sold') {
    const tile = TILES[m.tileId];
    return (
      <div className="moment moment-sold" key={m.id} style={{ '--pc': player?.color }}>
        <div className="mo-card">
          <div className="mo-card-band" style={{ background: GROUPS[tile.group]?.color }} />
          <TileArt id={tile.id} className="mo-card-art" />
          <div className="mo-card-name">{tile.name}</div>
          <div className="mo-card-city">{tile.city}</div>
          <div className="stamp">{m.auction ? 'NEELAAM!' : 'SOLD!'}</div>
        </div>
        <div className="mo-caption">
          <PlayerAvatar player={player} className="md" />
          <span><b>{player?.name}</b> {m.auction ? 'wins the auction' : 'buys it'} for <b>{rupees(m.amount)}</b></span>
        </div>
      </div>
    );
  }

  if (m.kind === 'monopoly') {
    const g = GROUPS[m.group];
    return (
      <div className="moment moment-monopoly" key={m.id} style={{ '--g': g.color }}>
        <div className="rays" />
        <div className="mo-crown">👑</div>
        <div className="mo-big">MONOPOLY!</div>
        <div className="mo-sub"><b>{player?.name}</b> owns all of <b>{g.name}</b></div>
        <div className="mo-tiles">
          {g.ids.map((id) => <TileArt key={id} id={id} className="mo-mini" />)}
        </div>
        <div className="mo-note">{m.group === 'transport' || m.group === 'utility' ? 'Maximum rent unlocked' : 'Rent doubles. Time to build Tapris!'}</div>
      </div>
    );
  }

  if (m.kind === 'raid') {
    const speeding = m.reason === 'speeding';
    return (
      <div className="moment moment-raid" key={m.id}>
        <div className="siren-flash" />
        <div className="newspaper">
          <div className="np-mast">THE NONOPOLY TIMES <span>· Special Edition ·</span></div>
          <div className="np-breaking">BREAKING NEWS</div>
          <div className="np-headline">{speeding ? 'OVERSPEEDING!' : 'ED RAID!'}</div>
          <div className="np-row">
            <svg viewBox="0 0 64 64" className="np-siren" aria-hidden="true"><RaidSiren /></svg>
            <div className="np-copy">
              <b>{player?.name}</b> {speeding ? 'rolled three doubles in a row and got pulled over.' : 'was caught with cash in the false ceiling.'} Straight to <b>Tihar Jail</b>. No Shagun on the way.
            </div>
            <PlayerAvatar player={player} className="md jailed-av" />
          </div>
        </div>
      </div>
    );
  }

  if (m.kind === 'jackpot') {
    return (
      <div className="moment moment-jackpot" key={m.id}>
        <div className="rays gold" />
        <Gullak className="mo-gullak" />
        <div className="mo-big">JACKPOT!</div>
        <div className="mo-amount">+{rupees(m.amount)}</div>
        <div className="mo-sub"><b>{player?.name}</b> smashed the Jugaad Gullak</div>
      </div>
    );
  }

  if (m.kind === 'bankrupt') {
    return (
      <div className="moment moment-bankrupt" key={m.id}>
        <div className="mo-av-wrap">
          <PlayerAvatar player={player} className="xl" />
          <span className="mo-x">✕</span>
        </div>
        <div className="mo-big crack">DIWALIYA!</div>
        <div className="mo-sub"><b>{player?.name}</b> is bankrupt{other ? <> and <b>{other.name}</b> takes it all</> : ''}.</div>
      </div>
    );
  }

  if (m.kind === 'bigrent') {
    const tile = TILES[m.tileId];
    return (
      <div className="moment moment-bigrent" key={m.id}>
        <div className="mo-big">BHAARI KIRAYA!</div>
        <div className="mo-transfer">
          <PlayerAvatar player={player} className="lg" />
          <span className="mo-arrow">
            <span className="mo-amount">{rupees(m.amount)}</span>
            <span className="mo-flow">➜</span>
          </span>
          <PlayerAvatar player={other} className="lg" />
        </div>
        <div className="mo-sub">Rent for <b>{tile.name}</b></div>
      </div>
    );
  }

  return null;
}
