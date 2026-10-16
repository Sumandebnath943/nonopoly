// Richly illustrated Desi character portraits & 3D-shaded board token pawns.
import { useId } from 'react';
import { K, Svg } from './tileArt';

const o = { stroke: K, strokeWidth: 2.2, strokeLinejoin: 'round', strokeLinecap: 'round' };
const thin = { ...o, strokeWidth: 1.4 };

// ==================== BOARD TOKENS ====================

function Auto() {
  return (
    <>
      <ellipse cx="32" cy="54" rx="22" ry="4.5" fill="rgba(42,20,8,0.22)" />
      <path d="M8 35 Q8 11 30 11 H46 Q55 11 55 21 V35Z" fill="#ffd21a" {...o} />
      <path d="M12 15 Q30 12 48 15" stroke="#fff6b8" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M6 34 H56 Q60 34 60 38 V47 H6Z" fill="#1aa85a" {...o} />
      <path d="M14 33 V20 Q14 16 20 16 H33 V33Z" fill="#fff6e0" {...thin} />
      <path d="M37 16 H46 Q51 16 51 22 V33 H37Z" fill="#9be4ff" {...thin} />
      <path d="M40 19 L46 27" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <path d="M6 40 H60" stroke="#ffd21a" strokeWidth="2.8" />
      <rect x="20" y="36" width="12" height="4" rx="1" fill="#e5007d" {...thin} />
      <circle cx="57.5" cy="38" r="2.5" fill="#fff3a0" {...thin} />
      <circle cx="17" cy="49" r="7" fill="#262033" {...o} />
      <circle cx="17" cy="49" r="3" fill="#ffd21a" />
      <circle cx="48" cy="49" r="7" fill="#262033" {...o} />
      <circle cx="48" cy="49" r="3" fill="#ffd21a" />
    </>
  );
}

function Chai() {
  return (
    <>
      <ellipse cx="32" cy="59" rx="17" ry="3.5" fill="rgba(42,20,8,0.22)" />
      <path d="M22 14 q-3.5 -4.5 0 -9 M32 12 q-3.5 -4.5 0 -9 M42 14 q-3.5 -4.5 0 -9" stroke="#ffdf9e" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M14 17 H50 L45 58 H19Z" fill="#e8f6ff" />
      <path d="M15.5 27 H48.5 L45 58 H19Z" fill="#c97a36" />
      <ellipse cx="32" cy="27" rx="16.4" ry="3.2" fill="#f3d2a8" {...thin} />
      <path d="M23 32 L24.8 54 M32 32 V54 M41 32 L39.2 54" stroke="#fff" strokeOpacity=".42" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M14 17 H50 L45 58 H19Z" fill="none" {...o} />
      <circle cx="48" cy="48" r="6" fill="#f2aa33" {...thin} />
      <circle cx="47" cy="47" r="1" fill="#8c4a08" />
      <circle cx="50" cy="49" r="1" fill="#8c4a08" />
    </>
  );
}

function Bat() {
  return (
    <>
      <ellipse cx="34" cy="58" rx="19" ry="3.8" fill="rgba(42,20,8,0.22)" />
      <g transform="rotate(-32 30 32)">
        <rect x="27" y="1" width="6.5" height="18" rx="2.5" fill="#e2323a" {...o} />
        <path d="M27 6 h6.5 M27 10 h6.5 M27 14 h6.5" stroke="#ffd34d" strokeWidth="1.4" />
        <path d="M22.5 19 H37.5 V55 Q37.5 60 33 60 H27 Q22.5 60 22.5 55Z" fill="#f5cf82" {...o} />
        <path d="M30 22 V56" stroke="#c9953c" strokeWidth="1.8" />
        <rect x="23" y="25" width="14" height="5.5" fill="#2b45d8" />
        <path d="M23 27.7 H37" stroke="#ffd34d" strokeWidth="1.5" />
      </g>
      <circle cx="49" cy="48" r="9" fill="#d6222e" {...o} />
      <path d="M42.5 44 Q49 48 55.5 44 M42.5 52 Q49 48 55.5 52" stroke="#fff" strokeWidth="1.5" fill="none" />
      <circle cx="46" cy="45" r="2" fill="#ff9aa2" opacity="0.6" />
    </>
  );
}

