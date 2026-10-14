// Festive decorations: rangoli, toran, skyline, kites, diyas, gullak and the logo.
import { useId } from 'react';
import { K } from './tileArt';

const petal = (len, w) =>
  `M0 0 C ${w} ${-len * 0.35} ${w * 0.6} ${-len * 0.85} 0 ${-len} C ${-w * 0.6} ${-len * 0.85} ${-w} ${-len * 0.35} 0 0Z`;

function Ring({ n, r, len, w, fill, offset = 0, stroke = K, sw = 1.2 }) {
  return Array.from({ length: n }, (_, i) => (
    <path
      key={i}
      d={petal(len, w)}
      transform={`rotate(${(i * 360) / n + offset}) translate(0 ${-r})`}
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinejoin="round"
    />
  ));
}

function Dots({ n, r, size, fill }) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={size} fill={fill} />;
  });
}

export function Rangoli({ className }) {
  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden="true">
      <circle r="97" fill="#fff3d9" stroke="#e9c98f" strokeWidth="1.2" />
      <Dots n={64} r={93} size={1.6} fill="#e5007d" />
      <Ring n={32} r={70} len={20} w={6} fill="#2fb0e8" />
      <Ring n={32} r={70} len={13} w={3.2} fill="#bfe9ff" offset={5.625} stroke="none" />
      <Dots n={32} r={66} size={2} fill="#ff8a1a" />
      <Ring n={24} r={50} len={20} w={8} fill="#1aa85a" />
      <Ring n={16} r={34} len={24} w={11} fill="#ff8a1a" />
      <Ring n={16} r={34} len={14} w={5} fill="#ffd34d" stroke="none" />
      <Ring n={12} r={16} len={22} w={10} fill="#ee3a8c" offset={15} />
      <Ring n={8} r={2} len={18} w={8.5} fill="#f5c000" />
      <circle r="7" fill="#e2323a" stroke={K} strokeWidth="1.4" />
      <circle r="3" fill="#ffd34d" />
    </svg>
  );
}

export function Toran({ className }) {
  const id = `toran${useId().replace(/:/g, '')}`;
  return (
    <svg className={className} width="100%" height="104" aria-hidden="true">
      <defs>
        <pattern id={id} width="76" height="104" patternUnits="userSpaceOnUse">
          <path d="M-2 8 Q38 24 78 8" stroke="#1f8f3a" strokeWidth="3.4" fill="none" />
          <path d="M17 15 q-7 11 0 24 q7 -13 0 -24z" fill="#2fb344" stroke={K} strokeWidth="1.4" />
          <path d="M59 15 q-7 11 0 24 q7 -13 0 -24z" fill="#2fb344" stroke={K} strokeWidth="1.4" />
          <path d="M17 17 v18 M59 17 v18" stroke="#1f8f3a" strokeWidth="1" />
          <path d="M38 16 V74" stroke="#d9a300" strokeWidth="1.4" />
          {[24, 37, 50, 63].map((y, i) => (
            <g key={y}>
              <circle cx="38" cy={y} r="7" fill={i % 2 ? '#ffc21a' : '#ff8a1a'} stroke={K} strokeWidth="1.2" />
              <circle cx="38" cy={y} r="4.6" fill="none" stroke={i % 2 ? '#ff9f1c' : '#ffb347'} strokeWidth="2.4" strokeDasharray="1.6 1.4" />
              <circle cx="38" cy={y} r="1.6" fill="#c45500" />
            </g>
          ))}
          <path d="M34 72 h8 l-1.5 8 h-5z" fill="#f5c000" stroke={K} strokeWidth="1.2" />
          <circle cx="38" cy="82" r="1.8" fill="#e2323a" />
        </pattern>
      </defs>
      <rect width="100%" height="104" fill={`url(#${id})`} />
    </svg>
  );
}

