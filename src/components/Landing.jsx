import { useEffect, useState, useMemo } from 'react';
import { BookOpen, Flame, Globe, MessageSquareQuote, Music, Play, RotateCcw, Sparkles, Users, Volume2, VolumeX, Zap } from 'lucide-react';
import { TILES, GROUPS } from '../data/board';
import { BOTS, TOKENS, SEAT_COLORS, botById } from '../data/characters';
import { TileArt } from '../art/tileArt';
import { BotPortrait, TokenArt } from '../art/characters';
import { Diya, Kite, Logo, Rangoli, Skyline, Toran } from '../art/decor';
import Dice from './Dice';
import { Modal } from './ui';
import { RulesModal } from './Modals';
import { sounds, MUSIC_TRACKS } from '../utils/sound';

const SHOWCASE_TILES = [39, 34, 9, 21, 16, 1, 5, 20];

const SAMPLE_ROASTS = [
  { botId: 'gupta', text: '“Paisa ped pe nahi ugta! Fixed deposit aur sona hi asli dharam hai.”' },
  { botId: 'bunty', text: '“Bro, real estate is Web4. Blitzscaling Marine Drive right now!”' },
  { botId: 'tauji', text: '“Jahan tak suraj ki kiran jaati hai, wahan tak Tauji ka toll chalta hai!”' },
  { botId: 'aunty', text: '“Chi chi, itna udhaar? Wait till I tell the colony WhatsApp group!”' },
  { botId: 'simran', text: '“My algorithm priced your bankruptcy three turns ago, sweetie.”' },
  { botId: 'chintu', text: '“Chat is this real?! Hand over 2x cash and give me the deed for the vlog!”' },
];