function Scooter() {
  return (
    <>
      <ellipse cx="32" cy="56" rx="22" ry="4" fill="rgba(42,20,8,0.22)" />
      <path d="M21 47 Q19 29 36 28 H47 Q55 28 55 40 V47Z" fill="#32b5e8" {...o} />
      <path d="M11 47 L17 17 H24 L21 47Z" fill="#32b5e8" {...o} />
      <path d="M12 15 H28" {...o} strokeWidth="2.8" />
      <circle cx="14.5" cy="19.5" r="3.8" fill="#fff3a0" {...thin} />
      <path d="M33 27 Q33 22 40 22 H50 Q54 22 53 27Z" fill="#262033" {...o} />
      <path d="M20 46 H41" stroke="#ffe08a" strokeWidth="3.2" />
      <path d="M39 35 H50" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".8" />
      <circle cx="16" cy="51" r="6.5" fill="#262033" {...o} />
      <circle cx="16" cy="51" r="2.6" fill="#ffd34d" />
      <circle cx="47" cy="51" r="6.5" fill="#262033" {...o} />
      <circle cx="47" cy="51" r="2.6" fill="#ffd34d" />
    </>
  );
}

function Elephant() {
  return (
    <>
      <ellipse cx="31" cy="57" rx="21" ry="3.8" fill="rgba(42,20,8,0.22)" />
      <path d="M8 42 Q6 20 28 18 Q42 17 47 25 V55 H40 V46 H22 V55 H15 V44 Q8 45 8 42Z" fill="#8b96ab" {...o} />
      <path d="M17 20 Q29 16 40 20 V37 H17Z" fill="#e5007d" {...o} />
      <path d="M17 33.5 H40" stroke="#ffd34d" strokeWidth="3.2" />
      <circle cx="23" cy="27" r="1.9" fill="#ffd34d" />
      <circle cx="29" cy="25.5" r="2.2" fill="#1ce5c3" />
      <circle cx="35" cy="27" r="1.9" fill="#ffd34d" />
      <circle cx="48" cy="27" r="11.5" fill="#8b96ab" {...o} />
      <path d="M55 32 Q63 44 56 53 Q54 55 52 53 Q57 45 50 37" fill="#8b96ab" {...o} />
      <path d="M40 20 Q31 25 35 39 Q44 39 46 30Z" fill="#b7c0d1" {...o} />
      <path d="M44 16 Q50 10 56 16 L50 23Z" fill="#ffd34d" {...thin} />
      <circle cx="51" cy="25.5" r="1.7" fill={K} />
      <path d="M54 36.5 Q59 38.5 61 36" stroke="#fffaf0" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  );
}

