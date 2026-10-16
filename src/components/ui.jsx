import { useEffect, useRef } from 'react';
import { TILES, GROUPS, BUILDINGS } from '../data/board';
import { TileArt } from '../art/tileArt';
import { rupees } from '../utils/format';
import { unmortgageCost } from '../game/rules';

// Zero-rerender smooth number counter using direct DOM textContent updates in rAF.
// Eliminates 60fps React re-renders on mobile devices while keeping buttery-smooth cash rolls.
export function Rupees({ value, className = '' }) {
  const spanRef = useRef(null);
  const currentRef = useRef(value);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    const from = currentRef.current;
    if (from === value) {
      el.textContent = rupees(value);
      return;
    }
    const ms = 520;
    const start = performance.now();
    let raf;
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - t) ** 3;
      const v = Math.round(from + (value - from) * eased);
      currentRef.current = v;
      if (spanRef.current) spanRef.current.textContent = rupees(v);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span ref={spanRef} className={className}>
      {rupees(value)}
    </span>
  );
}

// "**Name** paid ₹2,000" → bold names.
export function RichText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => (part.startsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : <span key={i}>{part}</span>));
}

export function DeedCard({ tileId, owner, deed, boomGroup, compact = false }) {
  const tile = TILES[tileId];
  const group = tile.group ? GROUPS[tile.group] : null;
  const level = deed?.level || 0;
  const isBoom = boomGroup && tile.group === boomGroup;
  return (
    <div className={`deed ${compact ? 'deed-compact' : ''} ${isBoom ? 'deed-boom' : ''}`} style={{ '--g': group?.color || '#6d0f22', '--gt': group?.text || '#fff' }}>
      <div className="deed-stamp-row">
        <span className="deed-registry">Nonopoly Bhu-Abhilekh · Title Deed</span>
        <span className="deed-fee">{isBoom ? '🔥 1.5× BOOM' : '₹100'}</span>
      </div>
      <div className="deed-band">
        <span className="deed-group">{group ? group.name : tile.city}</span>
      </div>
      <div className="deed-hero">
        <TileArt id={tileId} className="deed-art" />
        <div className="deed-titles">
          <div className="deed-name">{tile.name}</div>
          <div className="deed-city">{tile.city}</div>
        </div>
      </div>
      {!compact && <DeedTable tile={tile} level={level} />}
      {compact && tile.type === 'property' && (
        <div className="deed-mini">
          <span>Rent <b>{rupees(tile.rent[0])}</b></span>
          <span>Haveli <b>{rupees(tile.rent[5])}</b></span>
        </div>
      )}
      {compact && tile.type === 'transport' && (
        <div className="deed-mini"><span>Rent <b>₹25,000</b></span><span>All 4 <b>₹2,00,000</b></span></div>
      )}
      {compact && tile.type === 'utility' && (
        <div className="deed-mini"><span>Dice × <b>₹4,000</b></span><span>Both × <b>₹10,000</b></span></div>
      )}
      {!compact && tile.desc && <p className="deed-desc">{tile.desc}</p>}
      {!compact && tile.price && (
        <div className="deed-foot">
          <span>Price <b>{rupees(tile.price)}</b></span>
          <span>Girvi <b>{rupees(tile.mortgage)}</b></span>
          {deed?.mortgaged && <span>Redeem <b>{rupees(unmortgageCost(tileId))}</b></span>}
        </div>
      )}
      {owner && (
        <div className="deed-owner" style={{ '--pc': owner.color }}>
          Owner: <b>{owner.name}</b>
          {deed?.mortgaged && <span className="deed-girvi">GIRVI</span>}
        </div>
      )}
      <span className="deed-seal" aria-hidden="true">₹</span>
    </div>
  );
}

function DeedTable({ tile, level }) {
  if (tile.type === 'property') {
    const rows = [
      ['Khaali plot', tile.rent[0]],
      ['Full colour set', tile.rent[0] * 2],
      ...BUILDINGS.slice(1).map((b, i) => [`${b.level === 5 ? '' : `${b.level} × `}${b.name}`, tile.rent[i + 1]]),
    ];
    return (
      <div className="deed-table">
        {rows.map(([label, v], i) => {
          const current = (i === 0 && level === 0) || (i >= 2 && i - 1 === level);
          return (
            <div key={label} className={`deed-row ${current ? 'current' : ''} ${i === rows.length - 1 ? 'haveli' : ''}`}>
              <span>{label}</span>
              <b>{rupees(v)}</b>
            </div>
          );
        })}
        <div className="deed-row build">
          <span>Each building costs</span>
          <b>{rupees(tile.houseCost)}</b>
        </div>
      </div>
    );
  }
  if (tile.type === 'transport') {
    return (
      <div className="deed-table">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="deed-row">
            <span>{n} Rail &amp; Metro owned</span>
            <b>{rupees(25000 * 2 ** (n - 1))}</b>
          </div>
        ))}
      </div>
    );
  }
  if (tile.type === 'utility') {
    return (
      <div className="deed-table">
        <div className="deed-row"><span>One utility</span><b>Dice × ₹4,000</b></div>
        <div className="deed-row"><span>Both utilities</span><b>Dice × ₹10,000</b></div>
      </div>
    );
  }
  return null;
}

export function Modal({ children, onClose, className = '', label }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
