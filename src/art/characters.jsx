// Token pawns and bot portraits.
import { useId } from 'react';
import { K, Svg } from './tileArt';

const o = { stroke: K, strokeWidth: 2.4, strokeLinejoin: 'round', strokeLinecap: 'round' };
const thin = { ...o, strokeWidth: 1.6 };

function Auto() {
  return (
    <>
      <path d="M9 35 Q9 13 30 13 H45 Q53 13 53 21 V35Z" fill="#ffd21a" {...o} />
      <path d="M7 34 H55 Q59 34 59 38 V46 H7Z" fill="#1aa85a" {...o} />
      <path d="M15 33 V22 Q15 18 21 18 H33 V33Z" fill="#fff6e0" {...thin} />
      <path d="M38 18 H45 Q50 18 50 23 V33 H38Z" fill="#cdeefd" {...thin} />
      <path d="M7 40 H59" stroke="#ffd21a" strokeWidth="2.2" />
      <circle cx="57" cy="38" r="2" fill="#fff3a0" {...thin} strokeWidth="1.1" />
      <circle cx="18" cy="48" r="6.5" fill="#262033" {...o} />
      <circle cx="18" cy="48" r="2.3" fill="#c9d1d9" />
      <circle cx="48" cy="48" r="6.5" fill="#262033" {...o} />
      <circle cx="48" cy="48" r="2.3" fill="#c9d1d9" />
    </>
  );
}

function Chai() {
  return (
    <>
      <path d="M22 13 q-3 -4 0 -8 M32 12 q-3 -4 0 -8 M42 13 q-3 -4 0 -8" stroke="#a7b0bb" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M15 17 H49 L45 59 H19Z" fill="#e8f4f8" />
      <path d="M16.2 28 H47.8 L45 59 H19Z" fill="#c98243" />
      <path d="M16.2 28 H47.8" stroke="#ecc79c" strokeWidth="3.4" />
      <path d="M24 31 L25.5 56 M32 31 V56 M40 31 L38.5 56" stroke="#fff" strokeOpacity=".35" strokeWidth="2.2" />
      <path d="M15 17 H49 L45 59 H19Z" fill="none" {...o} />
    </>
  );
}

function Bat() {
  return (
    <>
      <g transform="rotate(-35 30 32)">
        <rect x="27" y="1" width="6" height="18" rx="2" fill="#e2323a" {...o} />
        <path d="M27 6 h6 M27 10 h6 M27 14 h6" stroke="#ff8f8f" strokeWidth="1.2" />
        <path d="M23 19 H37 V55 Q37 60 33 60 H27 Q23 60 23 55Z" fill="#f2c97a" {...o} />
        <path d="M30 23 V56" stroke="#c99a4a" strokeWidth="1.6" />
        <rect x="23.5" y="25" width="13" height="4.5" fill="#3443d0" />
      </g>
      <circle cx="50" cy="49" r="8.5" fill="#d62828" {...o} />
      <path d="M43.5 45 Q50 49 56.5 45 M43.5 53 Q50 49 56.5 53" stroke="#fff" strokeWidth="1.3" fill="none" />
    </>
  );
}

function Scooter() {
  return (
    <>
      <path d="M22 47 Q20 30 36 29 H46 Q54 29 54 40 V47Z" fill="#59b6e8" {...o} />
      <path d="M12 47 L17 18 H24 L21 47Z" fill="#59b6e8" {...o} />
      <path d="M13 16 H28" {...o} />
      <circle cx="15" cy="20" r="3.4" fill="#fff3a0" {...thin} />
      <path d="M34 28 Q34 23 40 23 H50 Q54 23 53 28Z" fill="#262033" {...o} />
      <path d="M20 46 H40" stroke="#c9d1d9" strokeWidth="3" />
      <path d="M40 36 H50" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      <circle cx="16" cy="51" r="6" fill="#262033" {...o} />
      <circle cx="16" cy="51" r="2.2" fill="#c9d1d9" />
      <circle cx="47" cy="51" r="6" fill="#262033" {...o} />
      <circle cx="47" cy="51" r="2.2" fill="#c9d1d9" />
    </>
  );
}

