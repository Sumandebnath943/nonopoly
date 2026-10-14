import { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { TILES, GROUPS, tilePlacement, tileCenterPct, JAIL_TILE } from '../data/board';
import { TileArt, BuildingIcon } from '../art/tileArt';
import { TokenArt } from '../art/characters';
import { rupeesShort } from '../utils/format';

const SPECIAL_BAND = { chance: '#1f9e48', community: '#e5007d', tax: '#8f1830' };

function Buildings({ level }) {
  if (!level) return null;
  if (level === 5) return <BuildingIcon haveli className="bld bld-haveli" />;
  return Array.from({ length: level }, (_, i) => <BuildingIcon key={i} className="bld" />);
}

const Tile = memo(function Tile({ tile, deed, owner, landed, onTileClick, kitty, builtKey }) {
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
    deed?.mortgaged ? 'mortgaged' : '',
    landed ? 'landed' : '',
  ].join(' ');

  return (
    <button type="button" className={cls} style={style} onClick={click} aria-label={label}>
      <span className="tile-band">
        <span key={builtKey} className={`tile-blds ${builtKey ? 'just-built' : ''}`}>
          <Buildings level={deed?.level} />
        </span>
      </span>
      <span className="tile-body">
        <span className="tile-name">{tile.short}</span>
        <span className="tile-mid">
          <TileArt id={tile.id} className="tile-art" />
          <span className="tile-foot">
            {owner ? (
              <span className="owner-chip" title={owner.name}>
                <TokenArt id={owner.tokenId} />
              </span>
            ) : tile.price ? (
              <span className="tile-price">{rupeesShort(tile.price)}</span>
            ) : tile.amount ? (
              <span className="tile-price tax">-{rupeesShort(tile.amount)}</span>
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
        <span className="corner-sub">+₹2L Shagun</span>
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
          <span className="corner-title sm">In Jail</span>
        </span>
        <span className="visit visit-left">Just</span>
        <span className="visit visit-bottom">Visiting</span>
      </span>
    );
  }
  if (tile.corner === 'parking') {
    return (
      <span className="corner-inner">
        <span className="corner-kicker">Chai Tapri</span>
        <TileArt id={20} className="corner-art" />
        <span className="corner-title">Jugaad Junction</span>
        <span className="corner-sub kitty">Gullak {rupeesShort(kitty)}</span>
      </span>
    );
  }
  return (
    <span className="corner-inner">
      <span className="corner-kicker">Enforcement Dte.</span>
      <TileArt id={30} className="corner-art" />
      <span className="corner-title">ED Raid!</span>
      <span className="corner-sub">Go to Tihar</span>
    </span>
  );
}

// ---------- pawns ----------
const STACK = {
  1: [[0, 0]],
  2: [[-1, 0], [1, 0]],
  3: [[-1, 0.6], [1, 0.6], [0, -1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1.6, -1], [0, -1], [1.6, -1], [-0.8, 1], [0.8, 1]],
  6: [[-1.6, -1], [0, -1], [1.6, -1], [-1.6, 1], [0, 1], [1.6, 1]],
};

function pawnSpot(player, players) {
  const inCell = player.pos === JAIL_TILE && player.inJail;
  const mates = players.filter((p) => !p.bankrupt && p.pos === player.pos && (p.pos !== JAIL_TILE || p.inJail === player.inJail));
  const idx = mates.findIndex((p) => p.id === player.id);
  const offsets = STACK[Math.min(mates.length, 6)] || STACK[1];
  const [ox, oy] = offsets[idx] || [0, 0];
  let { x, y } = tileCenterPct(player.pos);
  if (player.pos === JAIL_TILE) {
    // Prisoners sit in the cell (towards the board centre); visitors on the outer strip.
    if (inCell) { x += 1.7; y -= 1.7; } else { x -= 4.4; y += 4.4; }
  }
  const spread = mates.length > 1 ? 2.1 : 0;
  return { x: x + ox * spread, y: y + oy * spread };
}

function Pawn({ player, players, active, moving }) {
  const ref = useRef(null);
  const prevPos = useRef(player.pos);
  const { x, y } = pawnSpot(player, players);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prevPos.current === player.pos) return;
    const dist = Math.min((player.pos - prevPos.current + 40) % 40, (prevPos.current - player.pos + 40) % 40);
    prevPos.current = player.pos;
    const jump = dist > 2;
    el.style.setProperty('--dur', jump ? '0.75s' : '0.18s');
    el.querySelector('.pawn-body')?.animate(
      jump
        ? [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(-160%) scale(1.25)' }, { transform: 'translateY(0) scale(1)' }]
        : [{ transform: 'translateY(0) scale(1,1)' }, { transform: 'translateY(-55%) scale(.92,1.1)' }, { transform: 'translateY(0) scale(1.1,.9)' }, { transform: 'translateY(0) scale(1,1)' }],
      { duration: jump ? 750 : 190, easing: 'ease-out' },
    );
  }, [player.pos]);

  return (
    <div
      ref={ref}
      className={`pawn ${active ? 'active' : ''} ${moving ? 'moving' : ''} ${player.inJail ? 'jailed' : ''}`}
      style={{ left: `${x}%`, top: `${y}%`, '--pc': player.color }}
      title={player.name}
    >
      <span className="pawn-shadow" />
      <span className="pawn-body">
        <TokenArt id={player.tokenId} className="pawn-art" />
      </span>
    </div>
  );
}

export default function Board({ deeds, players, landed, activeId, movingId, onTileClick, children, kitty = 0, built, className = '' }) {
  const owners = Object.fromEntries(players.map((p) => [p.id, p]));
  const rootRef = useRef(null);

  // Shake the board when a building is placed.
  useEffect(() => {
    if (!built || !rootRef.current) return;
    rootRef.current.animate(
      [{ transform: 'translate(0,0)' }, { transform: 'translate(0,2px)' }, { transform: 'translate(0,-1px)' }, { transform: 'translate(0,0)' }],
      { duration: 260 },
    );
  }, [built]);

  return (
    <div className={`board ${className}`} ref={rootRef}>
      <div className="board-frame">
        <div className="board-grid">
          {TILES.map((t) => (
            <Tile
              key={t.id}
              tile={t}
              deed={deeds[t.id]}
              owner={deeds[t.id]?.owner ? owners[deeds[t.id].owner] : null}
              landed={landed === t.id}
              onTileClick={onTileClick}
              kitty={t.corner === 'parking' ? kitty : undefined}
              builtKey={built?.id === t.id ? built.n : undefined}
            />
          ))}
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
