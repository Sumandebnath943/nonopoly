import { useState } from 'react';
import { ArrowLeft, Bot, Globe, Sparkles, User, Users, Zap } from 'lucide-react';
import { TOKENS, BOTS, SEAT_COLORS, botById, tokenById } from '../data/characters';
import { TokenArt, BotPortrait } from '../art/characters';
import { Logo } from '../art/decor';
import { sounds } from '../utils/sound';

const NAME_KEY = 'nonopoly.name';

const savedName = () => {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
};

const INITIAL = [
  { isAi: false, tokenId: 'auto', botId: 'bunty' },
  { isAi: true, tokenId: 'chai', botId: 'gupta' },
  { isAi: true, tokenId: 'bat', botId: 'tauji' },
  { isAi: true, tokenId: 'scooter', botId: 'aunty' },
  { isAi: true, tokenId: 'elephant', botId: 'simran' },
  { isAi: true, tokenId: 'chappal', botId: 'chintu' },
];

const MODES = [
  { id: 'classic', icon: '👑', title: 'Classic Seth', text: '₹15L start · Build from scratch', cash: 1500000 },
  { id: 'express', icon: '⚡', title: 'Express Jugaad', text: '₹25L + Free starter deeds', cash: 2500000 },
];

const GOALS = [
  { id: 'last', label: '🏆 Last Tycoon', rounds: 0, wealth: null },
  { id: 'wealth', label: '💎 ₹45L Crorepati', rounds: 0, wealth: 4500000 },
  { id: 'blitz', label: '⏱️ 20 Rounds', rounds: 20, wealth: null },
];

const PACES = [
  { id: 'chill', label: '🐢 Chill' },
  { id: 'normal', label: '⚡ Normal' },
  { id: 'fast', label: '🚀 Turbo' },
];

