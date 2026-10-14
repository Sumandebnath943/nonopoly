import { TILES, GROUPS } from '../data/board';
import { TileArt, BuildingIcon } from '../art/tileArt';
import { PlayerAvatar } from '../art/characters';
import { game } from '../game/engine';
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
            + Build {rupeesShort(tile.houseCost)}
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
  const groups = ORDER.map((g) => ({ g, ids: owned.filter((id) => TILES[id].group === g) })).filter((x) => x.ids.length);
  return (
    <div className="empire">
      <div className="emp-head" style={{ '--pc': viewer.color }}>
        <PlayerAvatar player={viewer} className="sm" />
        <div className="emp-head-text">
          <b>{viewer.name}’s Empire</b>
          <small>{owned.length} properties · Net worth {rupeesShort(R.netWorth(s, viewer.id))}</small>
        </div>
        <button className="btn btn-sm btn-teal" disabled={!canManage} onClick={onTrade} title={canManage ? 'Propose a trade' : 'Trade on your turn'}>
          🤝 Trade
        </button>
      </div>
      {!canManage && <div className="emp-note">You can build, mortgage and trade during your own turn.</div>}
      {!groups.length && (
        <div className="emp-empty">
          No property yet. Land on an unowned tile and buy it. Every Tapri empire starts with one plot!
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
              {full && <span className="emp-full">👑 Full set</span>}
            </div>
            {ids.map((id) => {
              const tile = TILES[id];
              const deed = s.deeds[id];
              return (
                <div key={id} className={`emp-prop ${deed.mortgaged ? 'mort' : ''}`}>
                  <button className="emp-prop-main" onClick={() => onOpenDeed(id)}>
                    <TileArt id={id} className="emp-art" />
                    <span className="emp-prop-text">
                      <b>{tile.short}</b>
                      <small>
                        {deed.mortgaged ? 'Girvi (mortgaged)' : `Rent ${rupeesShort(R.rentFor(s, id, 7))}${tile.type === 'utility' ? '*' : ''}`}
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
