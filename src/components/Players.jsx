import { GROUPS, TILES } from '../data/board';
import { botById, tokenById } from '../data/characters';
import { PlayerAvatar } from '../art/characters';
import { game } from '../game/engine';
import { netWorth, ownedIds, ownsGroup } from '../game/rules';
import { rupeesShort } from '../utils/format';
import { Rupees } from './ui';

const ORDER = ['brown', 'sky', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'transport', 'utility'];

function SetChart({ deeds, pid }) {
  return (
    <div className="setchart" aria-label="Properties owned by colour set">
      {ORDER.map((g) => {
        const full = GROUPS[g].ids.every((id) => deeds[id]?.owner === pid);
        return (
          <span key={g} className={`set ${full ? 'set-full' : ''}`} style={{ '--g': GROUPS[g].color }} title={`${GROUPS[g].name}${full ? ' (Monopoly!)' : ''}`}>
            {GROUPS[g].ids.map((id) => {
              const d = deeds[id];
              const mine = d?.owner === pid;
              return <i key={id} className={`${mine ? 'mine' : ''} ${mine && d?.mortgaged ? 'mort' : ''} ${d?.owner && !mine ? 'taken' : ''}`} />;
            })}
          </span>
        );
      })}
    </div>
  );
}

function Deltas({ deltas, pid }) {
  return (
    <span className="deltas" aria-hidden="true">
      {deltas.filter((d) => d.pid === pid).map((d) => (
        <span key={d.id} className={`delta ${d.amount > 0 ? 'gain' : 'loss'}`}>
          {d.amount > 0 ? '+' : '−'}{rupeesShort(Math.abs(d.amount))}
        </span>
      ))}
    </span>
  );
}

