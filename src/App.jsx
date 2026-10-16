import { useState } from 'react';
import { game, useGame } from './game/engine';
import { SEAT_COLORS } from './data/characters';
import { sounds } from './utils/sound';
import Landing from './components/Landing';
import Setup from './components/Setup';
import OnlineLobby from './components/OnlineLobby';
import GameScreen from './components/GameScreen';

function getInitialRoomFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return (params.get('room') || '').trim().toUpperCase();
  } catch {
    return '';
  }
}

export default function App() {
  const s = useGame();
  const initialRoom = getInitialRoomFromUrl();
  const [screen, setScreen] = useState(() => (initialRoom ? 'online' : 'landing'));
  const [lastConfig, setLastConfig] = useState(null);

  const start = (config) => {
    setLastConfig(config);
    sounds.victory();
    game.newGame(config);
  };

  const quickPlay = () => {
    let playerName = 'Seth Ji';
    try {
      playerName = localStorage.getItem('nonopoly.name') || 'Seth Ji';
    } catch {
      /* ignore */
    }
    start({
      mode: 'classic',
      startCash: 1500000,
      maxRounds: null,
      players: [
        { name: playerName, isAi: false, botId: 'gupta', tokenId: 'auto', color: SEAT_COLORS[0].color },
        { name: 'Gupta Ji', isAi: true, botId: 'gupta', tokenId: 'chai', color: SEAT_COLORS[1].color },
        { name: 'Bandra Bunty', isAi: true, botId: 'bunty', tokenId: 'bat', color: SEAT_COLORS[2].color },
        { name: 'Sharma Aunty', isAi: true, botId: 'aunty', tokenId: 'scooter', color: SEAT_COLORS[3].color },
      ],
    });
  };

  const home = () => {
    game.quit();
    if (window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setScreen('landing');
  };

  if (s.status !== 'idle') {
    return (
      <GameScreen
        onHome={home}
        onReplay={() => {
          if (lastConfig && !lastConfig.online?.active) start(lastConfig);
          else {
            game.quit();
            setScreen('setup');
          }
        }}
      />
    );
  }

  if (screen === 'online') {
    return (
      <OnlineLobby
        initialCode={initialRoom}
        onBack={() => {
          if (window.location.search) {
            window.history.replaceState({}, '', window.location.pathname);
          }
          setScreen('landing');
        }}
        onStartOnlineGame={start}
        onJoinStartedGame={(roomCode) => {
          sounds.victory();
          game.joinOnlineGameAsGuest(roomCode);
        }}
      />
    );
  }

  if (screen === 'setup') {
    return (
      <Setup
        onBack={() => setScreen('landing')}
        onStart={start}
        onSwitchOnline={() => setScreen('online')}
      />
    );
  }

  return (
    <Landing
      onPlayLocal={() => {
        sounds.dhol();
        setScreen('setup');
      }}
      onPlayOnline={() => {
        sounds.dhol();
        setScreen('online');
      }}
      onQuickPlay={quickPlay}
      onResume={() => game.resume()}
      hasSave={game.hasSave()}
    />
  );
}
