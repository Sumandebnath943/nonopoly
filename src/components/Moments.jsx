import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TILES, GROUPS } from '../data/board';
import { botById } from '../data/characters';
import { TileArt, RaidSiren, BuildingIcon } from '../art/tileArt';
import { Gullak } from '../art/decor';
import { PlayerAvatar } from '../art/characters';
import { game } from '../game/engine';
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
    confetti({ particleCount: 55, spread: 75, startVelocity: 36, origin: { y: 0.6 }, colors: FESTIVE, scalar: 0.9 });
  } else if (kind === 'monopoly' || kind === 'haveli' || kind === 'takeover') {
    const end = Date.now() + 900;
    const colors = [color || '#ffd23f', '#ffd23f', '#ffffff', '#ff4fa3'];
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.72 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.72 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  } else if (kind === 'jackpot') {
    const shape = rupee();
    confetti({ particleCount: 85, spread: 100, startVelocity: 42, origin: { y: 0.55 }, colors: ['#ffd23f', '#f5b800', '#1aa85a'], ...(shape ? { shapes: [shape, 'circle'], scalar: 1.5 } : {}) });
  } else if (kind === 'bigrent') {
    const shape = rupee();
    confetti({ particleCount: 45, spread: 70, origin: { y: 0.55 }, colors: ['#1aa85a', '#ffd23f'], ...(shape ? { shapes: [shape], scalar: 1.5 } : {}) });
  }
}