function Elephant() {
  return (
    <>
      <path d="M8 42 Q6 21 28 19 Q42 18 47 26 V56 H41 V47 H22 V56 H15 V45 Q8 46 8 42Z" fill="#9aa3b5" {...o} />
      <path d="M18 22 Q29 18 40 21 V37 H18Z" fill="#e5007d" {...o} />
      <path d="M18 34 H40" stroke="#f5c000" strokeWidth="3" />
      <circle cx="23" cy="28" r="1.6" fill="#f5c000" />
      <circle cx="30" cy="27" r="1.6" fill="#f5c000" />
      <circle cx="36" cy="28" r="1.6" fill="#f5c000" />
      <circle cx="48" cy="28" r="11" fill="#9aa3b5" {...o} />
      <path d="M55 33 Q63 44 56 53 Q54 55 52.5 53 Q57 45 50 37" fill="#9aa3b5" {...o} />
      <path d="M41 21 Q32 26 36 39 Q44 39 46 30Z" fill="#c4cbd8" {...o} />
      <path d="M45 17 Q50 12 55 17 L50 23Z" fill="#f5c000" {...thin} />
      <circle cx="51" cy="26" r="1.5" fill={K} />
      <path d="M54 37 Q58 39 60 37" stroke="#fffaf0" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </>
  );
}

function Chappal() {
  return (
    <>
      <path d="M3 22 H13 M1 32 H11 M5 42 H13" stroke="#ff8a1a" strokeWidth="2.8" strokeLinecap="round" />
      <g transform="rotate(-25 36 32)">
        <path d="M26 5 Q38 1 44 9 Q48 19 44 33 Q42 45 44 53 Q42 62 34 62 Q24 60 26 50 Q28 40 24 28 Q20 12 26 5Z" fill="#4c6fe0" {...o} />
        <path d="M28 8 Q38 5 42 12 Q45 20 41.5 33 Q40 45 41.5 52 Q40 58 34 58.5 Q27 57.5 28.5 50 Q30.5 40 27 28 Q24 14 28 8Z" fill="#fff" />
        <path d="M26 27 Q33 18 35 13 Q37 18 44 27" fill="none" stroke={K} strokeWidth="6" strokeLinecap="round" />
        <path d="M26 27 Q33 18 35 13 Q37 18 44 27" fill="none" stroke="#4c6fe0" strokeWidth="3.2" strokeLinecap="round" />
      </g>
    </>
  );
}

const TOKEN_ART = { auto: Auto, chai: Chai, bat: Bat, scooter: Scooter, elephant: Elephant, chappal: Chappal };

export function TokenArt({ id, className }) {
  const Art = TOKEN_ART[id] || Auto;
  return (
    <Svg className={className}>
      <Art />
    </Svg>
  );
}

// ---------------- bot portraits ----------------

const SKIN = { a: '#d39a6a', b: '#c98a5e', c: '#b5784c', d: '#e0aa7c' };

const Face = ({ skin, children }) => (
  <>
    <circle cx="17.5" cy="35" r="3.6" fill={skin} {...thin} />
    <circle cx="46.5" cy="35" r="3.6" fill={skin} {...thin} />
    <ellipse cx="32" cy="34" rx="14.5" ry="16" fill={skin} {...o} />
    {children}
  </>
);

const Eyes = ({ y = 33 }) => (
  <>
    <circle cx="26.5" cy={y} r="1.6" fill={K} />
    <circle cx="37.5" cy={y} r="1.6" fill={K} />
  </>
);

