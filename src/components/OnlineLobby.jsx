import { useEffect, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, Bot, Check, Copy, Plus, Send, Share2, Sparkles, Trash2, Users, Wifi } from 'lucide-react';
import { TOKENS, SEAT_COLORS, botById, tokenById } from '../data/characters';
import { TokenArt, BotPortrait } from '../art/characters';
import { Logo } from '../art/decor';
import { mp } from '../game/multiplayer';
import { sounds } from '../utils/sound';

const NAME_KEY = 'nonopoly.name';
const savedName = () => {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
};

const MODES = [
  { id: 'classic', icon: '👑', title: 'Classic Seth', sub: '₹15L start · Build from scratch', cash: 1500000 },
  { id: 'express', icon: '⚡', title: 'Express Jugaad', sub: '₹25L + 2 random plots each', cash: 2500000 },
];

const LENGTHS = [
  { v: 0, label: 'Endless' },
  { v: 25, label: '25 Rounds' },
  { v: 12, label: '12 Rounds' },
];

function useMultiplayer() {
  return useSyncExternalStore(mp.subscribe, mp.getSnapshot);
}

export default function OnlineLobby({ initialCode = '', onBack, onStartOnlineGame, onJoinStartedGame }) {
  const state = useMultiplayer();
  const [tab, setTab] = useState(initialCode ? 'join' : 'create');
  const [name, setName] = useState(() => savedName() || '');
  const [tokenId, setTokenId] = useState('auto');
  const [joinCode, setJoinCode] = useState(initialCode.toUpperCase());
  const [mode, setMode] = useState('classic');
  const [rounds, setRounds] = useState(0);
  const [copied, setCopied] = useState(null);
  const [chatText, setChatText] = useState('');

  // Auto-transition guest into GameScreen when host starts the game
  useEffect(() => {
    if (state.lobby?.status === 'playing' && !state.isHost && state.roomCode) {
      onJoinStartedGame(state.roomCode);
    }
  }, [state.lobby?.status, state.isHost, state.roomCode, onJoinStartedGame]);

  const savePlayerName = (n) => {
    const trimmed = n.trim();
    if (trimmed) {
      try {
        localStorage.setItem(NAME_KEY, trimmed);
      } catch {
        /* ignore */
      }
    }
  };

  const handleCreate = async () => {
    sounds.dhol();
    const cleanName = name.trim() || 'Seth Ji';
    savePlayerName(cleanName);
    await mp.createRoom({
      name: cleanName,
      tokenId,
      mode,
      maxRounds: rounds,
      bots: [],
    });
  };

  const handleJoin = async (e) => {
    e?.preventDefault();
    if (!joinCode.trim()) return;
    sounds.click();
    const cleanName = name.trim() || 'Dost';
    savePlayerName(cleanName);
    await mp.joinRoom({
      roomCode: joinCode,
      name: cleanName,
      tokenId,
    });
  };

  const handleCopyCode = () => {
    if (!state.roomCode) return;
    sounds.pop();
    navigator.clipboard?.writeText(state.roomCode).catch(() => {});
    setCopied('code');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyLink = () => {
    if (!state.roomCode) return;
    sounds.pop();
    const url = `${window.location.origin}${window.location.pathname}?room=${state.roomCode}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied('link');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!state.roomCode) return;
    sounds.click();
    const url = `${window.location.origin}${window.location.pathname}?room=${state.roomCode}`;
    const msg = `🇮🇳 Come play Nonopoly with me! Join Room Code *${state.roomCode}* or tap: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    const myIdx = state.lobby?.members.findIndex((m) => m.clientId === state.clientId) ?? 0;
    const myMember = state.lobby?.members[myIdx];
    const color = SEAT_COLORS[Math.max(0, myIdx) % SEAT_COLORS.length].color;
    mp.sendChat(myMember?.name || name || 'Player', color, chatText);
    setChatText('');
  };

  const handleLaunchGame = () => {
    if (!state.isHost || !state.lobby) return;
    const members = state.lobby.members;
    if (members.length < 2) return;
    sounds.victory();
    const selectedMode = MODES.find((m) => m.id === state.lobby.mode) || MODES[0];
    onStartOnlineGame({
      mode: selectedMode.id,
      startCash: selectedMode.cash,
      maxRounds: state.lobby.maxRounds || null,
      online: {
        active: true,
        roomCode: state.roomCode,
        isHost: true,
      },
      initialChat: state.lobby.chat || [],
      players: members.map((m, i) => ({
        clientId: m.clientId,
        name: m.isAi ? botById(m.botId).name : m.name || `Player ${i + 1}`,
        isAi: !!m.isAi,
        botId: m.botId || 'gupta',
        tokenId: m.tokenId || TOKENS[i % TOKENS.length].id,
        color: SEAT_COLORS[i % SEAT_COLORS.length].color,
      })),
    });
  };

  // ---------- VIEW 1: Create or Join Entry Screen ----------
  if (!state.roomCode || !state.lobby) {
    return (
      <div className="screen-locked festive-bg online-screen">
        <header className="compact-header">
          <button className="icon-btn" onClick={() => { sounds.click(); onBack(); }} aria-label="Back">
            <ArrowLeft />
          </button>
          <Logo size="sm" />
          <span className="header-pill online-badge"><Wifi size={14} /> Online Multiplayer</span>
        </header>

        <div className="online-entry-stage">
          <div className="online-card panel">
            <div className="online-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={tab === 'create'}
                className={tab === 'create' ? 'on' : ''}
                onClick={() => { sounds.click(); setTab('create'); mp.error = null; }}
              >
                <Sparkles size={16} /> Create Room
              </button>
              <button
                role="tab"
                aria-selected={tab === 'join'}
                className={tab === 'join' ? 'on' : ''}
                onClick={() => { sounds.click(); setTab('join'); mp.error = null; }}
              >
                <Users size={16} /> Join Room
              </button>
            </div>

            <div className="online-body">
              <div className="profile-strip">
                <div className="profile-avatar-pick">
                  <TokenArt id={tokenId} className="profile-token-preview" />
                </div>
                <div className="profile-inputs">
                  <label className="field-label">Your Tycoon Name</label>
                  <input
                    className="seat-input"
                    value={name}
                    maxLength={16}
                    placeholder="Enter your name (e.g. Raju)"
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="field-label">Choose Your Desi Token</div>
              <div className="token-row compact-tokens">
                {TOKENS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`token-pick ${tokenId === t.id ? 'on' : ''}`}
                    style={{ '--pc': '#ff9f1c' }}
                    onClick={() => { sounds.click(); setTokenId(t.id); }}
                    title={t.name}
                  >
                    <TokenArt id={t.id} />
                    <small>{t.name.split(' ').pop()}</small>
                  </button>
                ))}
              </div>

              {tab === 'create' ? (
                <div className="create-options">
                  <div className="field-label">Game Mode & Length</div>
                  <div className="mode-cards compact-modes">
                    {MODES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`mode-card ${mode === m.id ? 'on' : ''}`}
                        onClick={() => { sounds.click(); setMode(m.id); }}
                      >
                        <span className="mode-icon">{m.icon}</span>
                        <span>
                          <b>{m.title}</b>
                          <small>{m.sub}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="length-chips compact-lengths">
                    {LENGTHS.map((l) => (
                      <button
                        key={l.v}
                        type="button"
                        className={`length-chip ${rounds === l.v ? 'on' : ''}`}
                        onClick={() => { sounds.click(); setRounds(l.v); }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>

                  {state.error && <div className="online-error">⚠️ {state.error}</div>}

                  <button className="btn btn-lg btn-pink btn-block" disabled={state.connecting} onClick={handleCreate}>
                    {state.connecting ? 'Creating Room…' : '✨ Create Room & Invite Friends'}
                  </button>
                </div>
              ) : (
                <form className="join-options" onSubmit={handleJoin}>
                  <div className="field-label">Enter 4-Letter Room Code</div>
                  <input
                    className="room-code-input"
                    value={joinCode}
                    maxLength={6}
                    placeholder="ABCD"
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    autoFocus
                  />
                  <p className="online-hint">Ask the room host for their 4-letter code (works on Wi-Fi, LAN & mobile internet!)</p>

                  {state.error && <div className="online-error">⚠️ {state.error}</div>}

                  <button type="submit" className="btn btn-lg btn-teal btn-block" disabled={state.connecting || joinCode.length < 3}>
                    {state.connecting ? 'Connecting to Room…' : '🚀 Join Friend’s Room'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- VIEW 2: Active Waiting Room Lobby ----------
  const lobby = state.lobby;
  const members = lobby.members || [];
  const canStart = state.isHost && members.length >= 2;

  return (
    <div className="screen-locked festive-bg online-screen">
      <header className="compact-header">
        <button
          className="icon-btn"
          onClick={() => {
            sounds.click();
            mp.leaveRoom();
          }}
          title="Leave Room"
        >
          <ArrowLeft />
        </button>
        <Logo size="sm" />
        <div className="transport-pill">
          <span className="pulse-dot" />
          {state.transportMode === 'ws' ? 'Fast WS Server' : state.transportMode === 'cloud' ? 'Global Cloud P2P' : 'Local Multi-Tab'}
        </div>
      </header>

      <div className="lobby-grid">
        {/* Left / Top: Room Code Banner & Seats */}
        <div className="lobby-main panel">
          <div className="room-banner">
            <div className="room-code-box">
              <span className="room-kicker">ROOM CODE</span>
              <strong className="room-code-big">{state.roomCode}</strong>
            </div>
            <div className="room-share-btns">
              <button className="btn btn-sm" onClick={handleCopyCode}>
                {copied === 'code' ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Code</>}
              </button>
              <button className="btn btn-sm btn-teal" onClick={handleCopyLink}>
                {copied === 'link' ? <><Check size={15} /> Link Copied!</> : <><Share2 size={15} /> Invite Link</>}
              </button>
              <button className="btn btn-sm btn-green" onClick={handleWhatsAppShare}>
                WhatsApp
              </button>
            </div>
          </div>

          <div className="lobby-seats-head">
            <span>Players in Room ({members.length} / 6)</span>
            {state.isHost && members.length < 6 && (
              <button className="mini-btn build" onClick={() => { sounds.pop(); mp.addBotToLobby(); }}>
                <Plus size={13} /> Add Desi Bot
              </button>
            )}
          </div>

          <div className="lobby-seats-grid">
            {Array.from({ length: 6 }, (_, i) => {
              const m = members[i];
              const seatColor = SEAT_COLORS[i % SEAT_COLORS.length];
              if (!m) {
                return (
                  <div key={i} className="lobby-seat empty">
                    <span className="empty-circle">?</span>
                    <div className="empty-text">
                      <b>Open Seat {i + 1}</b>
                      <small>Waiting for friend to join…</small>
                    </div>
                    {state.isHost && (
                      <button className="mini-btn" onClick={() => { sounds.pop(); mp.addBotToLobby(); }}>
                        + Bot
                      </button>
                    )}
                  </div>
                );
              }

              const isMe = m.clientId === state.clientId;
              const bot = m.isAi ? botById(m.botId) : null;
              const tok = tokenById(m.tokenId);

              return (
                <div key={m.clientId || i} className={`lobby-seat filled ${isMe ? 'is-me' : ''}`} style={{ '--pc': seatColor.color }}>
                  <div className="lobby-seat-avatar">
                    {m.isAi ? <BotPortrait id={m.botId} /> : <TokenArt id={m.tokenId} />}
                  </div>
                  <div className="lobby-seat-info">
                    <div className="lobby-seat-top">
                      <b>{m.isAi ? bot.name : m.name}</b>
                      {m.isHost && <span className="host-tag">HOST</span>}
                      {isMe && <span className="you-tag">YOU</span>}
                      {m.isAi && <span className="bot-tag"><Bot size={11} /> BOT</span>}
                    </div>
                    <small>{m.isAi ? `${bot.title} · ${tok.name}` : tok.name}</small>
                    {isMe && (
                      <div className="lobby-my-tokens">
                        {TOKENS.map((t) => (
                          <button
                            key={t.id}
                            className={`mini-tok ${m.tokenId === t.id ? 'on' : ''}`}
                            onClick={() => { sounds.click(); mp.updateMyMember({ tokenId: t.id }); }}
                            title={t.name}
                          >
                            <TokenArt id={t.id} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {state.isHost && !m.isHost && (
                    <button
                      className="kick-btn"
                      onClick={() => { sounds.click(); mp.removeMemberFromLobby(m.clientId); }}
                      title="Remove from room"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="lobby-footer">
            {state.isHost ? (
              <div className="lobby-host-controls">
                <div className="lobby-quick-settings">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      className={`length-chip ${lobby.mode === m.id ? 'on' : ''}`}
                      onClick={() => { sounds.click(); mp.updateLobbySettings({ mode: m.id }); }}
                    >
                      {m.icon} {m.title}
                    </button>
                  ))}
                  {LENGTHS.map((l) => (
                    <button
                      key={l.v}
                      className={`length-chip ${lobby.maxRounds === l.v ? 'on' : ''}`}
                      onClick={() => { sounds.click(); mp.updateLobbySettings({ maxRounds: l.v }); }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <button className="btn btn-lg btn-pink" disabled={!canStart} onClick={handleLaunchGame}>
                  {canStart ? `Shuru Karein! ▶ (${members.length} Players)` : 'Need at least 2 players (or add a Bot)'}
                </button>
              </div>
            ) : (
              <div className="waiting-host-msg">
                <span className="pulse-dot" /> Waiting for Host to start the match… ({MODES.find((m) => m.id === lobby.mode)?.title})
              </div>
            )}
          </div>
        </div>

        {/* Right / Bottom: Live Room Chat */}
        <div className="lobby-chat panel">
          <div className="panel-title">💬 Adda Chat</div>
          <div className="lobby-chat-messages">
            {(lobby.chat || []).map((c) => (
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
          <form className="chat-input-row" onSubmit={handleSendChat}>
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Say namaste to your friends…"
              maxLength={120}
            />
            <button type="submit" className="btn btn-sm btn-pink" aria-label="Send message">
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
