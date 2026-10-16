import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { TILES, GROUPS, tilePlacement, tileCenterPct, JAIL_TILE } from '../data/board';
import { TileArt, BuildingIcon } from '../art/tileArt';
import { TokenArt, BotPortrait } from '../art/characters';
import { ownsGroup, rentFor } from '../game/rules';
import { rupeesShort } from '../utils/format';

const SPECIAL_BAND = { chance: '#169c46', community: '#e5007d', tax: '#c91838' };

function Buildings({ level }) {
  if (!level) return null;
  if (level === 5) return <BuildingIcon haveli className="bld bld-haveli" />;
  return Array.from({ length: level }, (_, i) => <BuildingIcon key={i} className="bld" />);
}

const Tile = memo(function Tile({ tile, deed, owner, isMonopoly, currentRent, landed, isBoom, onTileClick, kitty, builtKey }) {
  const place = tilePlacement(tile.id);
  const group = tile.group ? GROUPS[tile.group] : null;
  const style = {
    gridRow: place.row + 1,
    gridColumn: place.col + 1,
    '--g': group?.color || SPECIAL_BAND[tile.type],
    '--gt': group?.text || '#fff',
    '--oc': owner?.color,
  };
  const label = `${tile.name}${tile.price ? `, ${rupeesShort(tile.price)}` : ''}${owner ? `, owned by ${owner.name}` : ''}`;
  const click = onTileClick ? () => onTileClick(tile.id) : undefined;

  if (tile.type === 'corner') {
    return (
      <button type="button" className={`tile corner corner-${tile.corner} ${landed ? 'landed' : ''}`} style={style} onClick={click} aria-label={tile.name}>
        <CornerContent tile={tile} kitty={kitty} />
      </button>
    );
  }

  const cls = [
    'tile',
    `side-${place.side}`,
    `type-${tile.type}`,
    group ? 'has-group' : 'special',
    owner ? 'owned' : '',
    isMonopoly ? 'monopoly-tile' : '',
    deed?.mortgaged ? 'mortgaged' : '',
    landed ? 'landed' : '',
    isBoom ? 'boom-tile' : '',
  ].filter(Boolean).join(' ');

  return (
    <button type="button" className={cls} style={style} onClick={click} aria-label={label}>
      <span className="tile-band">
        <span key={builtKey} className={`tile-blds ${builtKey ? 'just-built' : ''}`}>
          <Buildings level={deed?.level} />
        </span>
        {isMonopoly && !deed?.level && <span className="mono-crown" title="Monopoly! 2× Base Rent">👑</span>}
        {isBoom && !deed?.level && <span className="boom-dot" title="Bazaar Utsav Boom City!">🔥</span>}
      </span>
      <span className="tile-body">
        <span className="tile-name">{tile.short}</span>
        <span className="tile-mid">
          <TileArt id={tile.id} className="tile-art" />
          <span className="tile-foot">
            {owner ? (
              <span className="owner-badge-row" title={`Owned by ${owner.name} · Rent ${rupeesShort(currentRent)}`}>
                <span className="owner-chip">
                  {owner.botId ? <BotPortrait id={owner.botId} /> : <TokenArt id={owner.tokenId} />}
                </span>
                {!deed?.mortgaged && currentRent > 0 && (
                  <span className="tile-rent-tag">{rupeesShort(currentRent)}</span>
                )}
              </span>
            ) : tile.price ? (
              <span className="tile-price">{rupeesShort(tile.price)}</span>
            ) : tile.amount ? (
              <span className="tile-price tax">−{rupeesShort(tile.amount)}</span>
            ) : null}
          </span>
        </span>
      </span>
      {deed?.mortgaged && <span className="girvi">GIRVI</span>}
    </button>
  );
});

