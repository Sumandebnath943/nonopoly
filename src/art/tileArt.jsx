// Hand-drawn sticker-style illustrations for every Nonopoly tile (64x64 viewBox).
import { useId } from 'react';

export const K = '#2a1408';
const o = { stroke: K, strokeWidth: 2.2, strokeLinejoin: 'round', strokeLinecap: 'round' };
const thin = { ...o, strokeWidth: 1.5 };

export const Svg = ({ children, className, title }) => (
  <svg viewBox="0 0 64 64" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
    {title && <title>{title}</title>}
    {children}
  </svg>
);

const Flag = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0 V12" {...o} fill="none" />
    <path d="M0 0 h9 v2.4 h-9z" fill="#ff8a1f" />
    <path d="M0 2.4 h9 v2.4 h-9z" fill="#fff" />
    <path d="M0 4.8 h9 v2.4 h-9z" fill="#1aa85a" />
    <circle cx="4.5" cy="3.6" r="0.9" fill="#1f3b9e" />
    <rect x="0" y="0" width="9" height="7.2" fill="none" {...thin} strokeWidth="1.2" />
  </g>
);

const Rail = () => <path d="M6 59 H58" {...o} />;

function ChandniChowk() {
  return (
    <>
      <Flag x={32} y={2} />
      <path d="M25 21 Q32 9 39 21 Z" fill="#fff6e0" {...o} />
      <rect x="25" y="21" width="14" height="6" fill="#fff6e0" {...o} />
      <path d="M8 25 Q12.5 17 17 25Z" fill="#fff6e0" {...o} />
      <rect x="8.5" y="25" width="8" height="5" fill="#fff6e0" {...o} />
      <path d="M47 25 Q51.5 17 56 25Z" fill="#fff6e0" {...o} />
      <rect x="47.5" y="25" width="8" height="5" fill="#fff6e0" {...o} />
      <rect x="6" y="30" width="52" height="28" rx="1" fill="#c9553a" {...o} />
      <rect x="6" y="30" width="52" height="5" fill="#e06f4f" {...o} />
      <path d="M24 58 V45 Q32 34 40 45 V58Z" fill="#4a1d0e" {...o} />
      <path d="M11 51 V45 Q14 41 17 45 V51Z" fill="#7a2c18" {...thin} />
      <path d="M47 51 V45 Q50 41 53 45 V51Z" fill="#7a2c18" {...thin} />
    </>
  );
}

function Paranthe() {
  return (
    <>
      <path d="M22 20 q-3 -4 0 -8 q3 -4 0 -8 M32 18 q-3 -4 0 -8 q3 -4 0 -8 M42 20 q-3 -4 0 -8 q3 -4 0 -8" fill="none" stroke="#a7b0bb" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 42 h6" {...o} strokeWidth="4" />
      <ellipse cx="33" cy="42" rx="25" ry="14" fill="#3b3b48" {...o} />
      <ellipse cx="33" cy="40" rx="18" ry="9.5" fill="#f2aa33" {...o} />
      <path d="M21 38 Q26 35 30 38 M35 43 Q40 40 45 43 M26 44 Q30 42 33 45" fill="none" stroke="#b5621a" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="29" y="32" width="8" height="6" rx="1.6" fill="#fff1a8" {...thin} />
    </>
  );
}

function VandeBharat() {
  return (
    <>
      <Rail />
      <path d="M15 56 V30 Q15 9 32 9 Q49 9 49 30 V56 Z" fill="#fdfdfd" {...o} />
      <path d="M20 30 Q20 15 32 15 Q44 15 44 30 Z" fill="#20375e" {...o} />
      <path d="M24 22 Q28 18.5 33 18.5" stroke="#8fb6ff" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M15 38 H49 V44 H15Z" fill="#ff8a1f" {...o} />
      <path d="M15 44 H49 V49 H15Z" fill="#2756d6" {...o} />
      <circle cx="21.5" cy="34" r="2.4" fill="#ffe27a" {...thin} />
      <circle cx="42.5" cy="34" r="2.4" fill="#ffe27a" {...thin} />
      <rect x="27" y="51" width="10" height="4" rx="1" fill="#9aa5b1" {...thin} />
    </>
  );
}