function pickSmartRoastForTarget(targetPlayer) {
  if (targetPlayer.inJail) return 'chakki';
  if (targetPlayer.cash < 150000) return 'broke';
  const pool = ['rent', 'tapri', 'fd', 'kabza_soon', 'seth', 'raid'];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function PlayerCard({ s, p, rank, maxNw, viewerId }) {
  const active = s.players[s.turn]?.id === p.id && s.status === 'playing';
  const isMe = (game.isControllableByMe(p.id) && s.online?.active) || (!s.online?.active && viewerId === p.id && !p.isAi);
  const canRoast = !p.bankrupt && viewerId && viewerId !== p.id;
  const bot = p.botId ? botById(p.botId) : null;
  const tok = tokenById(p.tokenId);
  const roleLabel = p.isAi ? bot.style : tok.name;
  const speaking = s.speech?.pid === p.id;
  const nw = netWorth(s, p.id);
  const myIds = ownedIds(s, p.id);
  const monopolies = ['brown', 'sky', 'pink', 'orange', 'red', 'yellow', 'green', 'blue'].filter((g) => ownsGroup(s, g, p.id)).length;
  const bldCount = myIds.reduce((sum, id) => sum + (s.deeds[id]?.level || 0), 0);
  const posTile = TILES[p.pos];
  const barPct = maxNw > 0 ? Math.min(100, Math.max(8, Math.round((nw / maxNw) * 100))) : 20;

  return (
    <div className={`pcard ${active ? 'active' : ''} ${p.bankrupt ? 'out' : ''}`} style={{ '--pc': p.color }}>
      <div className="pcard-row">
        <div className="pcard-avatar-wrap">
          <PlayerAvatar player={p} className="sm-plus" />
          <span className="pcard-tok-badge" title={tok.name}>{tok.badge}</span>
          {!p.bankrupt && <span className={`pcard-rank r-${rank}`}>#{rank}</span>}
        </div>

        <div className="pcard-main">
          <div className="pcard-top">
            <span className="pcard-name">{p.name}</span>
            {isMe && <span className="me-pill">YOU</span>}
            {active && <span className="turn-pill">{s.thinking === p.id ? '•••' : 'TURN'}</span>}
          </div>
          <div className="pcard-sub-row">
            <span className="pcard-role">{roleLabel}</span>
            <span className="pcard-dot">·</span>
            <span className="pcard-loc">
              {p.inJail ? '⛓️ Tihar Jail' : `📍 ${posTile?.short || 'START'}`}
            </span>
          </div>
        </div>

        <div className="pcard-wealth-col">
          <Rupees value={p.cash} className="pcard-cash" />
          <div className="pcard-nw-row">
            <span className="pcard-nw" title="Total Net Worth (Cash + Deeds + Buildings)">NW {rupeesShort(nw)}</span>
            {canRoast && (
              <button
                type="button"
                className="pcard-roast-btn"
                onClick={() => game.sendReaction(pickSmartRoastForTarget(p), p.id)}
                title={`Roast ${p.name}!`}
              >
                🔥
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="pcard-row2">
        <SetChart deeds={s.deeds} pid={p.id} />
        <span className="pcard-badges">
          {myIds.length > 0 && <span className="pcard-stat-pill" title={`${myIds.length} Deeds owned`}>📄{myIds.length}</span>}
          {monopolies > 0 && <span className="pcard-stat-pill gold" title={`${monopolies} Full Monopolies`}>👑{monopolies}</span>}
          {bldCount > 0 && <span className="pcard-stat-pill" title={`${bldCount} Buildings`}>🏰{bldCount}</span>}
          {p.jailCards > 0 && <span className="badge bail" title="VIP Bail Pass">📜×{p.jailCards}</span>}
        </span>
      </div>

      <div className="pcard-wealth-bar" aria-hidden="true">
        <span className="pcard-wealth-fill" style={{ width: `${barPct}%` }} />
      </div>

      {p.bankrupt && <span className="out-stamp">DIWALIYA</span>}
      <Deltas deltas={s.deltas} pid={p.id} />
      {speaking && (
        <span className="pcard-speech" key={s.speech.id}>{s.speech.text}</span>
      )}
    </div>
  );
}

export function PlayersPanel({ s }) {
  const nws = s.players.map((p) => ({ id: p.id, nw: p.bankrupt ? -1 : netWorth(s, p.id) }));
  const sortedIds = [...nws].sort((a, b) => b.nw - a.nw).map((x) => x.id);
  const maxNw = Math.max(1500000, ...nws.map((x) => x.nw));
  const viewer = game.myPlayer();

  return (
    <div className="players-panel">
      <div className="panel-title">
        <span>🏆 Tycoon Standings</span>
        <small>{s.players.filter((p) => !p.bankrupt).length}/{s.players.length} Active</small>
      </div>
      <div className="players-list">
        {s.players.map((p) => (
          <PlayerCard
            key={p.id}
            s={s}
            p={p}
            rank={sortedIds.indexOf(p.id) + 1}
            maxNw={maxNw}
            viewerId={viewer?.id}
          />
        ))}
      </div>
    </div>
  );
}

export function PlayersStrip({ s }) {
  return (
    <div className="players-strip">
      {s.players.map((p) => {
        const active = s.players[s.turn]?.id === p.id;
        const isMe = game.isControllableByMe(p.id) && s.online?.active;
        return (
          <div key={p.id} className={`pchip ${active ? 'active' : ''} ${p.bankrupt ? 'out' : ''}`} style={{ '--pc': p.color }}>
            <PlayerAvatar player={p} className="sm" />
            <span className="pchip-text">
              <span className="pchip-name">
                {p.name}{isMe ? ' (You)' : ''}{p.inJail ? ' ⛓️' : ''}
              </span>
              <Rupees value={p.cash} className="pchip-cash" />
            </span>
            <Deltas deltas={s.deltas} pid={p.id} />
            {s.speech?.pid === p.id && <span className="pcard-speech" key={s.speech.id}>{s.speech.text}</span>}
          </div>
        );
      })}
    </div>
  );
}