function Gupta() {
  return (
    <>
      <path d="M6 64 Q8 50 32 48 Q56 50 58 64Z" fill="#fffaf0" {...o} />
      <path d="M26 49 L32 57 L38 49" fill="none" {...thin} />
      <Face skin={SKIN.a}>
        <path d="M18 31 Q17 22 21 19 M46 31 Q47 22 43 19" stroke="#8d8d8d" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M32 19 v6" stroke="#e2323a" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="26.5" cy="33" r="4.4" fill="#ffffff55" stroke={K} strokeWidth="1.8" />
        <circle cx="37.5" cy="33" r="4.4" fill="#ffffff55" stroke={K} strokeWidth="1.8" />
        <path d="M31 33 h2" stroke={K} strokeWidth="1.6" />
        <Eyes />
        <path d="M23 42 Q27.5 37.5 32 40.5 Q36.5 37.5 41 42 Q36.5 44.5 32 42.5 Q27.5 44.5 23 42Z" fill="#3a2a20" />
        <path d="M29 46.5 Q32 48 35 46.5" stroke={K} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </Face>
    </>
  );
}

function Bunty() {
  return (
    <>
      <path d="M6 64 Q8 50 32 48 Q56 50 58 64Z" fill="#ff5fa2" {...o} />
      <path d="M26 49 L32 58 L38 49Z" fill={SKIN.d} {...thin} />
      <path d="M27 55 Q32 60 37 55" stroke="#f5c000" strokeWidth="1.8" fill="none" />
      <Face skin={SKIN.d}>
        <path d="M17 31 Q14 12 31 11 Q49 9 48 29 Q46 19 35 19 Q27 23 17 31Z" fill="#2a1a12" {...o} />
        <rect x="20.5" y="29.5" width="10.5" height="7" rx="3" fill="#1d2433" stroke="#f5c000" strokeWidth="1.4" />
        <rect x="33" y="29.5" width="10.5" height="7" rx="3" fill="#1d2433" stroke="#f5c000" strokeWidth="1.4" />
        <path d="M31 32 h2" stroke="#f5c000" strokeWidth="1.4" />
        <path d="M22 31.5 l3 -1" stroke="#6d7ba0" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M22 42 Q32 50 42 42 Q41 47 32 49 Q23 47 22 42Z" fill="#5b4535" opacity=".35" />
        <path d="M28 43.5 Q33 46 37 42.5" stroke={K} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </Face>
    </>
  );
}

function Tauji() {
  return (
    <>
      <path d="M6 64 Q8 50 32 48 Q56 50 58 64Z" fill="#fffaf0" {...o} />
      <Face skin={SKIN.c}>
        <path d="M15 29 Q12 9 32 8 Q52 9 49 29 Q44 21 32 21 Q20 21 15 29Z" fill="#ff7a00" {...o} />
        <path d="M18 20 Q32 13 46 20 M16 25 Q32 17 48 25" stroke="#c45500" strokeWidth="1.6" fill="none" />
        <path d="M44 14 q8 -4 9 4 q-3 -1 -5 2z" fill="#ff7a00" {...thin} />
        <Eyes y={32} />
        <path d="M23 30 l5 -1.5 M41 30 l-5 -1.5" stroke="#eee" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 41 Q24 37 18 40 Q15 42 13 38 Q14 45 21 44 Q27 43 32 43.5 Q37 43 43 44 Q50 45 51 38 Q49 42 46 40 Q40 37 32 41Z" fill="#f2f2f2" {...thin} />
        <path d="M28 47.5 Q32 49 36 47.5" stroke={K} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </Face>
    </>
  );
}

