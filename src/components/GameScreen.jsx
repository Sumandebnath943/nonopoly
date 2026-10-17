import { useEffect, useState } from 'react';
import { BookOpen, Check, Copy, LogOut, MessageCircle, Music, Volume2, VolumeX, X, Zap } from 'lucide-react';
import { game, useGame, QUICK_REACTIONS } from '../game/engine';
import { sounds, MUSIC_TRACKS } from '../utils/sound';
import { Logo } from '../art/decor';
import Board from './Board';
import BoardCenter from './BoardCenter';
import Moments from './Moments';
import { PlayersPanel, PlayersStrip } from './Players';
import { ActivityLog, ChatPanel, EmpirePanel } from './SidePanel';
import { DeedModal, IncomingTradeModal, RulesModal, TradeModal, Victory } from './Modals';

const FILLER_NEWS = [
  'SENSEX up 800 points as Chandni Chowk jalebi futures go parabolic',
  'Silk Board traffic jam enters its 3rd day; commuters start a WhatsApp group and two startups',
  'Gold hits record high. Every Indian mother now says “I told you so”',
  'Mumbai Local ran on time today. Commuters suspect a conspiracy',
  'Tota-wala parrot astrologer raises Series A at ₹500 crore valuation',
  'RBI says Jugaad is officially a renewable resource',
  'Sharma Ji’s son now owns a Haveli. Neighbourhood morale at record low',
];

function NewsTicker({ headline }) {
  const [i, setI] = useState(0);
  const [expiredId, setExpiredId] = useState(null);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % FILLER_NEWS.length), 7000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!headline?.id) return;
    const id = headline.id;
    const t = setTimeout(() => setExpiredId(id), 9000);
    return () => clearTimeout(t);
  }, [headline?.id]);
  const live = headline && headline.id !== expiredId ? headline : null;
  const text = live ? live.text : FILLER_NEWS[i];
  return (
    <div className={`ticker ${live ? 'live' : ''}`}>
      <span className="ticker-tag">{live ? 'BREAKING' : 'NONOPOLY NEWS'}</span>
      <span className="ticker-text" key={live ? live.id : `f${i}`}>{text}</span>
    </div>
  );
}

function Header({ s, onRules, onQuit }) {
  const { speed, muted } = s.settings;
  const [music, setMusic] = useState(sounds.musicOn);
  const [track, setTrack] = useState(() => MUSIC_TRACKS.find((t) => t.id === sounds.trackId) || MUSIC_TRACKS[0]);
  const [copiedRoom, setCopiedRoom] = useState(false);

  const handleMusicClick = () => {
    const res = sounds.cycleTrack();
    setMusic(res.musicOn);
    setTrack(res.track);
  };

  const copyRoom = () => {
    if (!s.online?.roomCode) return;
    sounds.pop();
    navigator.clipboard?.writeText(s.online.roomCode).catch(() => {});
    setCopiedRoom(true);
    setTimeout(() => setCopiedRoom(false), 1800);
  };

  return (
    <header className="game-header">
      <Logo size="sm" className="header-logo" />
      {s.online?.active && s.online?.roomCode && (
        <button className="room-header-badge" onClick={copyRoom} title="Tap to copy Room Code">
          <span className="pulse-dot" />
          <span>ROOM <b>{s.online.roomCode}</b></span>
          {copiedRoom ? <Check size={13} /> : <Copy size={13} />}
        </button>
      )}
      <NewsTicker headline={s.headline} />
      <div className="header-ctrls">
        <button
          className={`chip-btn pace-header-btn ${speed === 'fast' ? 'on' : speed === 'chill' ? 'chill' : ''}`}
          onClick={() => {
            sounds.click();
            game.cycleSpeed();
          }}
          title="Tap to change game & bot pace (Normal / Turbo / Chill)"
        >
          <Zap size={13} />
          <span>{speed === 'fast' ? 'Turbo' : speed === 'chill' ? 'Chill' : 'Normal'}</span>
        </button>
        <button
          className={`icon-btn ${music && !muted ? 'on' : ''}`}
          onClick={handleMusicClick}
          title={`Music: ${track.name} (tap to switch groove)`}
          disabled={muted}
        >
          <Music />
        </button>
        <button
          className="icon-btn"
          onClick={() => {
            const next = !muted;
            game.setSetting('muted', next);
          }}
          title={muted ? 'Unmute' : 'Mute'}
          aria-pressed={muted}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </button>
        <button className="icon-btn" onClick={() => { sounds.click(); onRules(); }} title="How to play">
          <BookOpen />
        </button>
        <button className="icon-btn" onClick={() => { sounds.click(); onQuit(); }} title="Leave game">
          <LogOut />
        </button>
      </div>
    </header>
  );
}