function Johari() {
  return (
    <>
      <path d="M10 60 V26 Q32 2 54 26 V60Z" fill="#f7a6c6" {...o} />
      <path d="M15 22 Q32 52 49 22" fill="none" stroke={K} strokeWidth="6.5" strokeLinecap="round" />
      <path d="M15 22 Q32 52 49 22" fill="none" stroke="#f5c000" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="21.8" cy="31.6" r="2.6" fill="#e2323a" {...thin} />
      <circle cx="42.2" cy="31.6" r="2.6" fill="#e2323a" {...thin} />
      <circle cx="27" cy="35.6" r="2.3" fill="#18a05a" {...thin} />
      <circle cx="37" cy="35.6" r="2.3" fill="#18a05a" {...thin} />
      <path d="M32 39 q-6.5 7 0 14 q6.5 -7 0 -14z" fill="#18a05a" {...o} />
      <circle cx="32" cy="38" r="3" fill="#e2323a" {...thin} />
      <path d="M30 44 l2 -2" stroke="#bff5d5" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

function GangaGhat() {
  return (
    <>
      <path d="M7 26 V16 L12.5 4 L18 16 V26Z" fill="#ff9a3c" {...o} />
      <path d="M8.5 16 H16.5 M8 21 H17" stroke={K} strokeWidth="1.4" />
      <path d="M12.5 4 V0.5 l5 1.8 -5 1.8" fill="#e2323a" {...thin} />
      <path d="M3 26 H22 V31 H30 V36 H38 V41 H46 V46 H62 V50 H3Z" fill="#f0d9a8" {...o} />
      <path d="M22 31 H3 M30 36 H3 M38 41 H3 M46 46 H3" stroke="#c9a96b" strokeWidth="1.3" />
      <path d="M2 49 Q12 45 22 49 T42 49 T62 49 V62 H2Z" fill="#3fa2e6" {...o} />
      <path d="M8 56 q4 -2 8 0 M27 57 q4 -2 8 0 M48 55 q4 -2 8 0" stroke="#c4e8ff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M36 51 q6 5 12 0z" fill="#c4553a" {...thin} />
      <path d="M42 49 q-3.2 -3.5 0 -8.5 q3.2 5 0 8.5z" fill="#ffc93c" {...thin} strokeWidth="1.1" />
      <circle cx="42" cy="44" r="7" fill="#ffd84d" opacity=".25" />
    </>
  );
}

function HawaMahal() {
  const rows = [
    { y: 14, x0: 26, x1: 38 },
    { y: 22, x0: 20, x1: 44 },
    { y: 30, x0: 14, x1: 50 },
    { y: 38, x0: 8, x1: 56 },
    { y: 45, x0: 8, x1: 56 },
  ];
  return (
    <>
      <path d="M27 12 Q32 5 37 12" fill="#f08aa0" {...o} />
      <path d="M6 60 V36 H12 V28 H18 V20 H24 V12 H40 V20 H46 V28 H52 V36 H58 V60Z" fill="#f08aa0" {...o} />
      {rows.map((r) => {
        const out = [];
        for (let x = r.x0 + 1.5; x + 4 <= r.x1 - 0.5; x += 6) {
          out.push(
            <path key={`${r.y}-${x}`} d={`M${x} ${r.y + 5} V${r.y + 2} Q${x + 2} ${r.y - 0.6} ${x + 4} ${r.y + 2} V${r.y + 5}Z`} fill="#fff3e6" stroke={K} strokeWidth="1.1" />,
          );
        }
        return out;
      })}
      <path d="M27 60 V54 Q32 49 37 54 V60Z" fill="#7a2c3c" {...thin} />
    </>
  );
}

function CommercialSt() {
  return (
    <>
      <path d="M30 22 H54 L52 56 H32Z" fill="#1fb5ad" {...o} />
      <path d="M36 22 V17 a6 6 0 0 1 12 0 V22" fill="none" {...o} />
      <path d="M10 28 H38 L36 60 H12Z" fill="#ee3a8c" {...o} />
      <path d="M17 28 V22 a7 7 0 0 1 14 0 V28" fill="none" {...o} />
      <circle cx="24" cy="44" r="6.5" fill="#ffc93c" {...thin} />
      <text x="24" y="47.6" fontSize="9.5" fontWeight="900" textAnchor="middle" fill={K} fontFamily="Baloo 2, sans-serif">%</text>
    </>
  );
}

function Bijli() {
  return (
    <>
      <g stroke="#f5b800" strokeWidth="3" strokeLinecap="round">
        <path d="M32 2 V7 M11 10 l4 4 M53 10 l-4 4 M4 30 h6 M54 30 h6" />
      </g>
      <path d="M32 11 a16 16 0 0 0 -9 29.5 c2 2 3 4 3 7 h12 c0 -3 1 -5 3 -7 a16 16 0 0 0 -9 -29.5z" fill="#ffe14d" {...o} />
      <path d="M34 18 L26.5 31 h6 l-3 10 9.5 -14 h-6z" fill="#ff8a1a" {...thin} />
      <rect x="25" y="48" width="14" height="5" rx="1.5" fill="#aab4bf" {...o} />
      <rect x="27" y="53" width="10" height="5" rx="2" fill="#7c8794" {...o} />
    </>
  );
}

function TNagar() {
  const fold = (y, x, w, c) => (
    <g key={y}>
      <rect x={x} y={y} width={w} height="12" rx="2" fill={c} />
      <path d={`M${x} ${y + 8.5} H${x + w}`} stroke="#f5c000" strokeWidth="3" />
      <path d={`M${x + 3} ${y + 3.5} h2 M${x + 9} ${y + 3.5} h2 M${x + 15} ${y + 3.5} h2`} stroke="#ffe08a" strokeWidth="1.4" strokeLinecap="round" />
      <rect x={x} y={y} width={w} height="12" rx="2" fill="none" {...o} />
    </g>
  );
  return (
    <>
      {fold(46, 7, 50, '#7b2fbe')}
      {fold(34, 9, 46, '#1aa85a')}
      {fold(22, 11, 42, '#e5007d')}
      <circle cx="46" cy="13" r="7" fill="#f5c000" {...o} />
      <text x="46" y="16.6" fontSize="9" fontWeight="900" textAnchor="middle" fill="#8a5a00" fontFamily="Baloo 2, sans-serif">₹</text>
    </>
  );
}

function AmbassadorTaxi() {
  return (
    <>
      <path d="M5 53 H60" stroke={K} strokeWidth="2" opacity=".25" />
      <rect x="27.5" y="14.5" width="11" height="5.5" rx="1.2" fill="#fff" {...thin} />
      <path d="M6 46 V38 Q6 34 11 33 L18 32 L23 22 Q24.5 20 28 20 H40 Q43 20 45 23 L50 32 L55 33 Q59 34 59 38 V46Z" fill="#ffcc1a" {...o} />
      <path d="M25.5 23.5 H33 V31.5 H21.5Z" fill="#cdeefd" {...thin} />
      <path d="M35.5 23.5 H42 Q43 23.5 44 25 L47.5 31.5 H35.5Z" fill="#cdeefd" {...thin} />
      <path d="M6 41 H59" stroke="#d9a300" strokeWidth="1.6" />
      <path d="M3 44 H9 M56 44 H62" stroke="#9aa5b1" strokeWidth="3" strokeLinecap="round" />
      <circle cx="57" cy="37.5" r="1.8" fill="#fff6c0" {...thin} strokeWidth="1.1" />
      <circle cx="18" cy="46" r="6.5" fill="#2a2a33" {...o} />
      <circle cx="18" cy="46" r="2.5" fill="#c9d1d9" />
      <circle cx="47" cy="46" r="6.5" fill="#2a2a33" {...o} />
      <circle cx="47" cy="46" r="2.5" fill="#c9d1d9" />
    </>
  );
}

function MumbaiLocal() {
  return (
    <>
      <Rail />
      <rect x="20" y="5" width="24" height="6" rx="1" fill="#1a1a22" {...thin} />
      <text x="32" y="9.8" fontSize="4.6" fontWeight="800" textAnchor="middle" fill="#ffb000" fontFamily="Baloo 2, sans-serif">FAST</text>
      <rect x="14" y="11" width="36" height="45" rx="6" fill="#8e1f2c" {...o} />
      <rect x="18" y="16" width="12" height="13" rx="2" fill="#cdeefd" {...thin} />
      <rect x="34" y="16" width="12" height="13" rx="2" fill="#cdeefd" {...thin} />
      <rect x="14" y="34" width="36" height="7" fill="#ffc21a" {...o} />
      <circle cx="21" cy="47.5" r="2.6" fill="#fff3a0" {...thin} />
      <circle cx="43" cy="47.5" r="2.6" fill="#fff3a0" {...thin} />
      <rect x="28" y="45" width="8" height="5" rx="1" fill="#5b121c" {...thin} />
    </>
  );
}

function Calangute() {
  return (
    <>
      <circle cx="51" cy="12" r="7" fill="#ffc93c" {...o} />
      <path d="M2 38 Q16 34 32 38 T62 38 V48 H2Z" fill="#33b6e8" {...o} />
      <path d="M2 47 Q32 41 62 47 V62 H2Z" fill="#f6d796" {...o} />
      <path d="M14 57 Q11 39 20 22" fill="none" stroke={K} strokeWidth="6.4" strokeLinecap="round" />
      <path d="M14 57 Q11 39 20 22" fill="none" stroke="#a0662f" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M20 22 Q10 13 3 19 Q12 17 20 22 Q14 7 23 3 Q20 13 20 22 Q30 9 39 13 Q28 15 20 22 Q32 20 34 30 Q26 22 20 22Z" fill="#2fb344" {...o} />
      <path d="M44 57 L48 30" {...o} />
      <path d="M31 34 Q47 15 62 30 Z" fill="#ee3a8c" {...o} />
      <path d="M41 31.2 Q45 23 47.5 20.5 Q48.5 24 51.5 31.2" fill="#fff" {...thin} />
    </>
  );
}

function Anjuna() {
  const flags = [
    [6, 13.5, '#ee3a8c'], [16, 17, '#ffc93c'], [26, 19, '#1fb5ad'], [36, 19, '#ff8a1a'], [46, 17, '#3bb54a'], [56, 13.5, '#7b4fd6'],
  ];
  return (
    <>
      <path d="M1 10 Q32 25 63 10" fill="none" stroke={K} strokeWidth="1.5" />
      {flags.map(([x, y, c]) => (
        <path key={x} d={`M${x - 3.5} ${y - 1} L${x + 3.5} ${y - 1} L${x} ${y + 6}Z`} fill={c} {...thin} strokeWidth="1.1" />
      ))}
      <path d="M2 54 H62 V62 H2Z" fill="#f6d796" {...o} />
      <rect x="12" y="32" width="4" height="22" fill="#8b5a2b" {...o} />
      <rect x="48" y="32" width="4" height="22" fill="#8b5a2b" {...o} />
      <path d="M5 34 L32 22 L59 34Z" fill="#d9a441" {...o} />
      <path d="M14 30 L18 34 M24 26 L28 33 M36 26 L33 33 M46 30 L42 34" stroke="#a87418" strokeWidth="1.4" />
      <rect x="10" y="44" width="44" height="10" fill="#c9853f" {...o} />
      <rect x="21" y="36" width="22" height="7" rx="1.2" fill="#1fb5ad" {...thin} />
      <circle cx="16" cy="40" r="3" fill="#ee3a8c" {...thin} strokeWidth="1.1" />
      <circle cx="48" cy="40" r="3" fill="#ffc93c" {...thin} strokeWidth="1.1" />
    </>
  );
}

function CasinoCruise() {
  return (
    <>
      <path d="M32 24 V12 l7 2.5 -7 2.5" fill="#e2323a" {...thin} />
      <path d="M8 42 L32 13 L56 42" fill="none" stroke="#ffb000" strokeWidth="1.3" strokeDasharray="0.1 3" strokeLinecap="round" />
      <path d="M2 51 Q16 47 32 51 T62 51 V62 H2Z" fill="#2d4f9e" {...o} />
      <path d="M10 56 h8 M30 57 h10 M48 55 h8" stroke="#ffd84d" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
      <path d="M5 42 H59 L52 52 H12Z" fill="#fff" {...o} />
      <rect x="12" y="33" width="40" height="9" fill="#e2323a" {...o} />
      <rect x="19" y="25" width="26" height="8" fill="#ffc93c" {...o} />
      {[16, 22, 28, 34, 40, 46].map((x) => <circle key={x} cx={x} cy="37.5" r="1.6" fill="#fff6a8" />)}
      {[23, 29, 35, 41].map((x) => <circle key={x} cx={x} cy="29" r="1.4" fill="#e2323a" />)}
      <text x="32" y="49.5" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#2d4f9e" fontFamily="Baloo 2, sans-serif">♠ ♥ ♦</text>
    </>
  );
}

function ConnaughtPlace() {
  return (
    <>
      <Flag x={52} y={2} s={0.95} />
      <rect x="2" y="17" width="58" height="6" fill="#e9e2d0" {...o} />
      <rect x="4" y="23" width="54" height="32" fill="#fbf8f0" {...o} />
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 7 + i * 10.4;
        return <path key={i} d={`M${x} 53 V36 Q${x + 4} 29 ${x + 8} 36 V53Z`} fill="#c7d3e0" {...thin} />;
      })}
      <path d="M4 28 H58" stroke="#d8cfb8" strokeWidth="1.4" />
      <path d="M2 55 H62 V61 H2Z" fill="#3bb54a" {...o} />
    </>
  );
}

