import { useState } from 'react';
import { ArrowLeft, Bot, User } from 'lucide-react';
import { TOKENS, BOTS, SEAT_COLORS, botById, tokenById } from '../data/characters';
import { TokenArt, BotPortrait } from '../art/characters';
import { Logo } from '../art/decor';

const NAME_KEY = 'nonopoly.name';

const savedName = () => {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
};

const INITIAL = [
  { isAi: false, tokenId: 'auto', botId: 'gupta' },
  { isAi: true, tokenId: 'chai', botId: 'gupta' },
  { isAi: true, tokenId: 'bat', botId: 'bunty' },
  { isAi: true, tokenId: 'scooter', botId: 'aunty' },
  { isAi: true, tokenId: 'elephant', botId: 'tauji' },
  { isAi: true, tokenId: 'chappal', botId: 'chintu' },
];

const MODES = [
  { id: 'classic', icon: '👑', title: 'Classic Seth', text: 'Start with ₹15 lakh. Build your empire from scratch.', cash: 1500000 },
  { id: 'express', icon: '⚡', title: 'Express Jugaad', text: 'Start with ₹25 lakh and 2 random properties each. Fast and furious.', cash: 2500000 },
];

const LENGTHS = [
  { v: 0, label: 'Till bankruptcy' },
  { v: 25, label: '25 rounds' },
  { v: 12, label: '12 rounds' },
];