function Chappal() {
  return (
    <>
      <path d="M3 22 H14 M1 32 H12 M5 42 H14" stroke="#ff9f1c" strokeWidth="3" strokeLinecap="round" />
      <g transform="rotate(-24 36 32)">
        <path d="M25 5 Q38 1 44.5 9 Q48.5 19 44.5 33 Q42.5 45 44.5 53 Q42.5 62 34 62 Q23.5 60 25.5 50 Q27.5 40 23.5 28 Q19.5 12 25 5Z" fill="#e5007d" {...o} />
        <path d="M27.5 8 Q38 5 42 12 Q45 20 41.5 33 Q40 45 41.5 52 Q40 58 34 58.5 Q27 57.5 28.5 50 Q30.5 40 27 28 Q24 14 27.5 8Z" fill="#ffd34d" />
        <path d="M25.5 27 Q33 17 35 12 Q37 17 44.5 27" fill="none" stroke={K} strokeWidth="6.4" strokeLinecap="round" />
        <path d="M25.5 27 Q33 17 35 12 Q37 17 44.5 27" fill="none" stroke="#18d2b6" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="35" cy="14" r="2.2" fill="#fff" {...thin} />
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

// ==================== RICH CHARACTER PORTRAITS ====================

const SKIN = {
  warm: '#dfa372',
  tan: '#cf8e5a',
  deep: '#b87644',
  light: '#ebb586',
};

function PortraitBackdrop({ c1, c2, ray = '#ffffff24' }) {
  return (
    <>
      <circle cx="32" cy="32" r="32" fill={c1} />
      <circle cx="32" cy="32" r="26" fill={c2} opacity="0.55" />
      <path d="M32 0 L37 22 L32 32 L27 22Z M64 32 L42 37 L32 32 L42 27Z M0 32 L22 27 L32 32 L22 37Z M10 10 L27 24 L32 32 L24 27Z M54 10 L40 27 L32 32 L37 24Z" fill={ray} />
      <circle cx="32" cy="34" r="21" fill="none" stroke="#ffffff35" strokeWidth="1" strokeDasharray="3 3" />
    </>
  );
}

function EarsAndHead({ skin, children }) {
  return (
    <>
      <circle cx="16.5" cy="35" r="4" fill={skin} {...thin} />
      <circle cx="47.5" cy="35" r="4" fill={skin} {...thin} />
      <path d="M18 30 Q18 18 32 18 Q46 18 46 30 V37 Q46 50 32 50 Q18 50 18 37Z" fill={skin} {...o} />
      {/* Subtle cheek blush & nose */}
      <ellipse cx="23.5" cy="38.5" rx="3" ry="1.6" fill="#e05a47" opacity="0.28" />
      <ellipse cx="40.5" cy="38.5" rx="3" ry="1.6" fill="#e05a47" opacity="0.28" />
      <path d="M32 33.5 L30.8 37.8 H33.4" fill="none" stroke="#7a4421" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {children}
    </>
  );
}

// 1. Seth Gupta Ji — Crimson Marwari Pagdi + Gold Sarpech + Spectacles + Emerald Bandhgala
function Gupta() {
  return (
    <>
      <PortraitBackdrop c1="#ffbe3b" c2="#ff8800" />
      {/* Emerald Bandhgala Suit & Gold Necklace */}
      <path d="M6 64 Q9 49 32 47 Q55 49 58 64Z" fill="#136f42" {...o} />
      <path d="M24 48 L32 60 L40 48" fill="#fff6e0" {...thin} />
      <path d="M21 51 Q32 61 43 51" fill="none" stroke="#ffd34d" strokeWidth="2.5" strokeDasharray="2.5 2" />
      <EarsAndHead skin={SKIN.warm}>
        {/* Marwari Crimson & Gold Pagdi (Turban) */}
        <path d="M14 28 Q12 11 32 9 Q52 11 50 28 Q42 21 32 22 Q22 21 14 28Z" fill="#c91838" {...o} />
        <path d="M16 22 Q32 13 48 22 M18 17 Q32 10 46 17" stroke="#ffd34d" strokeWidth="2" fill="none" />
        {/* Royal Sarpech Brooch on Turban */}
        <circle cx="32" cy="17" r="3.5" fill="#ffd34d" {...thin} />
        <circle cx="32" cy="17" r="1.6" fill="#1aa85a" />
        {/* Tilak */}
        <path d="M32 24.5 v4.5" stroke="#e2323a" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="32" cy="29.5" r="1" fill="#ffd34d" />
        {/* Gold-rimmed round glasses */}
        <circle cx="26" cy="34" r="4.8" fill="#ffffff66" stroke="#ffd34d" strokeWidth="2.2" />
        <circle cx="38" cy="34" r="4.8" fill="#ffffff66" stroke="#ffd34d" strokeWidth="2.2" />
        <circle cx="26" cy="34" r="4.8" fill="none" stroke={K} strokeWidth="1" />
        <circle cx="38" cy="34" r="4.8" fill="none" stroke={K} strokeWidth="1" />
        <path d="M30.8 34 h2.4" stroke={K} strokeWidth="1.6" />
        {/* Expressive shrewd eyes */}
        <circle cx="26.2" cy="34" r="1.9" fill={K} />
        <circle cx="37.8" cy="34" r="1.9" fill={K} />
        <circle cx="25.5" cy="33.3" r="0.7" fill="#fff" />
        <circle cx="37.1" cy="33.3" r="0.7" fill="#fff" />
        {/* Big Seth Moustache & Smirk */}
        <path d="M21 42.5 Q26.5 38 32 41 Q37.5 38 43 42.5 Q38.5 45 32 43 Q25.5 45 21 42.5Z" fill="#2f2219" {...thin} />
        <path d="M28 45.5 Q32 48 36 45.5" stroke={K} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </EarsAndHead>
    </>
  );
}

// 2. Bandra Bunty — Cyber-Founder Hoodie + Neon Gold Aviators + Pompadour + Stubble
function Bunty() {
  return (
    <>
      <PortraitBackdrop c1="#1ec8e8" c2="#2b55e8" />
      {/* Founder Hoodie + Hot Pink Collar + Gold Chain */}
      <path d="M6 64 Q8 49 32 47 Q56 49 58 64Z" fill="#1c192b" {...o} />
      <path d="M20 48 Q32 56 44 48" fill="#ff2e88" {...thin} />
      <path d="M24 53 Q32 61 40 53" stroke="#ffd34d" strokeWidth="2.4" fill="none" />
      <EarsAndHead skin={SKIN.light}>
        {/* Textured stubble */}
        <path d="M20 40 Q32 51 44 40 Q43 48 32 49.5 Q21 48 20 40Z" fill="#4a3425" opacity="0.38" />
        {/* Stylized High-Volume Fade Pompadour */}
        <path d="M16 30 Q13 11 30 9 Q49 7 49 27 Q45 18 34 19 Q24 21 16 30Z" fill="#23140d" {...o} />
        <path d="M24 14 Q34 11 43 16" stroke="#5e3a24" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* Cyber-Gold Aviator Shades */}
        <rect x="19.5" y="29" width="11.5" height="7.8" rx="2.6" fill="#121829" stroke="#ffd34d" strokeWidth="1.9" />
        <rect x="33" y="29" width="11.5" height="7.8" rx="2.6" fill="#121829" stroke="#ffd34d" strokeWidth="1.9" />
        <path d="M31 31.5 h2" stroke="#ffd34d" strokeWidth="1.8" />
        <path d="M21.5 31.5 l3.5 4 M35 31.5 l3.5 4" stroke="#4df0ff" strokeWidth="1.6" strokeLinecap="round" />
        {/* Confident Shark Grin */}
        <path d="M26 42.5 Q32 47 38.5 41.5Z" fill="#fff" {...thin} />
        {/* Diamond Ear Stud */}
        <circle cx="16.5" cy="37" r="1.6" fill="#4df0ff" stroke={K} strokeWidth="0.8" />
      </EarsAndHead>
    </>
  );
}

// 3. Chaudhary Tauji — Royal Kesari Pagdi + Fierce White Handlebar Moustache + Gold Kurta
function Tauji() {
  return (
    <>
      <PortraitBackdrop c1="#ff922b" c2="#d9480f" />
      {/* Embroidered Khadi Kurta & Stole */}
      <path d="M6 64 Q8 49 32 47 Q56 49 58 64Z" fill="#fff8eb" {...o} />
      <path d="M14 50 Q22 57 25 64 M50 50 Q42 57 39 64" stroke="#d9480f" strokeWidth="4" fill="none" />
      <EarsAndHead skin={SKIN.deep}>
        {/* Tall Royal Pagdi with Pleats & Kalgi */}
        <path d="M13 29 Q10 8 32 7 Q54 8 51 29 Q44 20 32 21 Q20 20 13 29Z" fill="#ff6b00" {...o} />
        <path d="M16 19 Q32 11 48 19 M15 24 Q32 16 49 24" stroke="#ffd34d" strokeWidth="1.8" fill="none" />
        <path d="M44 13 q9 -5 10 4 q-4 -1 -6 3z" fill="#ff922b" {...thin} />
        {/* Thick White Eyebrows & Fierce Eyes */}
        <path d="M22 29.5 l6 -1.5 M42 29.5 l-6 -1.5" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="26" cy="33" r="1.9" fill={K} />
        <circle cx="38" cy="33" r="1.9" fill={K} />
        <circle cx="25.4" cy="32.4" r="0.6" fill="#fff" />
        <circle cx="37.4" cy="32.4" r="0.6" fill="#fff" />
        {/* Legendary Twirled Handlebar Moustache */}
        <path d="M32 40.5 Q24 36.5 17 40 Q13 42 11 36.5 Q12 45 20 44.5 Q26 43.5 32 43.5 Q38 43.5 44 44.5 Q52 45 53 36.5 Q51 42 47 40 Q40 36.5 32 40.5Z" fill="#fffaf0" {...thin} />
        <path d="M28 46.5 Q32 48.5 36 46.5" stroke={K} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </EarsAndHead>
    </>
  );
}

// 4. Kitty Queen Pammi — Royal Rani Silk Saree + Gold Jhumkas + Gajra Bun + Cat-Eye Glare
function SharmaAunty() {
  return (
    <>
      <PortraitBackdrop c1="#ff66b5" c2="#8c28d9" />
      {/* Kanjeevaram Silk Saree & Heavy Gold Necklace */}
      <path d="M6 64 Q8 49 32 47 Q56 49 58 64Z" fill="#9c1de7" {...o} />
      <path d="M12 52 Q27 56 38 64" stroke="#ffd34d" strokeWidth="4.5" fill="none" />
      <path d="M23 49 Q32 56 41 49" stroke="#ffd34d" strokeWidth="3" fill="none" />
      {/* Side Hair Bun with Jasmine Gajra */}
      <circle cx="46" cy="17" r="7" fill="#1f120b" {...o} />
      {[[41, 12], [45, 10], [49, 11], [52, 14], [52, 18]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.9" fill="#fff" stroke={K} strokeWidth="0.9" />
      ))}
      <EarsAndHead skin={SKIN.tan}>
        {/* Swept Hair + Red Bindi */}
        <path d="M17 32 Q15 16 32 16 Q49 16 47 32 Q44 22 32 23 Q20 22 17 32Z" fill="#1f120b" {...o} />
        <circle cx="32" cy="26.5" r="2.3" fill="#e2323a" stroke="#ffd34d" strokeWidth="0.8" />
        {/* Designer Cat-Eye Rimless/Gold Glasses */}
        <path d="M19 32 Q25 29 30 33 Q26 36.5 20 35Z" fill="#ffffff55" stroke="#ffd34d" strokeWidth="1.6" />
        <path d="M45 32 Q39 29 34 33 Q38 36.5 44 35Z" fill="#ffffff55" stroke="#ffd34d" strokeWidth="1.6" />
        <circle cx="25.8" cy="33.2" r="1.7" fill={K} />
        <circle cx="38.2" cy="33.2" r="1.7" fill={K} />
        <path d="M23 28.5 q3 -2 6 0 M35 27.8 q3 -2.5 6 0.5" stroke={K} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Ruby Lipstick Smile */}
        <path d="M26.5 42.5 Q32 47 37.5 42.5 Q32 44.5 26.5 42.5Z" fill="#d90452" {...thin} />
        {/* Hanging Gold Jhumka Earrings */}
        <circle cx="16.2" cy="40" r="2.6" fill="#ffd34d" {...thin} />
        <path d="M14 43 Q16.2 40 18.4 43Z" fill="#e5007d" {...thin} />
        <circle cx="47.8" cy="40" r="2.6" fill="#ffd34d" {...thin} />
        <path d="M45.6 43 Q47.8 40 50 43Z" fill="#e5007d" {...thin} />
      </EarsAndHead>
    </>
  );
}