function KhanMarket() {
  return (
    <>
      <rect x="6" y="12" width="52" height="46" fill="#f3e3c3" {...o} />
      <rect x="10" y="15" width="44" height="8" rx="1" fill="#1a1a2a" {...thin} />
      <text x="32" y="21.4" fontSize="6" fontWeight="800" textAnchor="middle" fill="#ffd34d" fontFamily="Baloo 2, sans-serif" letterSpacing=".5">CAFÉ • BOUTIQUE</text>
      <rect x="6" y="26" width="52" height="5" fill="#e2323a" {...o} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <path key={i} d={`M${6 + i * 6.5} 31 q3.25 5 6.5 0z`} fill={i % 2 ? '#fff' : '#e2323a'} {...thin} />
      ))}
      <rect x="10" y="39" width="22" height="15" fill="#cdeefd" {...thin} />
      <path d="M18 47 h7 v4 q0 2.5 -3.5 2.5 q-3.5 0 -3.5 -2.5z M25 48 h1.5 a1.5 1.5 0 0 1 0 3 H25" fill="#fff" {...thin} strokeWidth="1.1" />
      <path d="M20 45 q-1 -2 0 -3.5 M23 45 q-1 -2 0 -3.5" stroke="#9aa5b1" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <rect x="37" y="38" width="15" height="20" fill="#a0522d" {...o} />
      <circle cx="49" cy="48" r="1.2" fill="#ffd34d" />
    </>
  );
}