// Silhouette skyline of Indian landmarks.
export function Skyline({ className }) {
  const back = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let x = 0; x < 1440; x += 26 + Math.floor(rnd() * 20)) {
    const h = 40 + Math.floor(rnd() * 70);
    back.push(<rect key={x} x={x} y={260 - h} width={22 + Math.floor(rnd() * 14)} height={h} rx="2" />);
  }
  return (
    <svg viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <g className="sky-back">{back}</g>
      <g className="sky-front">
        {/* Qutub Minar */}
        <path d="M60 260 L65 66 L77 66 L82 260Z" />
        <rect x="56" y="134" width="30" height="6" rx="2" />
        <rect x="58" y="104" width="26" height="5" rx="2" />
        <rect x="60" y="82" width="22" height="5" rx="2" />
        <path d="M66 66 L71 50 L76 66Z" />
        {/* India Gate */}
        <path d="M130 260 V142 H232 V260 H202 V188 Q181 160 160 188 V260Z" />
        <rect x="135" y="129" width="92" height="15" rx="1" />
        <rect x="150" y="116" width="62" height="13" />
        <path d="M166 116 Q181 98 196 116Z" />
        {/* Taj Mahal */}
        <rect x="262" y="238" width="270" height="22" />
        <rect x="276" y="128" width="12" height="110" />
        <path d="M273 130 Q282 108 291 130Z" />
        <rect x="506" y="128" width="12" height="110" />
        <path d="M503 130 Q512 108 521 130Z" />
        <rect x="330" y="162" width="134" height="76" />
        <rect x="338" y="146" width="18" height="16" />
        <path d="M335 147 Q347 129 359 147Z" />
        <rect x="438" y="146" width="18" height="16" />
        <path d="M435 147 Q447 129 459 147Z" />
        <rect x="364" y="140" width="66" height="22" />
        <path d="M360 143 Q354 94 397 80 Q440 94 434 143Z" />
        <rect x="395" y="56" width="4" height="26" />
        <circle cx="397" cy="66" r="4.5" />
        {/* Gateway of India */}
        <path d="M566 260 V152 H698 V260 H652 V202 Q632 176 612 202 V260Z" />
        <rect x="560" y="122" width="24" height="32" />
        <path d="M558 123 Q572 102 586 123Z" />
        <rect x="680" y="122" width="24" height="32" />
        <path d="M678 123 Q692 102 706 123Z" />
        <rect x="606" y="136" width="52" height="16" />
        {/* Charminar */}
        <path d="M748 260 V172 H832 V260 H812 V218 Q790 190 768 218 V260Z" />
        <rect x="742" y="106" width="11" height="154" />
        <path d="M739 108 Q747.5 88 756 108Z" />
        <rect x="827" y="106" width="11" height="154" />
        <path d="M824 108 Q832.5 88 841 108Z" />
        <rect x="738" y="150" width="19" height="5" rx="2" />
        <rect x="823" y="150" width="19" height="5" rx="2" />
        <rect x="752" y="160" width="76" height="12" />
        {/* Lotus Temple */}
        <path d="M876 260 Q906 204 936 186 Q966 204 996 260Z" />
        <path className="sky-line" d="M900 260 Q918 196 936 166 Q954 196 972 260" />
        <path className="sky-line" d="M922 260 Q930 190 936 154 Q942 190 950 260" />
        {/* Howrah Bridge */}
        <rect x="1026" y="220" width="292" height="10" />
        <rect x="1080" y="120" width="14" height="140" />
        <rect x="1250" y="120" width="14" height="140" />
        <path className="sky-truss" d="M1032 222 L1087 122 L1172 176 L1257 122 L1312 222" />
        <path className="sky-truss thin" d="M1060 222 L1087 170 L1110 222 L1130 162 L1150 222 L1172 176 L1194 222 L1214 162 L1234 222 L1257 170 L1284 222" />
        {/* Hawa Mahal */}
        <path d="M1346 260 V206 H1356 V190 H1366 V174 H1376 V160 H1406 V174 H1416 V190 H1426 V206 H1436 V260Z" />
        <path d="M1378 160 Q1391 146 1404 160Z" />
      </g>
    </svg>
  );
}

export function Kite({ className, a = '#ff4fa3', b = '#ffd23f' }) {
  return (
    <svg viewBox="0 0 60 110" className={className} aria-hidden="true">
      <path d="M30 64 Q16 84 34 108" stroke="#fff" strokeOpacity=".55" strokeWidth="1.2" fill="none" />
      <path d="M30 2 L56 30 L30 64 L4 30Z" fill={a} stroke={K} strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 2 L56 30 L30 30Z M30 30 L4 30 L30 64Z" fill={b} />
      <path d="M30 2 L56 30 L30 64 L4 30Z" fill="none" stroke={K} strokeWidth="2" strokeLinejoin="round" />
      <path d="M30 2 V64 M7 27 Q30 15 53 27" stroke={K} strokeWidth="1.5" fill="none" />
      <path d="M30 63 L23 74 H37Z" fill={b} stroke={K} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function Diya({ className }) {
  return (
    <svg viewBox="0 0 64 52" className={className} aria-hidden="true">
      <ellipse cx="32" cy="20" rx="20" ry="18" fill="#ffb000" opacity=".22" className="diya-glow" />
      <g className="diya-flame">
        <path d="M32 3 Q23 16 32 26 Q41 16 32 3Z" fill="#ffb31a" stroke={K} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M32 12 Q28 18 32 23 Q36 18 32 12Z" fill="#fff4c2" />
      </g>
      <path d="M5 30 Q32 54 59 30 Q48 25 32 27 Q16 25 5 30Z" fill="#c4553a" stroke={K} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 34 Q32 46 52 34" stroke="#ffd34d" strokeWidth="2" fill="none" strokeDasharray="0.1 5" strokeLinecap="round" />
    </svg>
  );
}

export function Gullak({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M10 37 Q8 15 32 13 Q56 15 54 37 Q54 57 32 59 Q10 57 10 37Z" fill="#c96a3a" stroke={K} strokeWidth="2.4" strokeLinejoin="round" />
      <ellipse cx="32" cy="13" rx="9" ry="3.4" fill="#a0522d" stroke={K} strokeWidth="2" />
      <rect x="23" y="22" width="18" height="4" rx="2" fill="#3a1a0a" />
      <path d="M12 38 Q32 47 52 38" stroke="#ffd34d" strokeWidth="2.4" fill="none" />
      <path d="M14 44 Q32 52 50 44" stroke="#2fb0e8" strokeWidth="1.6" fill="none" strokeDasharray="2 3" />
      <path d="M18 26 Q20 20 26 18" stroke="#ea9c72" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <text x="32" y="36" fontSize="10" fontWeight="900" textAnchor="middle" fill="#ffd34d" fontFamily="Baloo 2, sans-serif">₹</text>
    </svg>
  );
}

const LOGO_COLORS = ['#ffd23f', '#ff4fa3', '#2fd6c4', '#ff9f1c', '#ffd23f', '#ff4fa3', '#2fd6c4', '#ff9f1c'];

export function Logo({ size = 'lg', animated = false, className = '' }) {
  return (
    <span className={`logo logo-${size} ${animated ? 'logo-anim' : ''} ${className}`} role="img" aria-label="Nonopoly">
      {'NONOPOLY'.split('').map((l, i) => (
        <span key={i} aria-hidden="true" style={{ '--c': LOGO_COLORS[i], '--i': i }}>
          {l}
        </span>
      ))}
    </span>
  );
}