// 5. Reel-Star Chintu — Streetwear Jacket + Backwards Cap + Clout Shades + Smartphone
function Chintu() {
  return (
    <>
      <PortraitBackdrop c1="#a9ec36" c2="#1aa85a" />
      {/* Neon Streetwear Jacket */}
      <path d="M6 64 Q8 49 32 47 Q56 49 58 64Z" fill="#ffbe0b" {...o} />
      <path d="M21 48 L32 60 L43 48" fill="#3a0ca3" {...thin} />
      <EarsAndHead skin={SKIN.light}>
        {/* Backwards Snapback Cap */}
        <path d="M16 29 Q16 12 32 12 Q48 12 48 29Z" fill="#3a0ca3" {...o} />
        <path d="M16 26 Q7 26 5 22.5 Q9 19.5 17 22" fill="#f72585" {...o} />
        <rect x="26" y="15" width="12" height="5.5" rx="2" fill="#ffd34d" {...thin} />
        {/* Clout Tinted Shades */}
        <rect x="20" y="30" width="11" height="6.8" rx="3" fill="#ff2e88aa" stroke={K} strokeWidth="1.8" />
        <rect x="33" y="30" width="11" height="6.8" rx="3" fill="#ff2e88aa" stroke={K} strokeWidth="1.8" />
        <path d="M31 33 h2" stroke={K} strokeWidth="1.8" />
        <circle cx="25.5" cy="33.4" r="1.5" fill={K} />
        <circle cx="38.5" cy="33.4" r="1.5" fill={K} />
        {/* Hype Open-Mouth Laugh */}
        <path d="M24.5 40.5 Q32 50.5 39.5 40.5Z" fill="#fff" {...thin} />
        <path d="M27.5 44 Q32 47.5 36.5 44" fill="#ff2e88" />
      </EarsAndHead>
      {/* Selfie Phone with Live Heart */}
      <g transform="rotate(11 52 49)">
        <rect x="46" y="39" width="11" height="18" rx="2.2" fill="#191528" {...thin} />
        <rect x="47.5" y="41" width="8" height="13" rx="1" fill="#4cc9f0" />
        <circle cx="51.5" cy="45" r="2.2" fill="#f72585" />
      </g>
    </>
  );
}

