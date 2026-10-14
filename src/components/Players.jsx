import { GROUPS } from '../data/board';
import { botById, tokenById } from '../data/characters';
import { PlayerAvatar } from '../art/characters';
import { netWorth } from '../game/rules';
import { rupeesShort } from '../utils/format';
import { Rupees } from './ui';

const ORDER = ['brown', 'sky', 'pink', 'orange', 'red', 'yellow', 'green', 'blue', 'transport', 'utility'];

function SetChart({ deeds, pid }) {
  return (
    <div className="setchart" aria-label="Properties owned by colour set">
      {ORDER.map((g) => (
        <span key={g} className="set" style={{ '--g': GROUPS[g].color }} title={GROUPS[g].name}>
          {GROUPS[g].ids.map((id) => {
            const d = deeds[id];
            const mine = d.owner === pid;
            return <i key={id} className={`${mine ? 'mine' : ''} ${mine && d.mortgaged ? 'mort' : ''} ${d.owner && !mine ? 'taken' : ''}`} />;
          })}
        </span>
      ))}
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

export function PlayerCard({ s, p }) {
  const active = s.players[s.turn]?.id === p.id && s.status === 'playing';
  const sub = p.isAi ? botById(p.botId).title : `Human · ${tokenById(p.tokenId).name}`;
  const speaking = s.speech?.pid === p.id;
  return (
    <div className={`pcard ${active ? 'active' : ''} ${p.bankrupt ? 'out' : ''}`} style={{ '--pc': p.color }}>
      <div className="pcard-row">
        <PlayerAvatar player={p} />
        <div className="pcard-main">
          <div className="pcard-top">
            <span className="pcard-name">{p.name}</span>
            {active && <span className="turn-pill">{s.thinking === p.id ? '…' : 'TURN'}</span>}
          </div>
          <div className="pcard-sub">{sub}</div>
        </div>
      </div>
      <div className="pcard-money">
        <Rupees value={p.cash} className="pcard-cash" />
        <span className="pcard-nw">Net worth {rupeesShort(netWorth(s, p.id))}</span>
      </div>
      <div className="pcard-row2">
        <SetChart deeds={s.deeds} pid={p.id} />
        <span className="pcard-badges">
          {p.inJail && <span className="badge jail" title="In Tihar Jail">⛓️ Tihar</span>}
          {p.jailCards > 0 && <span className="badge bail" title="Bail Pass">📜×{p.jailCards}</span>}
        </span>
      </div>
      {p.bankrupt && <span className="out-stamp">DIWALIYA</span>}
      <Deltas deltas={s.deltas} pid={p.id} />
      {speaking && (
        <span className="pcard-speech" key={s.speech.id}>“{s.speech.text}”</span>
      )}
    </div>
  );
}

export function PlayersPanel({ s }) {
  return (
    <div className="players-panel">
      <div className="panel-title">🏆 Tycoons</div>
      <div className="players-list">
        {s.players.map((p) => <PlayerCard key={p.id} s={s} p={p} />)}
      </div>
    </div>
  );
}

export function PlayersStrip({ s }) {
  return (
    <div className="players-strip">
      {s.players.map((p) => {
        const active = s.players[s.turn]?.id === p.id;
        return (
          <div key={p.id} className={`pchip ${active ? 'active' : ''} ${p.bankrupt ? 'out' : ''}`} style={{ '--pc': p.color }}>
            <PlayerAvatar player={p} className="sm" />
            <span className="pchip-text">
              <span className="pchip-name">{p.name}{p.inJail ? ' ⛓️' : ''}</span>
              <Rupees value={p.cash} className="pchip-cash" />
            </span>
            <Deltas deltas={s.deltas} pid={p.id} />
            {s.speech?.pid === p.id && <span className="pcard-speech" key={s.speech.id}>“{s.speech.text}”</span>}
          </div>
        );
      })}
    </div>
  );
}