export default function Setup({ onBack, onStart, onSwitchOnline }) {
  const [count, setCount] = useState(4);
  const [mode, setMode] = useState('classic');
  const [goalId, setGoalId] = useState('last');
  const [speed, setSpeed] = useState('normal');
  const [seats, setSeats] = useState(() => INITIAL.map((s, i) => ({ ...s, name: i === 0 ? savedName() : '' })));

  const applyPreset = (preset) => {
    sounds.pop();
    if (preset === 'solo4') {
      setCount(4);
      setSeats((prev) => prev.map((s, i) => ({ ...s, isAi: i !== 0 })));
    } else if (preset === 'maha6') {
      setCount(6);
      setSeats((prev) => prev.map((s, i) => ({ ...s, isAi: i !== 0 })));
    } else if (preset === 'couch') {
      setCount(4);
      setSeats((prev) => prev.map((s, i) => ({ ...s, isAi: i >= 2 })));
    } else if (preset === 'duel') {
      setCount(2);
      setSeats((prev) => prev.map((s, i) => ({ ...s, isAi: i !== 0 })));
    }
  };

  const update = (idx, patch) => {
    sounds.click();
    setSeats((prev) => {
      const next = prev.map((s) => ({ ...s }));
      if (patch.tokenId) {
        const other = next.findIndex((s, i) => i !== idx && i < count && s.tokenId === patch.tokenId);
        if (other >= 0) next[other].tokenId = next[idx].tokenId;
      }
      if (patch.botId) {
        const other = next.findIndex((s, i) => i !== idx && i < count && s.botId === patch.botId);
        if (other >= 0) next[other].botId = next[idx].botId;
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
    const goal = GOALS.find((g) => g.id === goalId) || GOALS[0];
    onStart({
      mode,
      speed,
      startCash: MODES.find((m) => m.id === mode).cash,
      maxRounds: goal.rounds || null,
      targetWealth: goal.wealth || null,
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
    <div className="screen-locked festive-bg setup-locked">
      <header className="compact-header setup-header-bar">
        <div className="setup-brand-left">
          <button className="icon-btn" onClick={() => { sounds.click(); onBack(); }} aria-label="Back"><ArrowLeft /></button>
          <Logo size="sm" />
          <div className="setup-title-tag">
            <b>Table & Rivals Setup</b>
            <small>Choose your tycoons, tokens & house rules</small>
          </div>
        </div>

        <div className="setup-presets-bar">
          <button type="button" className="preset-pill" onClick={() => applyPreset('duel')}>⚔️ 1v1 Duel</button>
          <button type="button" className="preset-pill" onClick={() => applyPreset('solo4')}><Sparkles size={12} /> 1v3 Rivals</button>
          <button type="button" className="preset-pill" onClick={() => applyPreset('couch')}><Users size={12} /> Couch Party</button>
          <button type="button" className="preset-pill" onClick={() => applyPreset('maha6')}>🔥 6P Maha-Table</button>
        </div>

        <div className="setup-top-controls">
          <div className="count-pills" role="radiogroup" aria-label="Number of players">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={count === n}
                className={count === n ? 'on' : ''}
                onClick={() => { sounds.click(); setCount(n); }}
              >
                {n}P
              </button>
            ))}
          </div>
          {onSwitchOnline && (
            <button className="chip-btn online-switch" onClick={() => { sounds.click(); onSwitchOnline(); }}>
              <Globe size={14} /> <span>Online Room</span>
            </button>
          )}
        </div>
      </header>

      <main className="setup-stage">
        <div className={`seats-compact-grid count-${count}`}>
          {seats.slice(0, count).map((seat, i) => {
            const color = SEAT_COLORS[i];
            const bot = botById(seat.botId);
            const tok = tokenById(seat.tokenId);
            return (
              <div key={i} className={`seat-compact ${seat.isAi ? 'is-bot' : 'is-human'}`} style={{ '--pc': color.color }}>
                <div className="seat-band-compact">
                  <span className="seat-num">
                    <span className="seat-dot" /> SEAT {i + 1}
                  </span>
                  <div className="seg-mini">
                    <button type="button" className={!seat.isAi ? 'on' : ''} onClick={() => update(i, { isAi: false })}>
                      <User size={11} /> Human
                    </button>
                    <button type="button" className={seat.isAi ? 'on' : ''} onClick={() => update(i, { isAi: true })}>
                      <Bot size={11} /> AI Rival
                    </button>
                  </div>
                </div>

                <div className="seat-compact-body">
                  <div className="seat-hero-row">
                    <div className="seat-portrait-wrap">
                      <BotPortrait id={seat.botId} className="seat-portrait-svg" />
                      <span className="seat-token-corner" title={`Pawn: ${tok.name}`}>
                        <TokenArt id={seat.tokenId} />
                      </span>
                    </div>

                    <div className="seat-id-sm">
                      {seat.isAi ? (
                        <>
                          <div className="seat-name-row">
                            <span className="seat-name-sm">{bot.name}</span>
                            <span className="seat-style-badge">{bot.style}</span>
                          </div>
                          <div className="seat-sub-sm">{bot.title}</div>
                          <div className="seat-quote-sm">“{bot.quote}”</div>
                        </>
                      ) : (
                        <>
                          <input
                            className="seat-input-sm"
                            value={seat.name}
                            maxLength={14}
                            placeholder={i === 0 ? 'Enter Your Name…' : `Player ${i + 1} Name…`}
                            onChange={(e) => update(i, { name: e.target.value })}
                          />
                          <div className="seat-sub-sm">
                            Persona: <b>{bot.name}</b> · Pawn: <b>{tok.name}</b>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="seat-pickers-split">
                    <div className="picker-col">
                      <span className="picker-lbl">{seat.isAi ? 'AI Rival Persona' : 'Avatar Look'}</span>
                      <div className="mini-picker-group bot-faces">
                        {BOTS.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            className={`mini-bot ${seat.botId === b.id ? 'on' : ''}`}
                            onClick={() => update(i, { botId: b.id })}
                            title={`${b.name} — ${b.title} (${b.style})`}
                          >
                            <BotPortrait id={b.id} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="picker-col">
                      <span className="picker-lbl">Board Token</span>
                      <div className="mini-picker-group">
                        {TOKENS.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className={`mini-tok ${seat.tokenId === t.id ? 'on' : ''}`}
                            onClick={() => update(i, { tokenId: t.id })}
                            title={t.name}
                          >
                            <TokenArt id={t.id} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="setup-bottom-bar">
        <div className="setup-bar-options">
          <div className="bar-group">
            <span className="bar-group-lbl">Mode</span>
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`bar-chip ${mode === m.id ? 'on' : ''}`}
                onClick={() => { sounds.click(); setMode(m.id); }}
              >
                {m.icon} <b>{m.title}</b> <small>{m.text}</small>
              </button>
            ))}
          </div>

          <div className="bar-group">
            <span className="bar-group-lbl">Victory</span>
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`bar-chip ${goalId === g.id ? 'on' : ''}`}
                onClick={() => { sounds.click(); setGoalId(g.id); }}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="bar-group">
            <span className="bar-group-lbl"><Zap size={11} /> Pace</span>
            {PACES.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`bar-chip ${speed === p.id ? 'on' : ''}`}
                onClick={() => { sounds.click(); setSpeed(p.id); }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-lg btn-pink start-match-btn" onClick={start}>
          Shuru Karein! ▶ <small>({humans} Human · {count - humans} AI)</small>
        </button>
      </footer>
    </div>
  );
}