export default function Setup({ onBack, onStart }) {
  const [count, setCount] = useState(4);
  const [mode, setMode] = useState('classic');
  const [rounds, setRounds] = useState(0);
  const [seats, setSeats] = useState(() => INITIAL.map((s, i) => ({ ...s, name: i === 0 ? savedName() : '' })));

  const update = (idx, patch) => {
    setSeats((prev) => {
      const next = prev.map((s) => ({ ...s }));
      // Tokens and bots are unique at the table: swap with whoever had it.
      if (patch.tokenId) {
        const other = next.findIndex((s, i) => i !== idx && i < count && s.tokenId === patch.tokenId);
        if (other >= 0) next[other].tokenId = next[idx].tokenId;
      }
      if (patch.botId) {
        const other = next.findIndex((s, i) => i !== idx && i < count && s.isAi && s.botId === patch.botId);
        if (other >= 0) next[other].botId = next[idx].botId;
      }
      if (patch.isAi === true) {
        const used = next.filter((s, i) => i !== idx && i < count && s.isAi).map((s) => s.botId);
        if (used.includes(next[idx].botId)) next[idx].botId = BOTS.find((b) => !used.includes(b.id))?.id || next[idx].botId;
      }
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const start = () => {
    const chosen = seats.slice(0, count);
    const human = chosen.find((s) => !s.isAi && s.name.trim());
    if (human) {
      try {
        localStorage.setItem(NAME_KEY, human.name.trim());
      } catch {
        /* ignore */
      }
    }
    onStart({
      mode,
      startCash: MODES.find((m) => m.id === mode).cash,
      maxRounds: rounds || null,
      players: chosen.map((s, i) => ({
        name: s.isAi ? botById(s.botId).name : s.name.trim() || `Player ${i + 1}`,
        isAi: s.isAi,
        botId: s.botId,
        tokenId: s.tokenId,
        color: SEAT_COLORS[i].color,
      })),
    });
  };

  const humans = seats.slice(0, count).filter((s) => !s.isAi).length;

  return (
    <div className="setup festive-bg">
      <header className="setup-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back"><ArrowLeft /></button>
        <Logo size="sm" />
        <span className="setup-step">Game setup</span>
      </header>

      <div className="setup-wrap">
        <div className="setup-title">
          <span className="section-kicker">Kaun kaun khelega?</span>
          <h1>Who’s at the table?</h1>
          <p>Mix humans (pass-and-play on one device) and desi bots. Every bot has its own personality.</p>
        </div>

        <div className="count-picker" role="radiogroup" aria-label="Number of players">
          {[2, 3, 4, 5, 6].map((n) => (
            <button key={n} role="radio" aria-checked={count === n} className={count === n ? 'on' : ''} onClick={() => setCount(n)}>
              {n}
              <small>players</small>
            </button>
          ))}
        </div>

        <div className="seats">
          {seats.slice(0, count).map((seat, i) => {
            const color = SEAT_COLORS[i];
            const bot = botById(seat.botId);
            const token = tokenById(seat.tokenId);
            return (
              <div key={i} className={`seat ${seat.isAi ? 'is-bot' : 'is-human'}`} style={{ '--pc': color.color }}>
                <div className="seat-band">
                  <span>Player {i + 1} · {color.name}</span>
                  <div className="seg" role="radiogroup" aria-label={`Player ${i + 1} type`}>
                    <button role="radio" aria-checked={!seat.isAi} className={!seat.isAi ? 'on' : ''} onClick={() => update(i, { isAi: false })}><User /> Human</button>
                    <button role="radio" aria-checked={seat.isAi} className={seat.isAi ? 'on' : ''} onClick={() => update(i, { isAi: true })}><Bot /> Bot</button>
                  </div>
                </div>
                <div className="seat-body">
                  <div className="seat-hero">
                    <div className="seat-avatar">
                      {seat.isAi ? <BotPortrait id={seat.botId} className="seat-portrait" /> : <TokenArt id={seat.tokenId} className="seat-token" />}
                      {seat.isAi && (
                        <span className="seat-token-badge"><TokenArt id={seat.tokenId} /></span>
                      )}
                    </div>
                    <div className="seat-id">
                      {seat.isAi ? (
                        <>
                          <div className="seat-name">{bot.name}</div>
                          <div className="seat-sub">{bot.title} · {bot.style}</div>
                        </>
                      ) : (
                        <>
                          <input
                            className="seat-input"
                            value={seat.name}
                            maxLength={16}
                            placeholder={i === 0 ? 'Your name' : `Player ${i + 1}`}
                            onChange={(e) => update(i, { name: e.target.value })}
                            aria-label={`Player ${i + 1} name`}
                          />
                          <div className="seat-sub">{token.name}: {token.line}</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="seat-label">Token</div>
                  <div className="token-row">
                    {TOKENS.map((t) => {
                      const takenBy = seats.findIndex((s, j) => j !== i && j < count && s.tokenId === t.id);
                      return (
                        <button key={t.id} className={`token-pick ${seat.tokenId === t.id ? 'on' : ''} ${takenBy >= 0 ? 'taken' : ''}`} onClick={() => update(i, { tokenId: t.id })} title={`${t.name}${takenBy >= 0 ? ` (swap with Player ${takenBy + 1})` : ''}`}>
                          <TokenArt id={t.id} />
                        </button>
                      );
                    })}
                  </div>

                  {seat.isAi && (
                    <>
                      <div className="seat-label">Personality</div>
                      <div className="bot-row">
                        {BOTS.map((b) => (
                          <button key={b.id} className={`bot-pick ${seat.botId === b.id ? 'on' : ''}`} onClick={() => update(i, { botId: b.id })} title={`${b.name}: ${b.title}`}>
                            <BotPortrait id={b.id} />
                          </button>
                        ))}
                      </div>
                      <p className="seat-quote">“{bot.quote}”</p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="settings-row">
          <div className="setting-block">
            <div className="seat-label">Game mode</div>
            <div className="mode-cards">
              {MODES.map((m) => (
                <button key={m.id} className={`mode-card ${mode === m.id ? 'on' : ''}`} onClick={() => setMode(m.id)}>
                  <span className="mode-icon">{m.icon}</span>
                  <span>
                    <b>{m.title}</b>
                    <small>{m.text}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="setting-block">
            <div className="seat-label">Game length</div>
            <div className="length-chips">
              {LENGTHS.map((l) => (
                <button key={l.v} className={`length-chip ${rounds === l.v ? 'on' : ''}`} onClick={() => setRounds(l.v)}>
                  {l.label}
                </button>
              ))}
            </div>
            <p className="setting-note">With a round limit, the richest tycoon wins when time runs out.</p>
          </div>
        </div>
      </div>

      <div className="start-bar">
        <div className="start-summary">
          <b>{count} players</b> · {humans} human{humans === 1 ? '' : 's'}, {count - humans} bot{count - humans === 1 ? '' : 's'} · {MODES.find((m) => m.id === mode).title}
        </div>
        <button className="btn btn-xl btn-pink" onClick={start}>Shuru Karein! ▶</button>
      </div>
    </div>
  );
}
