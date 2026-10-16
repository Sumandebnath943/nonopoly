import { useState } from 'react';
import { Send } from 'lucide-react';
import { TILES, GROUPS, BUILDINGS } from '../data/board';
import { TileArt, BuildingIcon } from '../art/tileArt';
import { PlayerAvatar } from '../art/characters';
import { game, QUICK_REACTIONS } from '../game/engine';
import * as R from '../game/rules';
import { rupees, rupeesShort } from '../utils/format';
import { RichText } from './ui';

const ORDER = ['brown', 'sky', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'transport', 'utility'];

export function ActivityLog({ s }) {
  return (
    <ol className="log">
      {s.log.map((l) => {
        const p = l.pid ? s.players.find((x) => x.id === l.pid) : null;
        if (l.tone === 'round') {
          return <li key={l.id} className="log-round"><span>{l.text}</span></li>;
        }
        return (
          <li key={l.id} className={`log-item tone-${l.tone}`} style={{ '--pc': p?.color || 'var(--gold-2)' }}>
            <span className="log-dot" />
            <span className="log-text"><RichText text={l.text} /></span>
          </li>
        );
      })}
    </ol>
  );
}

export function ChatPanel({ s }) {
  const [text, setText] = useState('');
  const [cat, setCat] = useState('roast');
  const [targetId, setTargetId] = useState(null);

  const me = game.myPlayer() || s.players[s.turn];
  const rivals = s.players.filter((p) => !p.bankrupt && p.id !== me?.id);
  const activeTarget = rivals.find((p) => p.id === targetId) || null;
  const visibleTaunts = QUICK_REACTIONS.filter((r) => r.cat === cat);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const prefix = activeTarget ? `@${activeTarget.name} ` : '';
    game.sendChat(`${prefix}${text.trim()}`);
    setText('');
  };

  return (
    <div className="game-chat-panel">
      <div className="trash-talk-box">
        <div className="tt-target-row">
          <span className="tt-label">🎯 Target:</span>
          <button
            type="button"
            className={`tt-target-pill ${!activeTarget ? 'on' : ''}`}
            onClick={() => setTargetId(null)}
          >
            Everyone
          </button>
          {rivals.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`tt-target-pill ${activeTarget?.id === r.id ? 'on' : ''}`}
              style={{ '--pc': r.color }}
              onClick={() => setTargetId(r.id === activeTarget?.id ? null : r.id)}
            >
              @{r.name.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="tt-cat-tabs">
          <button type="button" className={cat === 'roast' ? 'on' : ''} onClick={() => setCat('roast')}>
            🔥 Savage Roasts
          </button>
          <button type="button" className={cat === 'flex' ? 'on' : ''} onClick={() => setCat('flex')}>
            🏰 Tycoon Flex
          </button>
          <button type="button" className={cat === 'drama' ? 'on' : ''} onClick={() => setCat('drama')}>
            ⛓️ Karma &amp; Drama
          </button>
        </div>

        <div className="quick-taunts-list">
          {visibleTaunts.map((r) => {
            const preview = activeTarget && typeof r.targeted === 'function' ? r.targeted(activeTarget.name) : r.text;
            return (
              <button
                key={r.id}
                type="button"
                className="taunt-card-btn"
                onClick={() => game.sendReaction(r.id, activeTarget?.id || null)}
                title="Tap to send this trash-talk to the table!"
              >
                <span className="taunt-card-emoji">{r.emoji}</span>
                <span className="taunt-card-copy">
                  <b>{r.label}</b>
                  <small>“{preview}”</small>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="chat-feed">
        {!s.chat?.length && (
          <div className="emp-empty">
            Tap any prewritten Desi roast above or type your own trash-talk below! Bots will clap back based on the game!
          </div>
        )}
        {(s.chat || []).map((c) => (
          <div key={c.id} className={`chat-bubble ${c.system ? 'system' : ''}`} style={{ '--pc': c.color }}>
            {c.system ? (
              <span className="chat-sys">{c.text}</span>
            ) : (
              <>
                <div className="chat-meta">
                  <b>{c.sender}</b>
                  <small>{c.time}</small>
                </div>
                <div className="chat-body">{c.text}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <form className="chat-input-row" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={activeTarget ? `Roast ${activeTarget.name}…` : 'Type custom trash-talk or message…'}
          maxLength={120}
        />
        <button type="submit" className="btn btn-sm btn-pink" aria-label="Send">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

function ManageButtons({ s, pid, id, can }) {
  const tile = TILES[id];
  const deed = s.deeds[id];
  const build = R.canBuild(s, pid, id);
  const sell = R.canSell(s, pid, id);
  const mort = R.canMortgage(s, pid, id);
  const unm = R.canUnmortgage(s, pid, id);
  return (
    <div className="emp-actions">
      {tile.type === 'property' && !deed.mortgaged && (
        <>
          <button className="mini-btn build" disabled={!can || !build.ok} title={build.reason || `Build for ${rupees(tile.houseCost)}`} onClick={() => game.build(pid, id)}>
            + {deed.level === 4 ? 'Haveli' : 'Build'} {rupeesShort(tile.houseCost)}
          </button>
          {deed.level > 0 && (
            <button className="mini-btn" disabled={!can || !sell.ok} title={sell.reason || 'Sell one building for half price'} onClick={() => game.sellBuilding(pid, id)}>
              − Sell
            </button>
          )}
        </>
      )}
      {deed.mortgaged ? (
        <button className="mini-btn redeem" disabled={!can || !unm.ok} title={unm.reason || ''} onClick={() => game.unmortgage(pid, id)}>
          Redeem {rupeesShort(R.unmortgageCost(id))}
        </button>
      ) : (
        <button className="mini-btn girvi-btn" disabled={!can || !mort.ok} title={mort.reason || `Mortgage for ${rupees(tile.mortgage)}`} onClick={() => game.mortgage(pid, id)}>
          Girvi +{rupeesShort(tile.mortgage)}
        </button>
      )}
    </div>
  );
}

export function EmpirePanel({ s, viewer, canManage, onTrade, onOpenDeed }) {
  if (!viewer) {
    return <div className="emp-empty">Bots only. Sit back and enjoy the drama!</div>;
  }
  const owned = R.ownedIds(s, viewer.id);
  const wb = R.wealthBreakdown(s, viewer.id);
  const groups = ORDER.map((g) => ({ g, ids: owned.filter((id) => TILES[id].group === g) })).filter((x) => x.ids.length);

  // Find "Almost Monopoly" sets (where viewer needs just 1 more property!)
  const nearSets = ['brown', 'sky', 'pink', 'orange', 'red', 'yellow', 'green', 'blue']
    .map((g) => {
      const gIds = GROUPS[g].ids;
      const mine = gIds.filter((id) => s.deeds[id]?.owner === viewer.id);
      if (mine.length !== gIds.length - 1) return null;
      const missingId = gIds.find((id) => s.deeds[id]?.owner !== viewer.id);
      const holder = s.deeds[missingId]?.owner ? s.players.find((p) => p.id === s.deeds[missingId].owner) : null;
      return { g, missingTile: TILES[missingId], holder };
    })
    .filter(Boolean);

  return (
    <div className="empire">
      <div className="emp-head" style={{ '--pc': viewer.color }}>
        <PlayerAvatar player={viewer} className="sm" />
        <div className="emp-head-text">
          <b>{viewer.name}’s Portfolio</b>
          <small>{owned.length} Deeds · Net Worth {rupeesShort(wb.total)}</small>
        </div>
        <button className="btn btn-sm btn-teal" disabled={!canManage} onClick={onTrade} title={canManage ? 'Propose a trade' : 'Trade on your turn'}>
          🤝 Trade
        </button>
      </div>

      {/* Portfolio Breakdown Card */}
      <div className="emp-stats-grid">
        <div className="emp-stat-box">
          <span>💵 Cash</span>
          <b>{rupeesShort(wb.cash)}</b>
        </div>
        <div className="emp-stat-box">
          <span>🏞️ Land</span>
          <b>{rupeesShort(wb.land)}</b>
        </div>
        <div className="emp-stat-box">
          <span>🏰 Built</span>
          <b>{rupeesShort(wb.buildings)}</b>
        </div>
      </div>

      {nearSets.length > 0 && (
        <div className="emp-radar-box">
          <div className="emp-radar-title">🎯 Monopoly Radar (1 Deed Away!)</div>
          {nearSets.map(({ g, missingTile, holder }) => (
            <div key={g} className="emp-radar-row" style={{ '--g': GROUPS[g].color }}>
              <span className="emp-swatch" />
              <span className="emp-radar-text">
                Need <b>{missingTile.short}</b> ({holder ? `Owned by ${holder.name}` : 'Unowned'})
              </span>
              {holder && canManage && (
                <button className="mini-btn build" onClick={onTrade}>Offer Deal</button>
              )}
            </div>
          ))}
        </div>
      )}

      {!canManage && <div className="emp-note">💡 Tip: Build on full sets anytime on your turn, or land on your own plot to upgrade it!</div>}
      {!groups.length && (
        <div className="emp-empty">
          No deeds yet. Roll the dice, snap up prime Indian landmarks, or bid in live Neelaami auctions!
        </div>
      )}
      {groups.map(({ g, ids }) => {
        const full = R.ownsGroup(s, g, viewer.id);
        return (
          <div key={g} className="emp-group" style={{ '--g': GROUPS[g].color }}>
            <div className="emp-group-head">
              <span className="emp-swatch" />
              <span className="emp-group-name">{GROUPS[g].name}</span>
              <span className="emp-count">{ids.length}/{GROUPS[g].ids.length}</span>
              {full && <span className="emp-full">👑 Monopoly</span>}
            </div>
            {ids.map((id) => {
              const tile = TILES[id];
              const deed = s.deeds[id];
              const bName = BUILDINGS[deed.level || 0]?.short || 'Plot';
              return (
                <div key={id} className={`emp-prop ${deed.mortgaged ? 'mort' : ''}`}>
                  <button className="emp-prop-main" onClick={() => onOpenDeed(id)}>
                    <TileArt id={id} className="emp-art" />
                    <span className="emp-prop-text">
                      <b>{tile.short}</b>
                      <small>
                        {deed.mortgaged
                          ? '📜 Girvi (Mortgaged)'
                          : `${bName} · Rent ${rupeesShort(R.rentFor(s, id, 7))}${tile.type === 'utility' ? '*' : ''}`}
                      </small>
                    </span>
                    <span className="emp-blds">
                      {deed.level === 5 ? <BuildingIcon haveli className="bld-haveli" /> : Array.from({ length: deed.level }, (_, i) => <BuildingIcon key={i} className="bld" />)}
                    </span>
                  </button>
                  <ManageButtons s={s} pid={viewer.id} id={id} can={canManage} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