function CornerContent({ tile, kitty }) {
  if (tile.corner === 'start') {
    return (
      <span className="corner-inner">
        <span className="corner-kicker">Shubh Aarambh</span>
        <TileArt id={0} className="corner-art" />
        <span className="corner-title">START</span>
        <span className="corner-sub">+₹2L · ₹3L Exact</span>
        <svg className="start-arrow" viewBox="0 0 100 24" aria-hidden="true">
          <path d="M96 12 H18 M30 2 L16 12 L30 22" fill="none" stroke="#2b0838" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M96 12 H18 M30 2 L16 12 L30 22" fill="none" stroke="#e5007d" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (tile.corner === 'jail') {
    return (
      <span className="corner-inner jail-layout">
        <span className="jail-cell">
          <TileArt id={10} className="corner-art" />
          <span className="corner-title sm">Tihar Jail</span>
        </span>
        <span className="visit visit-left">Just</span>
        <span className="visit visit-bottom">Visiting</span>
      </span>
    );
  }
  if (tile.corner === 'parking') {
    return (
      <span className="corner-inner">
        <span className="corner-kicker">Chai Jackpot</span>
        <TileArt id={20} className="corner-art" />
        <span className="corner-title">Jugaad</span>
        <span className="corner-sub kitty">☕ {rupeesShort(kitty)}</span>
      </span>
    );
  }
  return (
    <span className="corner-inner">
      <span className="corner-kicker">Enforcement</span>
      <TileArt id={30} className="corner-art" />
      <span className="corner-title">ED Raid!</span>
      <span className="corner-sub">Straight to Tihar</span>
    </span>
  );
}

// ---------- pawns ----------
const STACK = {
  1: [[0, 0]],
  2: [[-1, 0], [1, 0]],
  3: [[-1, 0.55], [1, 0.55], [0, -0.95]],
  4: [[-1.05, -0.85], [1.05, -0.85], [-1.05, 0.95], [1.05, 0.95]],
  5: [[-1.4, -0.85], [0, -0.85], [1.4, -0.85], [-0.8, 0.95], [0.8, 0.95]],
  6: [[-1.45, -0.85], [0, -0.85], [1.45, -0.85], [-1.45, 0.95], [0, 0.95], [1.45, 0.95]],
};

function pawnSpot(player, players) {
  const inCell = player.pos === JAIL_TILE && player.inJail;
  const mates = players.filter((p) => !p.bankrupt && p.pos === player.pos && (p.pos !== JAIL_TILE || p.inJail === player.inJail));
  const idx = mates.findIndex((p) => p.id === player.id);
  const offsets = STACK[Math.min(mates.length, 6)] || STACK[1];
  const [ox, oy] = offsets[idx] || [0, 0];
  let { x, y } = tileCenterPct(player.pos);
  if (player.pos === JAIL_TILE) {
    if (inCell) { x += 1.7; y -= 1.7; } else { x -= 4.4; y += 4.4; }
  }
  const spread = mates.length > 1 ? 1.95 : 0;
  return { x: x + ox * spread, y: y + oy * spread, crowded: mates.length >= 3 };
}

function Pawn({ player, players, active, moving }) {
  const ref = useRef(null);
  const prevPos = useRef(player.pos);
  const { x, y, crowded } = pawnSpot(player, players);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prevPos.current === player.pos) return;
    const dist = Math.min((player.pos - prevPos.current + 40) % 40, (prevPos.current - player.pos + 40) % 40);
    prevPos.current = player.pos;
    const jump = dist > 2;
    el.style.setProperty('--dur', jump ? '0.68s' : '0.19s');
    el.querySelector('.pawn-body')?.animate(
      jump
        ? [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-150%) scale(1.25)' }, { transform: 'translateY(0) scale(1)' }]
        : [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(-55%) scale(.92,1.12)' }, { transform: 'translateY(0) scale(1.12,.9)' }, { transform: 'translateY(0) scale(1,1)' }],
      { duration: jump ? 680 : 190, easing: 'ease-out' },
    );
  }, [player.pos]);

  return (
    <div
      ref={ref}
      className={`pawn ${active ? 'active' : ''} ${moving ? 'moving' : ''} ${player.inJail ? 'jailed' : ''} ${crowded ? 'crowded' : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, '--pc': player.color }}
      title={player.name}
    >
      <span className="pawn-shadow" />
      <span className="pawn-body">
        <TokenArt id={player.tokenId} className="pawn-art" />
      </span>
      <span className="pawn-name-tag">{player.name.split(' ')[0]}</span>
    </div>
  );
}

export default function Board({ deeds, players, landed, activeId, movingId, boomGroup, bullRun = false, onTileClick, children, kitty = 0, built, className = '' }) {
  const owners = Object.fromEntries(players.map((p) => [p.id, p]));
  const rootRef = useRef(null);
  const fakeState = { deeds, players, boomGroup, bullRun };

  useEffect(() => {
    if (!built || !rootRef.current) return;
    rootRef.current.animate(
      [{ transform: 'translate(0,0)' }, { transform: 'translate(0,2px)' }, { transform: 'translate(0,-1px)' }, { transform: 'translate(0,0)' }],
      { duration: 240 },
    );
  }, [built]);

  return (
    <div className={`board ${className}`} ref={rootRef}>
      <div className="board-frame">
        <span className="board-corner-jewel tl" aria-hidden="true" />
        <span className="board-corner-jewel tr" aria-hidden="true" />
        <span className="board-corner-jewel bl" aria-hidden="true" />
        <span className="board-corner-jewel br" aria-hidden="true" />
        <div className="board-grid">
          {TILES.map((t) => {
            const d = deeds[t.id];
            const owner = d?.owner ? owners[d.owner] : null;
            const isMono = !!(owner && t.group && ownsGroup(fakeState, t.group, owner.id));
            const curRent = owner && !d?.mortgaged ? rentFor(fakeState, t.id, 7) : 0;
            return (
              <Tile
                key={t.id}
                tile={t}
                deed={d}
                owner={owner}
                isMonopoly={isMono}
                currentRent={curRent}
                landed={landed === t.id}
                isBoom={!!boomGroup && t.group === boomGroup}
                onTileClick={onTileClick}
                kitty={t.corner === 'parking' ? kitty : undefined}
                builtKey={built?.id === t.id ? built.n : undefined}
              />
            );
          })}
          <div className="board-center">{children}</div>
          <div className="pawn-layer">
            {players.filter((p) => !p.bankrupt).map((p) => (
              <Pawn key={p.id} player={p} players={players} active={p.id === activeId} moving={p.id === movingId} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
