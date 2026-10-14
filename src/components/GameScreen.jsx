import { useEffect, useState } from 'react';
import { BookOpen, LogOut, Music, Volume2, VolumeX, Zap } from 'lucide-react';
import { game, useGame } from '../game/engine';
import { sounds } from '../utils/sound';
import { Logo } from '../art/decor';
import Board from './Board';
import BoardCenter from './BoardCenter';
import Moments from './Moments';
import { PlayersPanel, PlayersStrip } from './Players';
import { ActivityLog, EmpirePanel } from './SidePanel';
import { DeedModal, RulesModal, TradeModal, Victory } from './Modals';

const FILLER_NEWS = [
  'SENSEX up 800 points as Chandni Chowk jalebi futures go parabolic',
  'Silk Board traffic jam enters its 3rd day; commuters start a WhatsApp group and two startups',
  'Gold hits record high. Every Indian mother now says “I told you so”',
  'Mumbai Local ran on time today. Commuters suspect a conspiracy',
  'Tota-wala parrot astrologer raises Series A at ₹500 crore valuation',
  'RBI says Jugaad is officially a renewable resource',
  'Sharma Ji’s son now owns a Haveli. Neighbourhood morale at record low',
  'Monsoon arrives early, finds every crack in every roof',
];

function NewsTicker({ headline }) {
  const [i, setI] = useState(0);
  const [live, setLive] = useState(null);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % FILLER_NEWS.length), 7000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!headline) return;
    setLive(headline);
    const t = setTimeout(() => setLive(null), 9000);
    return () => clearTimeout(t);
  }, [headline]);
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
  return (
    <header className="game-header">
      <Logo size="sm" className="header-logo" />
      <NewsTicker headline={s.headline} />
      <div className="header-ctrls">
        <button className={`icon-btn ${speed === 'fast' ? 'on' : ''}`} onClick={() => game.setSetting('speed', speed === 'fast' ? 'normal' : 'fast')} title={speed === 'fast' ? 'Fast mode on' : 'Fast mode off'} aria-pressed={speed === 'fast'}>
          <Zap />
        </button>
        <button className="icon-btn" onClick={() => game.setSetting('muted', !muted)} title={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}>
          {muted ? <VolumeX /> : <Volume2 />}
        </button>
        <button className={`icon-btn ${music ? 'on' : ''}`} onClick={() => setMusic(sounds.toggleMusic())} title="Tabla lo-fi music" aria-pressed={music} disabled={muted}>
          <Music />
        </button>
        <button className="icon-btn" onClick={onRules} title="How to play">
          <BookOpen />
        </button>
        <button className="icon-btn" onClick={onQuit} title="Leave game">
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
  const [tab, setTab] = useState('log');
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [activeViewerId, setActiveViewerId] = useState(() => s.players.find((p) => !p.isAi)?.id || null);

  const current = s.players[s.turn];
  const pp = s.prompt ? s.players.find((p) => p.id === s.prompt.pid) : null;
  const directViewer = pp && !pp.isAi ? pp : current && !current.isAi ? current : null;

  useEffect(() => {
    if (directViewer) setActiveViewerId(directViewer.id);
  }, [directViewer]);

  const viewer = directViewer || s.players.find((p) => p.id === activeViewerId) || s.players.find((p) => !p.isAi) || null;
  const canManage = !!viewer && game.canManage(viewer.id);

  // Jump to the Empire tab when a debt needs settling.
  useEffect(() => {
    if (s.prompt?.type === 'debt') setTab('empire');
  }, [s.prompt?.type]);

  // Keyboard: space/enter rolls or ends turn.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, select, .modal')) return;
      const pr = game.getState().prompt;
      if (!pr || (e.key !== ' ' && e.key !== 'Enter')) return;
      const who = game.getState().players.find((p) => p.id === pr.pid);
      if (who?.isAi) return;
      if (pr.type === 'roll' || pr.type === 'end' || pr.type === 'card') {
        e.preventDefault();
        game.respond(pr.type === 'roll' ? 'roll' : pr.type === 'end' ? 'end' : 'ok', pr.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="game festive-bg">
      <Header s={s} onRules={() => setRulesOpen(true)} onQuit={() => setConfirmQuit(true)} />
      <main className="game-main">
        <aside className="col-left panel">
          <PlayersPanel s={s} />
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
              onTileClick={setDeedId}
              kitty={s.kitty}
              built={s.built}
            >
              <BoardCenter s={s} onTrade={() => canManage && setTradeOpen(true)} onOpenDeed={setDeedId} />
            </Board>
          </div>
        </section>
        <aside className="col-right panel">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'log'} className={tab === 'log' ? 'on' : ''} onClick={() => setTab('log')}>📣 Activity</button>
            <button role="tab" aria-selected={tab === 'empire'} className={tab === 'empire' ? 'on' : ''} onClick={() => setTab('empire')}>🏰 Empire</button>
          </div>
          <div className="tab-body">
            {tab === 'log' ? (
              <ActivityLog s={s} />
            ) : (
              <EmpirePanel s={s} viewer={viewer} canManage={canManage} onTrade={() => setTradeOpen(true)} onOpenDeed={setDeedId} />
            )}
          </div>
        </aside>
      </main>

      <Moments s={s} />

      {deedId != null && <DeedModal s={s} tileId={deedId} viewer={viewer} canManage={canManage} onClose={() => setDeedId(null)} />}
      {tradeOpen && viewer && canManage && <TradeModal s={s} me={viewer} onClose={() => setTradeOpen(false)} />}
      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
      {confirmQuit && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setConfirmQuit(false)}>
          <div className="modal modal-small" role="dialog" aria-modal="true">
            <div className="modal-head">
              <span className="modal-emoji">🚪</span>
              <div>
                <div className="modal-kicker">Leaving so soon?</div>
                <h2>Pause this game?</h2>
              </div>
            </div>
            <p className="modal-p">Your game is saved at the start of every turn. You can resume it from the home screen.</p>
            <div className="modal-foot">
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmQuit(false)}>Keep playing</button>
              <button className="btn btn-red btn-sm" onClick={() => { setConfirmQuit(false); onHome(); }}>Leave to home</button>
            </div>
          </div>
        </div>
      )}
      {s.status === 'over' && <Victory s={s} onHome={onHome} onReplay={onReplay} />}
    </div>
  );
}