function CyberHub() {
  const lines = (x0, x1, y0, y1) => {
    const out = [];
    for (let y = y0 + 5; y < y1; y += 5) out.push(`M${x0} ${y} H${x1}`);
    return out.join(' ');
  };
  return (
    <>
      <path d="M8 58 V24 L20 18 V58Z" fill="#5aa9e6" {...o} />
      <path d={lines(8, 20, 22, 58)} stroke="#d6ecff" strokeWidth="1" opacity=".75" />
      <rect x="40" y="20" width="16" height="38" fill="#7cc4f0" {...o} />
      <path d={lines(40, 56, 20, 58)} stroke="#e6f5ff" strokeWidth="1" opacity=".8" />
      <rect x="22" y="5" width="17" height="53" fill="#2f7fd1" {...o} />
      <path d={lines(22, 39, 5, 58)} stroke="#bfe0ff" strokeWidth="1" opacity=".7" />
      <path d="M26 9 L35 20 M26 24 L35 35" stroke="#fff" strokeWidth="1.6" opacity=".55" strokeLinecap="round" />
      <path d="M3 58 H61" {...o} />
    </>
  );
}

function DelhiMetro() {
  return (
    <>
      <Rail />
      <path d="M14 56 V20 Q14 9 25 9 H39 Q50 9 50 20 V56Z" fill="#e9eef3" {...o} />
      <rect x="18" y="14" width="28" height="15" rx="4" fill="#253b5e" {...o} />
      <path d="M22 19 Q26 16.5 30 16.5" stroke="#8fb6ff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <rect x="14" y="35" width="36" height="4" fill="#e2323a" />
      <rect x="14" y="39" width="36" height="3" fill="#2f63d6" />
      <path d="M14 35 H50 M14 42 H50" stroke={K} strokeWidth="1.4" />
      <circle cx="32" cy="49" r="4.6" fill="#fff" {...thin} />
      <text x="32" y="51.5" fontSize="6.5" fontWeight="900" textAnchor="middle" fill="#2f63d6" fontFamily="Baloo 2, sans-serif">M</text>
      <rect x="17" y="46" width="6" height="3" rx="1" fill="#fff3a0" {...thin} strokeWidth="1.1" />
      <rect x="41" y="46" width="6" height="3" rx="1" fill="#fff3a0" {...thin} strokeWidth="1.1" />
    </>
  );
}

function Indiranagar() {
  return (
    <>
      <path d="M42 28 h5 a7 7 0 0 1 7 7 v7 a7 7 0 0 1 -7 7 h-5" fill="none" stroke={K} strokeWidth="7.2" />
      <path d="M42 28 h5 a7 7 0 0 1 7 7 v7 a7 7 0 0 1 -7 7 h-5" fill="none" stroke="#fff3d6" strokeWidth="3" />
      <rect x="13" y="21" width="30" height="36" rx="4" fill="#ffb627" {...o} />
      <path d="M20 29 V50" stroke="#ffe39a" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="31" cy="40" r="1.6" fill="#fff3c4" />
      <circle cx="35" cy="47" r="1.2" fill="#fff3c4" />
      <circle cx="28" cy="50" r="1.1" fill="#fff3c4" />
      <path d="M11 23 q-1 -8 7 -7 q2 -6 9 -4 q5 -4 10 1 q8 -1 8 7 q1 5 -3 6 H14 q-4 -1 -3 -3z" fill="#fffaf0" {...o} />
    </>
  );
}

function Koramangala() {
  return (
    <>
      <circle cx="16" cy="58" r="6" fill="#eceef3" {...thin} />
      <circle cx="48" cy="58" r="6" fill="#eceef3" {...thin} />
      <circle cx="32" cy="60" r="7" fill="#f6f7fa" {...thin} />
      <path d="M24 44 Q32 64 40 44Z" fill="#ffc93c" {...o} />
      <path d="M28 44 Q32 56 36 44Z" fill="#ff6b1a" />
      <path d="M20 34 L11 47 H20Z" fill="#ff8a1a" {...o} />
      <path d="M44 34 L53 47 H44Z" fill="#ff8a1a" {...o} />
      <path d="M32 3 Q44 13 44 31 V45 H20 V31 Q20 13 32 3Z" fill="#f4f4f8" {...o} />
      <path d="M32 3 Q38 8 41.4 15 H22.6 Q26 8 32 3Z" fill="#e2323a" {...o} />
      <circle cx="32" cy="26" r="5" fill="#5ac8fa" {...o} />
      <path d="M30 24 q1.5 -1.5 3 -1.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <text x="32" y="41.5" fontSize="7" fontWeight="900" textAnchor="middle" fill="#ff8a1a" fontFamily="Baloo 2, sans-serif">₹</text>
    </>
  );
}