// 6. Shark Simran — Power Blazer + Geometric Frames + Pearl Drops + Flowing Hair
function Simran() {
  return (
    <>
      <PortraitBackdrop c1="#b692ff" c2="#5e2be8" />
      {/* Flowing Waves behind shoulders */}
      <path d="M14 28 Q9 42 14 54 M50 28 Q55 42 50 54" stroke="#1f120b" strokeWidth="8" strokeLinecap="round" />
      {/* Emerald Power Blazer & Gold Lapel Pin */}
      <path d="M6 64 Q8 49 32 47 Q56 49 58 64Z" fill="#0d9488" {...o} />
      <path d="M24 48 L32 61 L40 48" fill="#fff" {...thin} />
      <circle cx="41" cy="55" r="2.2" fill="#ffd34d" {...thin} />
      <EarsAndHead skin={SKIN.warm}>
        {/* Sleek Side-Parted Hair */}
        <path d="M17 32 Q15 14 32 14 Q48 14 47 30 Q40 19 25 23 Q20 25 17 32Z" fill="#1f120b" {...o} />
        {/* Sharp Geometric Frames */}
        <polygon points="20,30 31,30 30,37 21,37" fill="#ffffff55" stroke="#e5007d" strokeWidth="1.8" />
        <polygon points="33,30 44,30 43,37 34,37" fill="#ffffff55" stroke="#e5007d" strokeWidth="1.8" />
        <path d="M31 33 h2" stroke="#e5007d" strokeWidth="1.6" />
        <circle cx="25.8" cy="33.5" r="1.8" fill={K} />
        <circle cx="38.2" cy="33.5" r="1.8" fill={K} />
        <circle cx="25.2" cy="32.9" r="0.6" fill="#fff" />
        <circle cx="37.6" cy="32.9" r="0.6" fill="#fff" />
        {/* Confident Shark Smirk */}
        <path d="M27 42.5 Q32.5 46 37.5 41.5" stroke="#b5174f" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* Pearl Earrings */}
        <circle cx="16.5" cy="39" r="2" fill="#fffaf0" stroke={K} strokeWidth="1" />
        <circle cx="47.5" cy="39" r="2" fill="#fffaf0" stroke={K} strokeWidth="1" />
      </EarsAndHead>
    </>
  );
}

const BOT_ART = {
  gupta: { Art: Gupta, bg: '#ffbe3b' },
  bunty: { Art: Bunty, bg: '#1ec8e8' },
  tauji: { Art: Tauji, bg: '#ff922b' },
  aunty: { Art: SharmaAunty, bg: '#ff66b5' },
  chintu: { Art: Chintu, bg: '#a9ec36' },
  simran: { Art: Simran, bg: '#b692ff' },
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

// Unified avatar for any player: shows their persona portrait if chosen, or their token + badge.
export function PlayerAvatar({ player, className = '' }) {
  if (!player) return null;
  if (player.isAi || player.botId) {
    return (
      <span className={`avatar ${className}`} style={{ '--pc': player.color }}>
        <BotPortrait id={player.botId || 'gupta'} className="avatar-art" />
      </span>
    );
  }
  return (
    <span className={`avatar avatar-human ${className}`} style={{ '--pc': player.color }}>
      <TokenArt id={player.tokenId} className="avatar-art" />
    </span>
  );
}