export default function GameScreen({ onHome, onReplay }) {
  const s = useGame();
  const [deedId, setDeedId] = useState(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [tab, setTab] = useState('empire');
  const [mobileSheet, setMobileSheet] = useState(null); // null | 'empire' | 'chat' | 'log'
  const [confirmQuit, setConfirmQuit] = useState(false);

  const current = s.players[s.turn];
  const viewer = game.myPlayer();
  const canManage = !!viewer && game.canManage(viewer.id);

  // Jump to the Empire tab when a debt needs settling
  useEffect(() => {
    if (s.prompt?.type === 'debt' && game.isControllableByMe(s.prompt.pid)) {
      const t = setTimeout(() => {
        setTab('empire');
        setMobileSheet('empire');
      }, 0);
      return () => clearTimeout(t);
    }
  }, [s.prompt?.type, s.prompt?.pid]);

  useEffect(() => {
    game.setChatOpen(tab === 'chat' || mobileSheet === 'chat');
  }, [tab, mobileSheet]);

  // Keyboard: space/enter rolls or ends turn
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, .modal')) return;
      const pr = game.getState().prompt;
      if (!pr || (e.key !== ' ' && e.key !== 'Enter')) return;
      if (!game.isControllableByMe(pr.pid)) return;
      if (pr.type === 'roll' || pr.type === 'end' || pr.type === 'card') {
        e.preventDefault();
        game.respond(pr.type === 'roll' ? 'roll' : pr.type === 'end' ? 'end' : 'ok', pr.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleSheet = (which) => {
    sounds.click();
    setMobileSheet((prev) => (prev === which ? null : which));
    setTab(which);
  };

  return (
    <div className="game festive-bg">
      <Header s={s} onRules={() => setRulesOpen(true)} onQuit={() => setConfirmQuit(true)} />
      <main className="game-main">
        <aside className="col-left panel">
          <PlayersPanel s={s} />
          <div className="left-taunt-dock">
            <div className="left-taunt-head">
              <span>🗣️ Desi Trash-Talk</span>
              <button
                type="button"
                className="left-taunt-more"
                onClick={() => {
                  sounds.click();
                  setTab('chat');
                }}
              >
                All 12 Roasts ➜
              </button>
            </div>
            <div className="left-taunt-grid">
              {QUICK_REACTIONS.slice(0, 6).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="taunt-pill-labeled"
                  onClick={() => game.sendReaction(r.id)}
                  title={r.text}
                >
                  <span className="tp-emoji">{r.emoji}</span>
                  <span className="tp-label">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="col-board">
          <PlayersStrip s={s} />
          <div className="board-slot">
            <Board
              deeds={s.deeds}
              players={s.players}
              landed={s.landed}
              activeId={current?.id}
              movingId={s.moving}
              boomGroup={s.boomGroup}
              bullRun={s.bullRun}
              onTileClick={(id) => {
                sounds.click();
                setDeedId(id);
              }}
              kitty={s.kitty}
              built={s.built}
            >
              <BoardCenter s={s} onTrade={() => canManage && setTradeOpen(true)} onOpenDeed={setDeedId} />
            </Board>
          </div>

          {/* Mobile / Compact Bottom Bar — Zero Page Scroll! */}
          <div className="mobile-dock-bar">
            <div className="mobile-quick-emojis">
              {QUICK_REACTIONS.slice(0, 4).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="mob-emoji-btn"
                  onClick={() => game.sendReaction(r.id)}
                  title={r.label}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
            <div className="mobile-sheet-toggles">
              <button
                type="button"
                className={`mob-tab-btn ${mobileSheet === 'empire' ? 'on' : ''}`}
                onClick={() => toggleSheet('empire')}
              >
                🏰 Empire
              </button>
              <button
                type="button"
                className={`mob-tab-btn ${mobileSheet === 'chat' ? 'on' : ''}`}
                onClick={() => toggleSheet('chat')}
              >
                <MessageCircle size={14} /> Adda
                {s.unreadChat > 0 && <span className="unread-dot">{s.unreadChat}</span>}
              </button>
              <button
                type="button"
                className={`mob-tab-btn ${mobileSheet === 'log' ? 'on' : ''}`}
                onClick={() => toggleSheet('log')}
              >
                📣 Log
              </button>
            </div>
          </div>
        </section>

        <aside className={`col-right panel ${mobileSheet ? 'sheet-open' : ''}`}>
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'empire'} className={tab === 'empire' ? 'on' : ''} onClick={() => { sounds.click(); setTab('empire'); }}>
              🏰 Empire
            </button>
            <button role="tab" aria-selected={tab === 'chat'} className={tab === 'chat' ? 'on' : ''} onClick={() => { sounds.click(); setTab('chat'); }}>
              💬 Adda {s.unreadChat > 0 && <span className="unread-dot">{s.unreadChat}</span>}
            </button>
            <button role="tab" aria-selected={tab === 'log'} className={tab === 'log' ? 'on' : ''} onClick={() => { sounds.click(); setTab('log'); }}>
              📣 Log
            </button>
            {mobileSheet && (
              <button type="button" className="sheet-close-btn" onClick={() => setMobileSheet(null)} aria-label="Close drawer">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="tab-body">
            {tab === 'empire' && (
              <EmpirePanel s={s} viewer={viewer} canManage={canManage} onTrade={() => { setMobileSheet(null); setTradeOpen(true); }} onOpenDeed={setDeedId} />
            )}
            {tab === 'chat' && <ChatPanel s={s} />}
            {tab === 'log' && <ActivityLog s={s} />}
          </div>
        </aside>
      </main>

      <Moments s={s} />

      {deedId != null && <DeedModal s={s} tileId={deedId} viewer={viewer} canManage={canManage} onClose={() => setDeedId(null)} />}
      {tradeOpen && viewer && canManage && <TradeModal s={s} me={viewer} onClose={() => setTradeOpen(false)} />}
      <IncomingTradeModal s={s} />
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
      {confirmQuit && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setConfirmQuit(false)}>
          <div className="modal modal-small" role="dialog" aria-modal="true">
            <div className="modal-head">
              <span className="modal-emoji">🚪</span>
              <div>
                <div className="modal-kicker">Leaving so soon?</div>
                <h2>{s.online?.active ? 'Leave Online Room?' : 'Pause this game?'}</h2>
              </div>
            </div>
            <p className="modal-p">
              {s.online?.active
                ? 'You will disconnect from the current online multiplayer room.'
                : 'Your game is saved at the start of every turn. You can resume it from the home screen.'}
            </p>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setConfirmQuit(false)}>Keep Playing</button>
              <button className="btn btn-red" onClick={() => { setConfirmQuit(false); onHome(); }}>Leave to Home</button>
            </div>
          </div>
        </div>
      )}
      {s.status === 'over' && <Victory s={s} onHome={onHome} onReplay={onReplay} />}
    </div>
  );
}