function Upi() {
  const mods = [[34, 26], [38, 26], [34, 30], [40, 30], [36, 34], [26, 34], [30, 36], [40, 36], [34, 38], [24, 38]];
  return (
    <>
      <rect x="15" y="3" width="32" height="57" rx="6" fill="#262033" {...o} />
      <rect x="18.5" y="9" width="25" height="44" rx="2" fill="#fff" />
      <rect x="21.5" y="13" width="8" height="8" fill="none" stroke="#262033" strokeWidth="2" />
      <rect x="24" y="15.5" width="3" height="3" fill="#262033" />
      <rect x="32.5" y="13" width="8" height="8" fill="none" stroke="#262033" strokeWidth="2" />
      <rect x="35" y="15.5" width="3" height="3" fill="#262033" />
      <rect x="21.5" y="24" width="8" height="8" fill="none" stroke="#262033" strokeWidth="2" />
      <rect x="24" y="26.5" width="3" height="3" fill="#262033" />
      {mods.map(([x, y]) => <rect key={`${x}-${y}`} x={x - 0.5} y={y - 0.5} width="2.6" height="2.6" fill="#262033" />)}
      <text x="31" y="49" fontSize="7" fontWeight="900" textAnchor="middle" fill="#1aa85a" fontFamily="Baloo 2, sans-serif">₹ PAID</text>
      <circle cx="49" cy="49" r="9" fill="#1aa85a" {...o} />
      <path d="M44.5 49 l3.2 3.2 l5.5 -6.5" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function HitecCity() {
  return (
    <>
      <path d="M22 60 V16 Q38 4 54 16 V60Z" fill="#5fb3ea" {...o} />
      <path d="M22 22 Q38 11 54 22 M22 29 Q38 18 54 29 M22 36 H54 M22 43 H54 M22 50 H54" stroke="#e1f2ff" strokeWidth="1.2" fill="none" opacity=".85" />
      <path d="M30 13 V60 M38 9 V60 M46 12 V60" stroke="#2f7fd1" strokeWidth="1.2" />
      <path d="M27 18 L33 30" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity=".6" />
      <path d="M2 54 q0 8 9.5 8 q9.5 0 9.5 -8z" fill="#a0522d" {...o} />
      <path d="M4 52 q7.5 -8 15 0" fill="#fff4d0" {...thin} />
      <rect x="1.5" y="51" width="19" height="4" rx="2" fill="#c96a3a" {...thin} />
      <circle cx="9" cy="49" r="1" fill="#ff8a1a" />
      <circle cx="13" cy="48.5" r="1" fill="#3bb54a" />
    </>
  );
}

function Bandstand() {
  return (
    <>
      <circle cx="51" cy="20" r="7" fill="#ff8a5c" {...thin} />
      <path d="M2 48 Q16 44 32 48 T62 48 V62 H2Z" fill="#33a3e0" {...o} />
      <path d="M10 55 q4 -2 8 0 M40 56 q4 -2 8 0" stroke="#c4e8ff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <g stroke={K} strokeWidth="1">
        <path d="M32 13 L5 42 M32 15.5 L12 42 M32 18 L19 42 M32 20.5 L25 42 M32 13 L59 42 M32 15.5 L52 42 M32 18 L45 42 M32 20.5 L39 42" />
      </g>
      <path d="M2 42 H62" stroke={K} strokeWidth="5.4" />
      <path d="M2 42 H62" stroke="#d6dde4" strokeWidth="2.6" />
      <path d="M12 44 V50 M52 44 V50" stroke={K} strokeWidth="3" />
      <path d="M24 47 L31 9 H33 L40 47" fill="none" stroke={K} strokeWidth="5.2" strokeLinejoin="round" />
      <path d="M24 47 L31 9 H33 L40 47" fill="none" stroke="#efe7d4" strokeWidth="2.6" strokeLinejoin="round" />
    </>
  );
}

function Juhu() {
  return (
    <>
      <ellipse cx="32" cy="42" rx="29" ry="15" fill="#e6ebf0" {...o} />
      <ellipse cx="32" cy="41" rx="22" ry="10" fill="#f7f9fb" stroke="#c9d1d9" strokeWidth="1.5" />
      <path d="M11 42 Q13 29 26 30 Q35 28 37 35 Q39 44 28 46 Q15 47 11 42Z" fill="#e2582f" {...o} />
      <circle cx="18" cy="38" r="1.2" fill="#3bb54a" />
      <circle cx="30" cy="41" r="1.2" fill="#3bb54a" />
      <circle cx="22" cy="43" r="1.1" fill="#fff" />
      <rect x="21" y="29" width="7" height="5.5" rx="1.2" fill="#fff1a8" {...thin} />
      <path d="M37 41 q0 -11 10 -11 q10 0 10 11z" fill="#f2b45a" {...o} />
      <path d="M40 34 q7 -4 14 0" stroke="#fff3d0" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M36 48 q0 -8 9 -8 q9 0 9 8z" fill="#e9a347" {...o} />
      <path d="M16 49 a5 5 0 0 0 10 0z" fill="#ffe14d" {...thin} />
    </>
  );
}

function MarineDrive() {
  const id = useId().replace(/:/g, '');
  return (
    <>
      <defs>
        <clipPath id={`md${id}`}><circle cx="32" cy="32" r="28.5" /></clipPath>
      </defs>
      <circle cx="32" cy="32" r="29" fill="#1d2a5c" />
      <g clipPath={`url(#md${id})`}>
        <path d="M8 20 h7 v18 h-7z M16 14 h6 v24 h-6z M23 22 h5 v16 h-5z M46 10 h7 v22 h-7z M54 18 h8 v14 h-8z" fill="#0f1838" />
        <path d="M17.5 18 h3 M17.5 23 h3 M47.5 15 h4 M47.5 20 h4" stroke="#ffd84d" strokeWidth="1.2" opacity=".7" />
        <path d="M0 42 Q28 60 66 28 V66 H0Z" fill="#2b4a8f" />
        <path d="M4 41 Q28 58 61 29" fill="none" stroke="#ffd84d" strokeWidth="3" strokeDasharray="0.1 4.4" strokeLinecap="round" />
      </g>
      <path d="M38 12 a6 6 0 1 0 6 8 a5 5 0 1 1 -6 -8z" fill="#fff6c8" />
      <circle cx="12" cy="10" r="0.9" fill="#fff" />
      <circle cx="28" cy="7" r="0.9" fill="#fff" />
      <circle cx="56" cy="8" r="0.9" fill="#fff" />
      <circle cx="32" cy="32" r="29" fill="none" {...o} />
    </>
  );
}

function ToyTrain() {
  return (
    <>
      <path d="M2 42 L18 16 L28 29 L41 9 L62 42Z" fill="#9fd4b4" {...o} />
      <path d="M14 22.5 L18 16 L22 21.5 Z M37 15 L41 9 L45 15.5Z" fill="#fff" {...thin} />
      <circle cx="12" cy="10" r="5" fill="#eef0f4" {...thin} />
      <circle cx="19" cy="17" r="4" fill="#eef0f4" {...thin} />
      <circle cx="25" cy="23" r="3" fill="#eef0f4" {...thin} />
      <Rail />
      <path d="M23 37 V28 h6 v9" fill="#262033" {...o} />
      <rect x="18" y="36" width="28" height="13" rx="3" fill="#2d5fc9" {...o} />
      <rect x="44" y="28" width="15" height="21" rx="1.5" fill="#2d5fc9" {...o} />
      <rect x="47" y="31" width="9" height="7" fill="#cdeefd" {...thin} />
      <rect x="42" y="25" width="19" height="4" rx="1" fill="#e2323a" {...thin} />
      <path d="M18 46 L12 53 H19Z" fill="#262033" {...thin} />
      <path d="M18 42 H46" stroke="#ffd34d" strokeWidth="1.6" />
      <circle cx="25" cy="52" r="5" fill="#e2323a" {...o} />
      <circle cx="37" cy="52" r="5" fill="#e2323a" {...o} />
      <circle cx="52" cy="53" r="4" fill="#e2323a" {...o} />
    </>
  );
}

function JubileeHills() {
  return (
    <>
      <path d="M2 61 Q20 31 40 35 Q54 37 62 47 V61Z" fill="#59b85c" {...o} />
      <path d="M8 40 Q7 30 12 22" fill="none" stroke={K} strokeWidth="4.6" strokeLinecap="round" />
      <path d="M8 40 Q7 30 12 22" fill="none" stroke="#a0662f" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 22 Q5 16 1 20 Q7 19 12 22 Q9 13 14 10 Q13 16 12 22 Q18 14 23 17 Q17 18 12 22Z" fill="#2fb344" {...thin} />
      <rect x="20" y="22" width="32" height="17" fill="#fffaf0" {...o} />
      <path d="M16 23 L36 11 L56 23Z" fill="#c9553a" {...o} />
      <rect x="24" y="26" width="5" height="6" fill="#ffd84d" {...thin} strokeWidth="1.1" />
      <rect x="43" y="26" width="5" height="6" fill="#ffd84d" {...thin} strokeWidth="1.1" />
      <rect x="33" y="29" width="6" height="10" fill="#a0522d" {...thin} />
      <path d="M31 39 V24 M41 39 V24" stroke="#d8cfb8" strokeWidth="1.6" />
      <path d="M22 44 Q36 40 50 44" stroke="#f6d796" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  );
}

function Altamount() {
  const blocks = [
    [18, 48, 28, 12],
    [13, 38, 28, 10],
    [21, 28, 28, 10],
    [15, 18, 28, 10],
    [22, 10, 20, 8],
  ];
  return (
    <>
      {blocks.map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill={i % 2 ? '#9aa1b2' : '#7c8395'} {...o} />
          <rect x={x + 3} y={y + 2.5} width={w - 6} height={h - 5.5} fill="#bfe0f7" opacity=".85" />
          <path d={`M${x} ${y} h${Math.min(8, w)}`} stroke="#3bb54a" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ))}
      <ellipse cx="32" cy="9.5" rx="10" ry="2.8" fill="#ffc93c" {...thin} />
      <text x="32" y="11.4" fontSize="4.5" fontWeight="900" textAnchor="middle" fill={K} fontFamily="Baloo 2, sans-serif">H</text>
      <path d="M2 60 H62" {...o} />
    </>
  );
}

