import { useEffect, useMemo, useState } from 'react';
import { TILES, GROUPS, isOwnable } from '../data/board';
import { BOTS } from '../data/characters';
import { TileArt } from '../art/tileArt';
import { BotPortrait } from '../art/characters';
import { Diya, Kite, Logo, Rangoli, Skyline, Toran } from '../art/decor';
import Board from './Board';
import Dice from './Dice';
import { RulesModal } from './Modals';

const DEMO_PLAYERS = [
  { id: 'd1', name: 'Raju', tokenId: 'auto', color: '#ff7a00', isAi: false },
  { id: 'd2', name: 'Bunty', tokenId: 'chai', color: '#e5007d', isAi: true, botId: 'bunty' },
  { id: 'd3', name: 'Tauji', tokenId: 'elephant', color: '#0097b2', isAi: true, botId: 'tauji' },
];

function demoDeeds() {
  const own = { 1: ['d1', 2], 3: ['d1', 2], 6: ['d3', 0], 9: ['d3', 0], 11: ['d2', 0], 14: ['d2', 0, true], 21: ['d3', 1], 23: ['d3', 1], 24: ['d3', 1], 25: ['d1', 0], 31: ['d2', 3], 32: ['d2', 3], 34: ['d2', 5], 39: ['d1', 0] };
  return TILES.map((t) => {
    if (!isOwnable(t)) return null;
    const o = own[t.id];
    return o ? { owner: o[0], level: o[1], mortgaged: !!o[2] } : { owner: null, level: 0, mortgaged: false };
  });
}

function DemoBoard() {
  const deeds = useMemo(() => demoDeeds(), []);
  const [pos, setPos] = useState([0, 12, 26]);
  const [mover, setMover] = useState(0);
  const [dice, setDice] = useState({ v: [5, 3], id: 0 });

  useEffect(() => {
    let tick = 0;
    const id = setInterval(() => {
      if (document.hidden) return;
      tick++;
      const phase = tick % 10;
      const m = Math.floor(tick / 10) % 3;
      if (phase === 0) setDice((d) => ({ v: [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)], id: d.id + 1 }));
      if (phase >= 4 && phase < 9) setPos((p) => p.map((v, i) => (i === m ? (v + 1) % 40 : v)));
      setMover(m);
    }, 260);
    return () => clearInterval(id);
  }, []);

  const players = DEMO_PLAYERS.map((p, i) => ({ ...p, pos: pos[i], bankrupt: false, inJail: false }));
  return (
    <div className="demo-stage" aria-hidden="true">
      <div className="demo-tilt">
        <Board deeds={deeds} players={players} activeId={players[mover].id} landed={null} kitty={250000} className="demo-board">
          <div className="demo-center">
            <Rangoli className="center-rangoli" />
            <Logo size="md" className="demo-logo" />
            <div className="demo-dice">
              <Dice dice={dice.v} rollId={dice.id} rolling={false} double={false} />
            </div>
          </div>
        </Board>
      </div>
    </div>
  );
}

const FEATURES = [
  { art: 2, title: 'Tota-wala Kismet', text: 'The parrot astrologer picks your fate: Shark Tank money, a Kerala lottery win, or an ED raid.' },
  { art: 7, title: 'Rishtedaar Surprises', text: 'Mausi turns up with six suitcases. A cousin wants a loan “for two days”. Nani’s FD matures.' },
  { art: 30, title: 'ED Raids & Tihar', text: 'Cash in the false ceiling? Straight to Tihar. Pay bail, use a neta’s pass, or roll doubles.' },
  { art: 20, title: 'Jugaad Gullak', text: 'Every tax and challan goes into the Gullak. Land on Jugaad Junction and smash it open.' },
  { art: 39, title: 'Tapri to Haveli', text: 'Own a full set and build: Chai Tapri → Dhaba → Showroom → Mega Mall → Royal Haveli.' },
  { art: 6, title: 'Live Neelaami', text: 'Skip a property and it goes to a live auction. Out-bid Tauji, if you dare.' },
];

export default function Landing({ onPlay, onResume, hasSave }) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const props = TILES.filter((t) => t.type === 'property' || t.type === 'transport');

  return (
    <div className="landing festive-bg">
      <Toran className="toran" />
      <div className="sky-deco" aria-hidden="true">
        <Kite className="kite k1" a="#ff4fa3" b="#ffd23f" />
        <Kite className="kite k2" a="#13c2b3" b="#ff9f1c" />
        <Kite className="kite k3" a="#ffd23f" b="#3443d0" />
        {Array.from({ length: 22 }, (_, i) => <span key={i} className="twinkle" style={{ '--x': `${(i * 37) % 100}%`, '--y': `${(i * 53) % 60 + 8}%`, '--d': `${(i % 7) * 0.4}s` }} />)}
      </div>

      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">भारत का अपना बिज़नेस गेम</div>
          <Logo size="xl" animated />
          <h1 className="hero-title">The Great Indian Business Game</h1>
          <p className="hero-tag">
            Buy <b>Marine Drive</b>. Build a <b>Royal Haveli</b> next to Hawa Mahal. Survive <b>ED raids</b>, nosy <b>rishtedaars</b> and
            the parrot astrologer’s <b>kismet</b>.
          </p>
          <div className="hero-cta">
            <button className="btn btn-xl" onClick={onPlay}>▶ Play Now</button>
            {hasSave && <button className="btn btn-lg btn-teal" onClick={onResume}>⟲ Resume game</button>}
            <button className="btn btn-lg btn-ghost" onClick={() => setRulesOpen(true)}>How to play</button>
          </div>
          <ul className="hero-facts">
            <li><b>40</b><span>desi landmarks</span></li>
            <li><b>2–6</b><span>players</span></li>
            <li><b>6</b><span>wild bots</span></li>
            <li><b>₹15L</b><span>to start</span></li>
          </ul>
        </div>
        <div className="hero-visual">
          <DemoBoard />
        </div>
      </section>

      <div className="skyline-wrap" aria-hidden="true">
        <Skyline className="skyline" />
        <div className="diya-row">
          {Array.from({ length: 9 }, (_, i) => <Diya key={i} className="diya" />)}
        </div>
      </div>

      <section className="section rivals">
        <div className="section-head">
          <span className="section-kicker">Meet your rivals</span>
          <h2>Six desi bots who want your money</h2>
        </div>
        <div className="rival-grid">
          {BOTS.map((b) => (
            <article key={b.id} className="rival">
              <BotPortrait id={b.id} className="rival-face" />
              <div className="rival-name">{b.name}</div>
              <div className="rival-title">{b.title} · <span>{b.style}</span></div>
              <p className="rival-quote">“{b.quote}”</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section features">
        <div className="section-head">
          <span className="section-kicker">Pure desi</span>
          <h2>Every tile, card and penalty is straight from India</h2>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature">
              <TileArt id={f.art} className="feature-art" />
              <div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="parade" aria-label="Board properties">
        <div className="parade-track">
          {[...props, ...props].map((t, i) => (
            <div key={`${t.id}-${i}`} className="parade-card" style={{ '--g': GROUPS[t.group].color }}>
              <span className="parade-band" />
              <TileArt id={t.id} className="parade-art" />
              <b>{t.short}</b>
              <small>{t.city}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <Rangoli className="final-rangoli" />
        <h2>Ready to become India’s biggest seth?</h2>
        <button className="btn btn-xl btn-pink" onClick={onPlay}>Shuru Karein! ▶</button>
        <p className="credits">Nonopoly is a fan-made parody board game. All places are real; all the drama is fiction.</p>
      </section>

      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
    </div>
  );
}