function HeroShowcase() {
  const [tab, setTab] = useState('properties'); // 'properties' | 'rivals' | 'dice'
  const [tileIdx, setTileIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [botIdx, setBotIdx] = useState(0);
  const [botRoast, setBotRoast] = useState('');
  const [dice, setDice] = useState({ v: [6, 6], id: 1, rolling: false, message: 'Tap to test your Kismet!' });

  // Auto-cycle properties when in properties tab and not interacted
  useEffect(() => {
    if (tab !== 'properties') return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setTileIdx((x) => (x + 1) % SHOWCASE_TILES.length);
      setFlipped(false);
    }, 3800);
    return () => clearInterval(id);
  }, [tab]);

  const tile = TILES[SHOWCASE_TILES[tileIdx]];
  const prevTile = TILES[SHOWCASE_TILES[(tileIdx - 1 + SHOWCASE_TILES.length) % SHOWCASE_TILES.length]];
  const nextTile = TILES[SHOWCASE_TILES[(tileIdx + 1) % SHOWCASE_TILES.length]];
  const groupColor = tile.group ? GROUPS[tile.group]?.color : '#1aa85a';

  const currentBot = BOTS[botIdx];

  const rollDemoDice = () => {
    sounds.dice();
    const a = 1 + Math.floor(Math.random() * 6);
    const b = 1 + Math.floor(Math.random() * 6);
    const sum = a + b;
    setDice((d) => ({ v: [a, b], id: d.id + 1, rolling: true, message: 'Rolling…' }));
    setTimeout(() => {
      let outcome = '';
      if (a === b) {
        sounds.dhol();
        outcome = `Double ${a}s! ⚡ Shagun Bonus ₹50,000 + Extra Roll!`;
      } else if (sum >= 10) {
        sounds.cash();
        outcome = `High Roll ${sum}! Landed on Marine Drive (Kiraya ₹2.5L)!`;
      } else if (sum === 7) {
        sounds.horn();
        outcome = `Lucky 7! Bazaar Utsav activated — all rents +50%!`;
      } else {
        outcome = `Rolled ${sum} · Passed Shagun Square (+₹2,00,000)!`;
      }
      setDice((d) => ({ ...d, rolling: false, message: outcome }));
    }, 750);
  };

  const playBotRoast = (b) => {
    sounds.horn();
    const sample = b.lines.collect || b.quote;
    setBotRoast(sample);
    setTimeout(() => setBotRoast(''), 4500);
  };

  return (
    <div className="showcase-stage">
      <Rangoli className="showcase-rangoli" />

      {/* Interactive Feature Switcher Header */}
      <div className="sc-mode-tabs" role="tablist">
        <button
          type="button"
          className={tab === 'properties' ? 'on' : ''}
          onClick={() => { sounds.click(); setTab('properties'); }}
        >
          🏙️ Properties
        </button>
        <button
          type="button"
          className={tab === 'rivals' ? 'on' : ''}
          onClick={() => { sounds.click(); setTab('rivals'); }}
        >
          🎭 6 Desi Bots
        </button>
        <button
          type="button"
          className={tab === 'dice' ? 'on' : ''}
          onClick={() => { sounds.click(); setTab('dice'); }}
        >
          🎲 Lucky Dice
        </button>
      </div>

      {/* TAB 1: PROPERTIES 3D CAROUSEL */}
      {tab === 'properties' && (
        <div className="showcase-cards">
          <div
            className="sc-card sc-side sc-left"
            style={{ '--g': prevTile.group ? GROUPS[prevTile.group]?.color : '#ff9f1c' }}
            onClick={() => {
              sounds.click();
              setTileIdx((x) => (x - 1 + SHOWCASE_TILES.length) % SHOWCASE_TILES.length);
              setFlipped(false);
            }}
          >
            <div className="sc-band">{prevTile.city || 'Desi Land'}</div>
            <TileArt id={prevTile.id} className="sc-art" />
            <b>{prevTile.short}</b>
          </div>

          <div
            key={tile.id}
            className={`sc-card sc-main ${flipped ? 'flipped' : ''}`}
            style={{ '--g': groupColor }}
            onClick={() => {
              sounds.pop();
              setFlipped((f) => !f);
            }}
            title="Click to flip & see rent specs"
          >
            {!flipped ? (
              <>
                <div className="sc-band">{tile.city || 'Desi Monopoly'}</div>
                <TileArt id={tile.id} className="sc-art-lg" />
                <div className="sc-title">{tile.name}</div>
                <div className="sc-price">
                  {tile.price ? `₹${(tile.price / 100000).toFixed(1).replace('.0', '')} Lakh` : 'Jackpot Corner'}
                </div>
                <span className="sc-tap-hint">Tap to see Haveli Rent 🔄</span>
              </>
            ) : (
              <div className="sc-back-content">
                <div className="sc-band">Specs &amp; Havelis</div>
                <div className="sc-spec-row">
                  <span>Base Rent:</span>
                  <b>₹{(tile.rent ? tile.rent[0] : 10000).toLocaleString('en-IN')}</b>
                </div>
                <div className="sc-spec-row highlight">
                  <span>🏰 Shahi Haveli:</span>
                  <b>₹{(tile.rent ? tile.rent[5] : 150000).toLocaleString('en-IN')}</b>
                </div>
                <div className="sc-spec-row">
                  <span>Group:</span>
                  <b>{tile.group ? GROUPS[tile.group]?.name : 'Special'}</b>
                </div>
                <div className="sc-spec-tag">Full Set = 2× Rent + Havelis</div>
                <span className="sc-tap-hint">Tap to flip back 🔄</span>
              </div>
            )}
          </div>

          <div
            className="sc-card sc-side sc-right"
            style={{ '--g': nextTile.group ? GROUPS[nextTile.group]?.color : '#e5007d' }}
            onClick={() => {
              sounds.click();
              setTileIdx((x) => (x + 1) % SHOWCASE_TILES.length);
              setFlipped(false);
            }}
          >
            <div className="sc-band">{nextTile.city || 'Desi Land'}</div>
            <TileArt id={nextTile.id} className="sc-art" />
            <b>{nextTile.short}</b>
          </div>
        </div>
      )}

      {/* TAB 2: INTERACTIVE RIVALS SPOTLIGHT */}
      {tab === 'rivals' && (
        <div className="showcase-rivals-box">
          <div className="rivals-selector-bar">
            {BOTS.map((b, i) => (
              <button
                key={b.id}
                type="button"
                className={`rival-icon-btn ${i === botIdx ? 'on' : ''}`}
                onClick={() => {
                  sounds.click();
                  setBotIdx(i);
                  setBotRoast('');
                }}
                title={b.name}
              >
                <BotPortrait id={b.id} />
              </button>
            ))}
          </div>

          <div className="rival-spotlight-card" style={{ '--bot-accent': SEAT_COLORS[botIdx % SEAT_COLORS.length].color }}>
            <div className="rsc-head">
              <div className="rsc-face-wrap">
                <BotPortrait id={currentBot.id} className="rsc-face" />
                <span className="rsc-badge">{currentBot.style}</span>
              </div>
              <div className="rsc-info">
                <div className="rsc-name">{currentBot.name}</div>
                <div className="rsc-title">{currentBot.title}</div>
                <div className="rsc-risk">Specialty: <b>{currentBot.specialty}</b></div>
              </div>
            </div>

            <p className="rsc-quote">“{currentBot.quote}”</p>

            {botRoast && (
              <div className="rsc-speech-bubble" role="status">
                <Flame size={14} className="flame-icon" />
                <span>{botRoast}</span>
              </div>
            )}

            <div className="rsc-actions">
              <button
                type="button"
                className="btn btn-sm btn-pink rsc-roast-btn"
                onClick={() => playBotRoast(currentBot)}
              >
                🔥 Hear Roast
              </button>
              <span className="rsc-ai-note">Smart Context AI Enabled</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LUCKY DICE STAGE */}
      {tab === 'dice' && (
        <div className="showcase-dice-stage">
          <button type="button" className="showcase-dice-btn" onClick={rollDemoDice} title="Tap to roll lucky dice!">
            <Dice dice={dice.v} rollId={dice.id} rolling={dice.rolling} double={dice.v[0] === dice.v[1]} />
            <span className="dice-cta-pill">🎲 Tap Dice to Roll!</span>
          </button>
          <div className="dice-outcome-pill">
            {dice.message}
          </div>
        </div>
      )}

      {/* Floating Pawns / Tokens Row */}
      <div className="showcase-tokens">
        {TOKENS.map((t, i) => (
          <span
            key={t.id}
            className="floating-token"
            style={{ '--i': i, '--pc': SEAT_COLORS[i].color }}
            title={`${t.name}: ${t.line}`}
            onClick={() => sounds.horn()}
          >
            <TokenArt id={t.id} />
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Landing({ onPlayLocal, onPlayOnline, onQuickPlay, onResume, hasSave }) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rivalsOpen, setRivalsOpen] = useState(false);
  const [muted, setMuted] = useState(sounds.muted);
  const [musicOn, setMusicOn] = useState(sounds.musicOn);
  const [track, setTrack] = useState(() => MUSIC_TRACKS.find((t) => t.id === sounds.trackId) || MUSIC_TRACKS[0]);

  // Live rotating ticker for funny desi roasts
  const [roastIdx, setRoastIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden) return;
      setRoastIdx((r) => (r + 1) % SAMPLE_ROASTS.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  const activeRoast = SAMPLE_ROASTS[roastIdx];
  const roastSpeaker = useMemo(() => botById(activeRoast.botId), [activeRoast.botId]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sounds.setMuted(next);
  };

  const switchTrack = () => {
    const res = sounds.cycleTrack();
    setMusicOn(res.musicOn);
    setTrack(res.track);
  };

  return (
    <div className="landing-locked festive-bg">
      <Toran className="toran" />

      <div className="sky-deco" aria-hidden="true">
        <Kite className="kite k1" a="#ff4fa3" b="#ffd23f" />
        <Kite className="kite k2" a="#13c2b3" b="#ff9f1c" />
        <Kite className="kite k3" a="#ffd23f" b="#3443d0" />
      </div>

      {/* Top Navigation Bar */}
      <header className="landing-topbar">
        <div className="topbar-left">
          <span className="desi-pill">🇮🇳 100% Desi Arcade Edition</span>
        </div>
        <div className="topbar-right">
          <button
            className={`chip-btn ${musicOn && !muted ? 'on' : ''}`}
            onClick={switchTrack}
            title="Switch Desi Music Groove"
          >
            <Music size={15} />
            <span>{track.icon} {track.name}</span>
          </button>
          <button className="icon-btn" onClick={toggleMute} title={muted ? 'Unmute Audio' : 'Mute Audio'}>
            {muted ? <VolumeX /> : <Volume2 />}
          </button>
          <button className="chip-btn" onClick={() => { sounds.click(); setRivalsOpen(true); }}>
            <Sparkles size={15} /> <span>6 Bots</span>
          </button>
          <button className="chip-btn" onClick={() => { sounds.click(); setRulesOpen(true); }}>
            <BookOpen size={15} /> <span>Rulebook</span>
          </button>
        </div>
      </header>

      {/* Main Single-Viewport Content */}
      <main className="landing-stage">
        <div className="landing-copy">
          <div className="hero-kicker-row">
            <span className="hero-kicker">भारत का अपना बिज़नेस गेम</span>
            <span className="hero-kicker-badge">★ Multiplayer Live</span>
          </div>

          <Logo size="xl" animated />

          {/* Live Desi Roast Ticker */}
          <div
            className="hero-roast-ticker"
            onClick={() => setRoastIdx((r) => (r + 1) % SAMPLE_ROASTS.length)}
            title="Click to next roast"
          >
            <span className="hrt-badge">
              <MessageSquareQuote size={13} /> Adda Roast
            </span>
            <span className="hrt-speaker">{roastSpeaker.name}:</span>
            <span className="hrt-text">{activeRoast.text}</span>
          </div>

          <h1 className="hero-title">The Great Indian Business Board Game</h1>
          <p className="hero-tag">
            Buy <b>Marine Drive</b> &amp; <b>Hawa Mahal</b>, build <b>Royal Havelis</b>, pull off <b>Hostile Kabza</b>, and outsmart <b>6 spicy AI rivals</b> — locally or live with friends!
          </p>

          {/* Feature Badge Pills */}
          <div className="hero-features-chips">
            <span className="hf-chip">🏰 Royal Havelis &amp; Spot Upgrades</span>
            <span className="hf-chip">⚡ Kabza / Takeovers</span>
            <span className="hf-chip">🗣️ Smart Bot Trash-Talk</span>
            <span className="hf-chip">🌐 Instant Room Codes</span>
          </div>

          {/* Action Cards */}
          <div className="landing-cta-grid">
            <button className="btn btn-xl btn-online-hero" onClick={onPlayOnline}>
              <div className="btn-icon-bubble">
                <Globe size={24} />
              </div>
              <span className="btn-stack">
                <span className="btn-badge-live">⚡ PLAY ONLINE WITH FRIENDS</span>
                <b>Multiplayer Room</b>
                <small>Create Private Room or Join via Code</small>
              </span>
            </button>

            <button className="btn btn-xl btn-local-hero" onClick={onPlayLocal}>
              <div className="btn-icon-bubble">
                <Users size={24} />
              </div>
              <span className="btn-stack">
                <span className="btn-badge-offline">🛋️ PASS &amp; PLAY</span>
                <b>Local Table &amp; Bots</b>
                <small>1-6 Players · 6 Desi AI Personalities</small>
              </span>
            </button>
          </div>

          <div className="landing-sub-ctas">
            <button className="btn btn-sm btn-teal" onClick={onQuickPlay}>
              <Zap size={15} /> Quick 4P Match
            </button>
            {hasSave && (
              <button className="btn btn-sm btn-pink" onClick={onResume}>
                <RotateCcw size={15} /> Resume Saved Game
              </button>
            )}
            <button className="btn btn-sm btn-ghost" onClick={() => { sounds.click(); setRulesOpen(true); }}>
              <Play size={14} /> Official Rules (6 Tabs)
            </button>
          </div>

          <ul className="hero-facts-compact">
            <li><b>40</b><span>Desi Sites</span></li>
            <li><b>Instant</b><span>Room Codes</span></li>
            <li><b>6</b><span>Smart Bots</span></li>
            <li><b>₹15L</b><span>Start Shagun</span></li>
          </ul>
        </div>

        <div className="landing-visual">
          <HeroShowcase />
        </div>
      </main>

      {/* Bottom Skyline & Diyas */}
      <footer className="landing-footer" aria-hidden="true">
        <Skyline className="skyline-compact" />
        <div className="diya-row-compact">
          {Array.from({ length: 7 }, (_, i) => <Diya key={i} className="diya" />)}
        </div>
      </footer>

      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}

      {rivalsOpen && (
        <Modal onClose={() => setRivalsOpen(false)} className="modal-rules" label="Meet Your Rivals">
          <button className="modal-close" onClick={() => setRivalsOpen(false)} aria-label="Close">✕</button>
          <div className="modal-head">
            <span className="modal-emoji">🤖</span>
            <div>
              <div className="modal-kicker">Desi AI Personalities</div>
              <h2>Six Rivals Who Want Your Money</h2>
            </div>
          </div>
          <div className="rivals-modal-grid">
            {BOTS.map((b) => (
              <div key={b.id} className="rival-mini-card">
                <BotPortrait id={b.id} className="rival-mini-face" />
                <div>
                  <b>{b.name}</b>
                  <div className="rival-mini-role">{b.title} · {b.style}</div>
                  <p>“{b.quote}”</p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