export default function Moments({ s }) {
  const m = s.moment;
  const player = m ? s.players.find((p) => p.id === m.pid) : null;
  const other = m?.to ? s.players.find((p) => p.id === m.to) : null;
  const botPersona = player?.botId ? botById(player.botId) : null;

  useEffect(() => {
    if (!m) return;
    burst(m.kind, m.group ? GROUPS[m.group].color : player?.color);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m?.id]);

  if (!m) return null;

  const skip = () => game.skipMoment();

  if (m.kind === 'sold') {
    const tile = TILES[m.tileId];
    return (
      <div className="moment moment-sold cutscene-wrap" key={m.id} style={{ '--pc': player?.color }} onClick={skip}>
        <div className="cutscene-speedlines" />
        <div className="mo-card">
          <div className="mo-card-band" style={{ background: GROUPS[tile.group]?.color || '#e5007d' }}>
            <span>{tile.city}</span>
          </div>
          <TileArt id={tile.id} className="mo-card-art" />
          <div className="mo-card-name">{tile.name}</div>
          <div className="mo-card-price">{rupees(m.amount)}</div>
          <div className="stamp">{m.auction ? 'NEELAAM!' : 'KABZA!'}</div>
        </div>
        <div className="mo-caption">
          <PlayerAvatar player={player} className="md" />
          <div>
            <div className="mo-cap-main"><b>{player?.name}</b> {m.auction ? 'wins the auction' : 'acquires the deed'}!</div>
            {botPersona && <div className="mo-cap-quote">“{botPersona.lines.buy}”</div>}
          </div>
        </div>
        <span className="cutscene-skip">Tap anywhere to continue</span>
      </div>
    );
  }

  if (m.kind === 'haveli') {
    const tile = TILES[m.tileId];
    const g = GROUPS[tile.group];
    return (
      <div className="moment moment-haveli cutscene-wrap" key={m.id} style={{ '--g': g?.color || '#ffd34d', '--pc': player?.color }} onClick={skip}>
        <div className="rays gold" />
        <div className="cutscene-banner">
          <div className="cs-kicker">🏰 SHAHI NIRMAAN · MEGA LANDMARK</div>
          <div className="mo-big">ROYAL HAVELI!</div>
          <div className="cs-hero-row">
            <PlayerAvatar player={player} className="xl" />
            <div className="cs-vs-badge">★</div>
            <div className="cs-haveli-showcase">
              <TileArt id={tile.id} className="cs-tile-art" />
              <BuildingIcon haveli className="cs-haveli-icon" />
            </div>
          </div>
          <div className="mo-sub">
            <b>{player?.name}</b> erected a 5-Star Royal Haveli on <b>{tile.name}</b>!
          </div>
          <div className="mo-note">Maximum Rent: {rupees(tile.rent[5])} per visit!</div>
        </div>
        <span className="cutscene-skip">Tap anywhere to continue</span>
      </div>
    );
  }

  if (m.kind === 'monopoly') {
    const g = GROUPS[m.group];
    return (
      <div className="moment moment-monopoly cutscene-wrap" key={m.id} style={{ '--g': g.color, '--pc': player?.color }} onClick={skip}>
        <div className="rays" />
        <div className="cutscene-banner">
          <div className="cs-kicker">👑 SHAHENSHAH OF THE SECTOR</div>
          <div className="mo-big">MONOPOLY!</div>
          <div className="cs-hero-row">
            <PlayerAvatar player={player} className="xl" />
            <div className="mo-tiles">
              {g.ids.map((id) => (
                <div key={id} className="mo-mini-card">
                  <TileArt id={id} className="mo-mini" />
                  <span>{TILES[id].short}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mo-sub"><b>{player?.name}</b> controls all of <b>{g.name}</b>!</div>
          <div className="mo-note">
            {m.group === 'transport' || m.group === 'utility'
              ? '⚡ Peak Network Rent Unlocked!'
              : '🔥 Base Rents DOUBLE · Showrooms, Mega Malls & Havelis Unlocked!'}
          </div>
        </div>
        <span className="cutscene-skip">Tap anywhere to continue</span>
      </div>
    );
  }

  if (m.kind === 'takeover') {
    const tile = TILES[m.tileId];
    return (
      <div className="moment moment-takeover cutscene-wrap" key={m.id} style={{ '--pc': player?.color }} onClick={skip}>
        <div className="rays gold" />
        <div className="cutscene-banner">
          <div className="cs-kicker">🏴‍☠️ CORPORATE RAID · FORCED BUYOUT</div>
          <div className="mo-big">HOSTILE TAKEOVER!</div>
          <div className="mo-transfer">
            <div className="cs-combatant">
              <PlayerAvatar player={player} className="xl" />
              <b>{player?.name}</b>
              <small className="gain">NEELAM / KABZA</small>
            </div>
            <div className="cs-clash-mid">
              <TileArt id={tile.id} className="cs-clash-tile" />
              <span className="mo-amount">{rupees(m.amount)}</span>
              <span className="cs-bolt">⚡</span>
            </div>
            <div className="cs-combatant">
              <PlayerAvatar player={other} className="xl" />
              <b>{other?.name}</b>
              <small className="loss">OUSTED OWNER</small>
            </div>
          </div>
          <div className="mo-sub">
            <b>{player?.name}</b> forcibly bought out <b>{tile.name}</b> from <b>{other?.name}</b>!
          </div>
        </div>
        <span className="cutscene-skip">Tap anywhere to continue</span>
      </div>
    );
  }

  if (m.kind === 'raid') {
    const speeding = m.reason === 'speeding';
    return (
      <div className="moment moment-raid cutscene-wrap" key={m.id} onClick={skip}>
        <div className="siren-flash" />
        <div className="newspaper">
          <div className="np-mast">THE NONOPOLY TIMES <span>· Special Crime Bulletin ·</span></div>
          <div className="np-breaking">🚨 BREAKING NEWS 🚨</div>
          <div className="np-headline">{speeding ? '3 DOUBLES! OVERSPEEDING!' : 'ED RAID AT MIDNIGHT!'}</div>
          <div className="np-row">
            <svg viewBox="0 0 64 64" className="np-siren" aria-hidden="true"><RaidSiren /></svg>
            <div className="np-copy">
              <b>{player?.name}</b> {speeding ? 'rolled three doubles in a row and crashed through the Nakabandi!' : 'was caught with unaccounted cash stuffed in the false ceiling!'} Sent straight to <b>Tihar Jail</b>.
            </div>
            <div className="jail-mugshot">
              <PlayerAvatar player={player} className="lg jailed-av" />
              <div className="jail-bars-overlay" />
            </div>
          </div>
        </div>
        <span className="cutscene-skip">Tap anywhere to continue</span>
      </div>
    );
  }

  if (m.kind === 'jackpot') {
    return (
      <div className="moment moment-jackpot cutscene-wrap" key={m.id} onClick={skip}>
        <div className="rays gold" />
        <div className="cutscene-banner">
          <div className="cs-kicker">☕ CHAI BREAK BONANZA</div>
          <Gullak className="mo-gullak" />
          <div className="mo-big">GULLAK JACKPOT!</div>
          <div className="mo-amount">+{rupees(m.amount)}</div>
          <div className="cs-hero-row">
            <PlayerAvatar player={player} className="lg" />
            <div className="mo-sub"><b>{player?.name}</b> smashed open the Jugaad Gullak!</div>
          </div>
        </div>
        <span className="cutscene-skip">Tap anywhere to continue</span>
      </div>
    );
  }

  if (m.kind === 'bankrupt') {
    return (
      <div className="moment moment-bankrupt cutscene-wrap" key={m.id} onClick={skip}>
        <div className="cutscene-banner">
          <div className="cs-kicker">💀 EMPIRE COLLAPSED</div>
          <div className="mo-av-wrap">
            <PlayerAvatar player={player} className="xl" />
            <span className="mo-x">✕</span>
          </div>
          <div className="mo-big crack">DIWALIYA!</div>
          <div className="mo-sub">
            <b>{player?.name}</b> is officially bankrupt{other ? <> — <b>{other.name}</b> seizes the entire empire!</> : '! All deeds return to the market.'}
          </div>
        </div>
        <span className="cutscene-skip">Tap anywhere to continue</span>
      </div>
    );
  }

  if (m.kind === 'bigrent') {
    const tile = TILES[m.tileId];
    return (
      <div className="moment moment-bigrent cutscene-wrap" key={m.id} onClick={skip}>
        <div className="cutscene-speedlines" />
        <div className="cutscene-banner">
          <div className="cs-kicker">💸 MEGA LAGAAN · HIGH-STAKES KIRAYA</div>
          <div className="mo-big">BHAARI KIRAYA!</div>
          <div className="mo-transfer">
            <div className="cs-combatant">
              <PlayerAvatar player={player} className="xl" />
              <b>{player?.name}</b>
              <small className="loss">−{rupees(m.amount)}</small>
            </div>
            <span className="mo-arrow">
              <TileArt id={tile.id} className="cs-clash-tile" />
              <span className="mo-amount">{rupees(m.amount)}</span>
              <span className="mo-flow">💸 ➜</span>
            </span>
            <div className="cs-combatant">
              <PlayerAvatar player={other} className="xl" />
              <b>{other?.name}</b>
              <small className="gain">+{rupees(m.amount)}</small>
            </div>
          </div>
          <div className="mo-sub">Massive rent paid at <b>{tile.name}</b> ({tile.city})!</div>
        </div>
        <span className="cutscene-skip">Tap anywhere to continue</span>
      </div>
    );
  }

  return null;
}
