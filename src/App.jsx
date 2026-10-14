import { useState } from 'react';
import { game, useGame } from './game/engine';
import { sounds } from './utils/sound';
import Landing from './components/Landing';
import Setup from './components/Setup';
import GameScreen from './components/GameScreen';

export default function App() {
  const s = useGame();
  const [screen, setScreen] = useState('landing');
  const [lastConfig, setLastConfig] = useState(null);

  const start = (config) => {
    setLastConfig(config);
    sounds.victory();
    game.newGame(config);
  };

  const home = () => {
    game.quit();
    setScreen('landing');
    window.scrollTo(0, 0);
  };

  if (s.status !== 'idle') {
    return (
      <GameScreen
        onHome={home}
        onReplay={() => {
          if (lastConfig) start(lastConfig);
          else {
            game.quit();
            setScreen('setup');
          }
        }}
      />
    );
  }

  if (screen === 'setup') {
    return <Setup onBack={() => setScreen('landing')} onStart={start} />;
  }

  return (
    <Landing
      onPlay={() => {
        sounds.dhol();
        setScreen('setup');
        window.scrollTo(0, 0);
      }}
      onResume={() => game.resume()}
      hasSave={game.hasSave()}
    />
  );
}