// ---------- special tiles ----------

export function Kalash() {
  return (
    <>
      <path d="M32 25 Q19 22 9 11 Q23 10 32 25Z" fill="#2fb344" {...o} />
      <path d="M32 25 Q45 22 55 11 Q41 10 32 25Z" fill="#2fb344" {...o} />
      <path d="M32 25 Q24 16 22 4 Q31 10 32 25Z" fill="#3bc45a" {...o} />
      <path d="M32 25 Q40 16 42 4 Q33 10 32 25Z" fill="#3bc45a" {...o} />
      <circle cx="32" cy="17" r="8" fill="#8b5a2b" {...o} />
      <path d="M27 13 q5 -3 10 0" stroke="#c49060" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="23" y="24" width="18" height="7" rx="2.5" fill="#e09a00" {...o} />
      <path d="M23 27.5 h18" stroke="#e2323a" strokeWidth="2" />
      <path d="M18 35 Q13 53 32 57 Q51 53 46 35 Q44 30 32 30 Q20 30 18 35Z" fill="#f5b800" {...o} />
      <path d="M21 42 Q32 47 43 42" stroke="#e2323a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="50" r="2.6" fill="#e2323a" />
      <path d="M24 37 q3 -2 5 0" stroke="#fff5c0" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  );
}

export function JailCell() {
  return (
    <>
      <rect x="6" y="14" width="52" height="44" rx="3" fill="#6b7785" {...o} />
      <rect x="11" y="20" width="42" height="33" rx="2" fill="#2e3440" {...o} />
      <circle cx="32" cy="34" r="8" fill="#c98a5e" {...thin} />
      <path d="M24 53 Q24 43 32 43 Q40 43 40 53Z" fill="#fff" {...thin} />
      <path d="M24.5 47 H39.5 M24 50.5 H40" stroke={K} strokeWidth="1.8" />
      <circle cx="29" cy="33" r="1.1" fill={K} />
      <circle cx="35" cy="33" r="1.1" fill={K} />
      <path d="M29 38.5 q3 -2 6 0" stroke={K} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {[16, 23, 30, 37, 44, 51].map((x) => <path key={x} d={`M${x} 20 V53`} stroke="#b7c0cc" strokeWidth="2.6" />)}
      <path d="M11 30 H53" stroke="#b7c0cc" strokeWidth="2.2" />
      <rect x="18" y="5" width="28" height="9" rx="2" fill="#ff8a1a" {...thin} />
      <text x="32" y="12" fontSize="6.6" fontWeight="900" textAnchor="middle" fill="#fff" fontFamily="Baloo 2, sans-serif" letterSpacing=".6">TIHAR</text>
    </>
  );
}

export function ChaiKettle() {
  return (
    <>
      <path d="M14 22 Q8 12 19 10 Q30 10 31 18" fill="none" {...o} strokeWidth="2.6" />
      <path d="M33 30 L44 21 L47 23 L37 34Z" fill="#c9d1d9" {...o} />
      <path d="M10 42 Q7 24 21 21 Q35 24 33 42Z" fill="#d6dde4" {...o} />
      <rect x="9" y="41" width="25" height="5" rx="2" fill="#aab4bf" {...thin} />
      <circle cx="21" cy="19" r="2.4" fill="#aab4bf" {...thin} />
      <path d="M14 30 q2 -4 6 -5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M47 23 Q50 30 49 38" stroke="#b8651a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M40 38 H56 L54 58 H42Z" fill="#e7f3f8" />
      <path d="M40.8 43 H55.2 L54 58 H42Z" fill="#c8813a" />
      <path d="M40.8 43 H55.2" stroke="#e8c49a" strokeWidth="2" />
      <path d="M40 38 H56 L54 58 H42Z" fill="none" {...o} />
      <path d="M45 34 q-2 -3 0 -6 M51 34 q-2 -3 0 -6" stroke="#a7b0bb" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M2 58 H38" stroke="#8b5a2b" strokeWidth="3.4" strokeLinecap="round" />
    </>
  );
}

export function RaidSiren() {
  return (
    <>
      <g strokeWidth="3" strokeLinecap="round">
        <path d="M6 18 L12 22 M3 30 H10 M8 8 L14 14" stroke="#e2323a" />
        <path d="M58 18 L52 22 M61 30 H54 M56 8 L50 14" stroke="#2f63d6" />
      </g>
      <path d="M32 12 Q18 12 18 32 H32Z" fill="#ff3b3b" />
      <path d="M32 12 Q46 12 46 32 H32Z" fill="#3b6ff0" />
      <path d="M18 32 Q18 12 32 12 Q46 12 46 32Z" fill="none" {...o} />
      <path d="M24 22 q2 -5 6 -6" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".8" />
      <rect x="13" y="32" width="38" height="8" rx="2" fill="#262033" {...o} />
      <rect x="12" y="44" width="40" height="14" rx="2.5" fill="#fff" {...o} />
      <text x="32" y="54.6" fontSize="10" fontWeight="900" textAnchor="middle" fill="#e2323a" fontFamily="Baloo 2, sans-serif" letterSpacing="1">RAID</text>
    </>
  );
}