function SharmaAunty() {
  return (
    <>
      <path d="M6 64 Q8 50 32 48 Q56 50 58 64Z" fill="#7b2fbe" {...o} />
      <path d="M14 54 Q26 56 34 64" stroke="#f5c000" strokeWidth="3" fill="none" />
      <circle cx="45" cy="16" r="6" fill="#2a1a12" {...o} />
      {[[40, 12.5], [43, 10], [47, 10], [50, 13], [51, 17]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#fff" stroke={K} strokeWidth=".8" />)}
      <Face skin={SKIN.b}>
        <path d="M17.5 33 Q16 17 32 17 Q48 17 46.5 33 Q44 23 32 23.5 Q20 23 17.5 33Z" fill="#2a1a12" {...o} />
        <circle cx="32" cy="26.5" r="2" fill="#e2323a" />
        <Eyes y={33.5} />
        <path d="M24 30 q2.5 -1.5 5 0 M35 30 q2.5 -1.5 5 0" stroke={K} strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M27 42.5 Q32 46.5 37 42.5" stroke="#c0304a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <circle cx="17.5" cy="40" r="2" fill="#f5c000" stroke={K} strokeWidth=".9" />
        <circle cx="46.5" cy="40" r="2" fill="#f5c000" stroke={K} strokeWidth=".9" />
      </Face>
    </>
  );
}

function Chintu() {
  return (
    <>
      <path d="M6 64 Q8 50 32 48 Q56 50 58 64Z" fill="#ffb627" {...o} />
      <path d="M22 50 Q32 56 42 50" stroke="#c97f00" strokeWidth="2" fill="none" />
      <Face skin={SKIN.d}>
        <path d="M16 30 Q16 13 32 13 Q48 13 48 30Z" fill="#3443d0" {...o} />
        <path d="M16 27 Q8 27 6 24 Q10 21 17 23" fill="#2534a8" {...o} />
        <rect x="27" y="15" width="10" height="5" rx="2" fill="#ffd34d" {...thin} strokeWidth="1.1" />
        <path d="M24 33 q2.5 -2.5 5 0 M35 33 q2.5 -2.5 5 0" stroke={K} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M24 40 Q32 51 40 40Z" fill="#fff" {...thin} />
        <path d="M27 43.5 Q32 47 37 43.5" fill="#e2323a" />
      </Face>
      <rect x="47" y="40" width="10" height="17" rx="2" fill="#262033" {...thin} transform="rotate(12 52 48)" />
    </>
  );
}

function Simran() {
  return (
    <>
      <path d="M6 64 Q8 50 32 48 Q56 50 58 64Z" fill="#1fb5ad" {...o} />
      <path d="M24 49 Q32 55 40 49" stroke="#11817b" strokeWidth="2.2" fill="none" />
      <path d="M44 24 Q58 26 54 46 Q52 36 46 34Z" fill="#2a1a12" {...o} />
      <Face skin={SKIN.a}>
        <path d="M17.5 33 Q16 16 32 16 Q47 16 46.5 30 Q40 20 26 24 Q21 26 17.5 33Z" fill="#2a1a12" {...o} />
        <circle cx="26.5" cy="34" r="4.3" fill="#ffffff55" stroke="#7b2fbe" strokeWidth="1.8" />
        <circle cx="37.5" cy="34" r="4.3" fill="#ffffff55" stroke="#7b2fbe" strokeWidth="1.8" />
        <path d="M31 34 h2" stroke="#7b2fbe" strokeWidth="1.6" />
        <Eyes y={34} />
        <path d="M27.5 43 Q32 46 36.5 42.5" stroke={K} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </Face>
    </>
  );
}

const BOT_ART = {
  gupta: { Art: Gupta, bg: '#ffd166' },
  bunty: { Art: Bunty, bg: '#5ad1e6' },
  tauji: { Art: Tauji, bg: '#ffb35c' },
  aunty: { Art: SharmaAunty, bg: '#ff9fd0' },
  chintu: { Art: Chintu, bg: '#b6ec5a' },
  simran: { Art: Simran, bg: '#c9b8ff' },
};

export function BotPortrait({ id, className }) {
  const { Art, bg } = BOT_ART[id] || BOT_ART.gupta;
  const clip = `bp${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <clipPath id={clip}><circle cx="32" cy="32" r="32" /></clipPath>
      </defs>
      <circle cx="32" cy="32" r="32" fill={bg} />
      <g clipPath={`url(#${clip})`}>
        <Art />
      </g>
    </svg>
  );
}

// Unified avatar for any player: bots show a portrait, humans show their token.
export function PlayerAvatar({ player, className = '' }) {
  if (!player) return null;
  if (player.isAi) {
    return (
      <span className={`avatar ${className}`} style={{ '--pc': player.color }}>
        <BotPortrait id={player.botId} className="avatar-art" />
      </span>
    );
  }
  return (
    <span className={`avatar avatar-human ${className}`} style={{ '--pc': player.color }}>
      <TokenArt id={player.tokenId} className="avatar-art" />
    </span>
  );
}
