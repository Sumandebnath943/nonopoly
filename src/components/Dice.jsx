// Two 3D CSS dice. Tap directly on the dice when it's your turn to roll!
const FACE_ROT = {
  1: [0, 0],
  6: [0, 180],
  3: [0, -90],
  4: [0, 90],
  5: [-90, 0],
  2: [90, 0],
};

const PIPS = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

const FACES = [
  { n: 1, t: 'translateZ(var(--half))' },
  { n: 6, t: 'rotateY(180deg) translateZ(var(--half))' },
  { n: 3, t: 'rotateY(90deg) translateZ(var(--half))' },
  { n: 4, t: 'rotateY(-90deg) translateZ(var(--half))' },
  { n: 5, t: 'rotateX(90deg) translateZ(var(--half))' },
  { n: 2, t: 'rotateX(-90deg) translateZ(var(--half))' },
];

function Die({ value, rollId, idx }) {
  const [bx, by] = FACE_ROT[value] || FACE_ROT[1];
  const spinX = rollId * 720 + (idx ? 360 : 0) * rollId;
  const spinY = rollId * (idx ? 360 : 720);
  return (
    <div className="die-wrap">
      <div className="die" style={{ transform: `rotateX(${bx + spinX}deg) rotateY(${by + spinY}deg)` }}>
        {FACES.map((f) => (
          <div key={f.n} className="die-face" style={{ transform: f.t }}>
            {PIPS[f.n].map((p) => (
              <span key={p} className={`pip ${f.n === 1 || f.n === 4 ? 'red' : ''}`} style={{ gridArea: `p${p}` }} />
            ))}
          </div>
        ))}
      </div>
      <div className="die-shadow" />
    </div>
  );
}

export default function Dice({ dice, rollId, rolling, double, canRoll, onRoll }) {
  const sum = (dice?.[0] || 0) + (dice?.[1] || 0);
  const badgeText = double
    ? `DOUBLE ${sum}! 🔥`
    : sum === 12
      ? '12 · SIXER! 🏏'
      : sum === 7 && rollId > 0
        ? '7 · LUCKY!'
        : rollId > 0
          ? `${sum}`
          : null;

  return (
    <div
      className={`dice-tray ${rolling ? 'rolling' : ''} ${double && !rolling ? 'double' : ''} ${canRoll ? 'can-roll' : ''}`}
      aria-label={`Dice show ${dice[0]} and ${dice[1]}`}
      role={canRoll ? 'button' : 'img'}
      tabIndex={canRoll ? 0 : -1}
      onClick={canRoll ? onRoll : undefined}
      onKeyDown={canRoll ? (e) => (e.key === 'Enter' || e.key === ' ') && onRoll?.() : undefined}
      title={canRoll ? 'Tap to Roll Dice!' : undefined}
    >
      <Die value={dice[0]} rollId={rollId} idx={0} />
      <Die value={dice[1]} rollId={rollId} idx={1} />
      {!rolling && badgeText && (
        <span className={`double-badge ${double ? 'is-double' : 'is-sum'}`} key={`${rollId}-${sum}`}>
          {badgeText}
        </span>
      )}
    </div>
  );
}