function TaxNotice() {
  return (
    <>
      <path d="M13 5 H41 L51 15 V59 H13Z" fill="#fffdf6" {...o} />
      <path d="M41 5 V15 H51" fill="#ece3cf" {...o} />
      <text x="20" y="18" fontSize="11" fontWeight="900" fill={K} fontFamily="Baloo 2, sans-serif">₹</text>
      <path d="M19 25 H40 M19 31 H45 M19 37 H43" stroke="#9aa5b1" strokeWidth="2" strokeLinecap="round" />
      <g transform="rotate(-14 36 48)">
        <circle cx="36" cy="48" r="9.5" fill="#fff0f0" stroke="#e2323a" strokeWidth="2.6" />
        <text x="36" y="51" fontSize="7.4" fontWeight="900" textAnchor="middle" fill="#e2323a" fontFamily="Baloo 2, sans-serif">TAX</text>
      </g>
    </>
  );
}

function WeddingRing() {
  return (
    <>
      <circle cx="32" cy="43" r="15" fill="none" stroke={K} strokeWidth="8.4" />
      <circle cx="32" cy="43" r="15" fill="none" stroke="#f5c000" strokeWidth="5" />
      <path d="M27 42 a10 10 0 0 1 6 -11" stroke="#fff3b0" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M26 28 L32 31 L38 28 L36 25 H28Z" fill="#e0a800" {...thin} />
      <path d="M21 16 L27 8 H37 L43 16 L32 28Z" fill="#bdeafe" {...o} />
      <path d="M21 16 H43 M27 8 L32 16 L37 8 M26.5 16 L32 28 L37.5 16" fill="none" stroke={K} strokeWidth="1.1" />
      <path d="M52 8 l1.4 3.6 3.6 1.4 -3.6 1.4 -1.4 3.6 -1.4 -3.6 -3.6 -1.4 3.6 -1.4z" fill="#ffd34d" />
      <path d="M11 22 l1 2.6 2.6 1 -2.6 1 -1 2.6 -1 -2.6 -2.6 -1 2.6 -1z" fill="#ffd34d" />
    </>
  );
}

export function Parrot() {
  return (
    <>
      <path d="M17 54 H47" stroke="#8b5a2b" strokeWidth="4" strokeLinecap="round" />
      <path d="M24 46 L13 61 L21 59 L29 47Z" fill="#1aa85a" {...o} />
      <path d="M22 47 Q15 31 25 20 Q33 12 42 17 Q49 23 45 34 Q41 46 31 51Z" fill="#3bc45a" {...o} />
      <path d="M24 31 Q31 26 37 34 Q33 45 27 47 Q22 41 24 31Z" fill="#1f9e48" {...o} />
      <path d="M30 27 Q38 31 45 27" stroke="#e2323a" strokeWidth="2.2" fill="none" />
      <path d="M44 19 Q53 19 51 28 Q48 25 43 25Z" fill="#e2323a" {...o} />
      <circle cx="40" cy="20.5" r="2.5" fill="#fff" stroke={K} strokeWidth="1.2" />
      <circle cx="40.6" cy="20.5" r="1.1" fill={K} />
      <g transform="rotate(14 52 35)">
        <rect x="46" y="27" width="12" height="16" rx="1.6" fill="#fff6e0" {...thin} />
        <text x="52" y="39" fontSize="9.5" fontWeight="900" textAnchor="middle" fill="#ff8a1a" fontFamily="Baloo 2, sans-serif">?</text>
      </g>
    </>
  );
}

export function Aunty() {
  return (
    <>
      <path d="M9 63 Q11 45 32 43 Q53 45 55 63Z" fill="#ee3a8c" {...o} />
      <path d="M17 47 Q29 54 33 63" stroke="#f5c000" strokeWidth="3.2" fill="none" />
      <circle cx="43" cy="17" r="5.5" fill="#2a1a12" {...o} />
      {[[38.5, 14], [41, 11.5], [45, 11.5], [47.5, 14.5], [48, 18.5]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.5" fill="#fff" stroke={K} strokeWidth=".8" />)}
      <circle cx="32" cy="29" r="12.5" fill="#c98a5e" {...o} />
      <path d="M19.5 29 Q18.5 14.5 32 14.5 Q45.5 14.5 44.5 29 Q42 20 32 20.5 Q22 20 19.5 29Z" fill="#2a1a12" {...o} />
      <circle cx="32" cy="23.5" r="1.8" fill="#e2323a" />
      <circle cx="27" cy="30" r="4" fill="#ffffff55" stroke={K} strokeWidth="1.6" />
      <circle cx="37" cy="30" r="4" fill="#ffffff55" stroke={K} strokeWidth="1.6" />
      <path d="M31 30 h2" stroke={K} strokeWidth="1.4" />
      <circle cx="27" cy="30.4" r="1" fill={K} />
      <circle cx="37" cy="30.4" r="1" fill={K} />
      <path d="M28 36.5 Q32 38.5 36 36.5" stroke={K} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="19.6" cy="33" r="1.8" fill="#f5c000" stroke={K} strokeWidth=".9" />
      <circle cx="44.4" cy="33" r="1.8" fill="#f5c000" stroke={K} strokeWidth=".9" />
      <path d="M48 2 H63 V14 H54 L50 18 V14 H48Z" fill="#fff" {...thin} />
      <text x="55.5" y="11.4" fontSize="8" fontWeight="900" textAnchor="middle" fill="#e5007d" fontFamily="Baloo 2, sans-serif">?!</text>
    </>
  );
}

const ART = {
  0: Kalash,
  1: ChandniChowk,
  2: Parrot,
  3: Paranthe,
  4: TaxNotice,
  5: VandeBharat,
  6: Johari,
  7: Aunty,
  8: GangaGhat,
  9: HawaMahal,
  10: JailCell,
  11: CommercialSt,
  12: Bijli,
  13: TNagar,
  14: AmbassadorTaxi,
  15: MumbaiLocal,
  16: Calangute,
  17: Parrot,
  18: Anjuna,
  19: CasinoCruise,
  20: ChaiKettle,
  21: ConnaughtPlace,
  22: Aunty,
  23: KhanMarket,
  24: CyberHub,
  25: DelhiMetro,
  26: Indiranagar,
  27: Koramangala,
  28: Upi,
  29: HitecCity,
  30: RaidSiren,
  31: Bandstand,
  32: Juhu,
  33: Parrot,
  34: MarineDrive,
  35: ToyTrain,
  36: Aunty,
  37: JubileeHills,
  38: WeddingRing,
  39: Altamount,
};

// Scenic poster backdrops per tile group/type so every tile looks like a vibrant miniature Indian travel poster
const TILE_SCENERY = {
  0: { sky: '#fff2b2', glow: '#ff9f1c', ground: '#ffbe3b' },
  1: { sky: '#ffe4c4', glow: '#ff8a1f', ground: '#d97b48' },
  2: { sky: '#d8f8e1', glow: '#2eb844', ground: '#8ae0a0' },
  3: { sky: '#ffe4c4', glow: '#ff8a1f', ground: '#d97b48' },
  4: { sky: '#ffd6dd', glow: '#e2323a', ground: '#f294a2' },
  5: { sky: '#dbeafe', glow: '#3b82f6', ground: '#93c5fd' },
  6: { sky: '#ffe0f0', glow: '#ff5ca8', ground: '#f7a6c6' },
  7: { sky: '#ffe0f4', glow: '#e5007d', ground: '#f5a3d0' },
  8: { sky: '#fff0c2', glow: '#ff9f1c', ground: '#7cc7ff' },
  9: { sky: '#ffe0f0', glow: '#ff5ca8', ground: '#f7a6c6' },
  10: { sky: '#ffe5c4', glow: '#ff7a00', ground: '#cfa07a' },
  11: { sky: '#ffdbf0', glow: '#ee3a8c', ground: '#f49ac2' },
  12: { sky: '#fff8c4', glow: '#f5c000', ground: '#cbd5e1' },
  13: { sky: '#ffdbf0', glow: '#ee3a8c', ground: '#f49ac2' },
  14: { sky: '#fff1c2', glow: '#ff8a1a', ground: '#d8b4e2' },
  15: { sky: '#fee2e2', glow: '#ef4444', ground: '#94a3b8' },
  16: { sky: '#fff3b0', glow: '#ff8a1a', ground: '#48cae4' },
  17: { sky: '#d8f8e1', glow: '#2eb844', ground: '#8ae0a0' },
  18: { sky: '#ffedd5', glow: '#f97316', ground: '#fcd34d' },
  19: { sky: '#1e1b4b', glow: '#f59e0b', ground: '#1d4ed8', night: true },
  20: { sky: '#dcfce7', glow: '#1aa85a', ground: '#86efac' },
  21: { sky: '#fee2e2', glow: '#e2323a', ground: '#fca5a5' },
  22: { sky: '#ffe0f4', glow: '#e5007d', ground: '#f5a3d0' },
  23: { sky: '#fee2e2', glow: '#e2323a', ground: '#fca5a5' },
  24: { sky: '#e0f2fe', glow: '#0284c7', ground: '#7dd3fc' },
  25: { sky: '#dbeafe', glow: '#2563eb', ground: '#93c5fd' },
  26: { sky: '#fef3c7', glow: '#f59e0b', ground: '#fde047' },
  27: { sky: '#fef3c7', glow: '#f59e0b', ground: '#fde047' },
  28: { sky: '#e0e7ff', glow: '#4f46e5', ground: '#a5b4fc' },
  29: { sky: '#e0f2fe', glow: '#0ea5e9', ground: '#fde047' },
  30: { sky: '#fecdd3', glow: '#e11d48', ground: '#fb7185' },
  31: { sky: '#d1fae5', glow: '#10b981', ground: '#38bdf8' },
  32: { sky: '#ffedd5', glow: '#f97316', ground: '#38bdf8' },
  33: { sky: '#d8f8e1', glow: '#2eb844', ground: '#8ae0a0' },
  34: { sky: '#172554', glow: '#fbbf24', ground: '#1e40af', night: true },
  35: { sky: '#dcfce7', glow: '#16a34a', ground: '#86efac' },
  36: { sky: '#ffe0f4', glow: '#e5007d', ground: '#f5a3d0' },
  37: { sky: '#e0e7ff', glow: '#4338ca', ground: '#818cf8' },
  38: { sky: '#ffe4e6', glow: '#e11d48', ground: '#fda4af' },
  39: { sky: '#1e1b4b', glow: '#ffd34d', ground: '#312e81', night: true },
};

export function TileArt({ id, className, title }) {
  const Art = ART[id];
  if (!Art) return null;
  const sc = TILE_SCENERY[id];
  return (
    <Svg className={className} title={title}>
      {sc && (
        <g aria-hidden="true">
          <rect x="2" y="2" width="60" height="60" rx="12" fill={sc.sky} />
          <circle cx="32" cy="26" r="21" fill={sc.glow} opacity={sc.night ? '0.28' : '0.32'} />
          <path d="M2 46 Q32 40 62 46 V52 Q62 62 52 62 H12 Q2 62 2 52Z" fill={sc.ground} opacity="0.55" />
          {sc.night && (
            <g fill="#fff9c4">
              <circle cx="12" cy="12" r="1.3" />
              <circle cx="24" cy="8" r="1.1" />
              <circle cx="50" cy="11" r="1.4" />
              <circle cx="40" cy="14" r="0.9" />
            </g>
          )}
          <rect x="2" y="2" width="60" height="60" rx="12" fill="none" stroke="rgba(42,20,8,0.18)" strokeWidth="1.5" />
        </g>
      )}
      <Art />
    </Svg>
  );
}

// Detailed 3D miniature building markers for the colour band & Empire cards.
export function BuildingIcon({ haveli = false, className }) {
  if (haveli) {
    return (
      <svg viewBox="0 0 28 22" className={className} aria-hidden="true">
        <path d="M2 20 V10 H6 V7 Q14 0 22 7 V10 H26 V20Z" fill="#ffd34d" stroke={K} strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M6 10 H22" stroke="#b87300" strokeWidth="1.2" />
        <path d="M11 20 V14 Q14 11 17 14 V20Z" fill="#c91838" stroke={K} strokeWidth="1.2" />
        <circle cx="7.5" cy="14.5" r="1.5" fill="#fff6b8" stroke={K} strokeWidth="0.9" />
        <circle cx="20.5" cy="14.5" r="1.5" fill="#fff6b8" stroke={K} strokeWidth="0.9" />
        <circle cx="14" cy="2.3" r="1.6" fill="#ff2e88" stroke={K} strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 18 18" className={className} aria-hidden="true">
      <path d="M2.5 16 V8 L9 2.2 L15.5 8 V16Z" fill="#fffaf0" stroke={K} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M1.5 8.5 L9 2 L16.5 8.5" fill="none" stroke="#e5007d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="7" y="10.5" width="4" height="5.5" rx="0.8" fill="#1aa85a" stroke={K} strokeWidth="1" />
    </svg>
  );
}
