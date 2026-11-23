const GOLD = "#e6c27a";
const IVORY = "#f4ead8";
const VIOLET = "#c4b2ff";
const INK = "#120c1e";

const SKY: Record<string, [string, string, string]> = {
  Major: ["#2a1648", "#5a3484", "#140e24"],
  Cups: ["#163456", "#2c5a90", "#0e1828"],
  Wands: ["#4a221c", "#8a4030", "#1a100e"],
  Swords: ["#1a2740", "#41567e", "#10141e"],
  Pentacles: ["#243018", "#4a5530", "#12160e"],
};

function Sky({ id, suit }: { id: string; suit: string }) {
  const [a, b, c] = SKY[suit] ?? SKY.Major!;
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a} />
          <stop offset="52%" stopColor={b} />
          <stop offset="100%" stopColor={c} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="28%" r="55%">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.45" />
          <stop offset="70%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="168" fill={`url(#${id}-sky)`} />
      <rect width="120" height="168" fill={`url(#${id}-glow)`} />
      <ellipse cx="60" cy="148" rx="54" ry="18" fill="#000" opacity="0.28" />
    </>
  );
}

function Stars({ seed }: { seed: number }) {
  const dots = Array.from({ length: 12 }, (_, i) => {
    const n = (seed * 17 + i * 53) % 97;
    return { x: 8 + (n % 104), y: 8 + ((n * 3) % 70), r: i % 4 === 0 ? 1.3 : 0.7 };
  });
  return (
    <g fill={IVORY}>
      {dots.map((dot) => (
        <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r={dot.r} opacity="0.8" />
      ))}
    </g>
  );
}

function Cloak({ x, y, fill = "#3a2466", scale = 1 }: { x: number; y: number; fill?: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="0" cy="-34" r="6.5" fill={IVORY} />
      <path d="M-16 2 C-14 -16 -8 -26 0 -28 C8 -26 14 -16 16 2 Z" fill={fill} stroke={GOLD} strokeWidth="1" />
      <path d="M-8 -8 L0 2 L8 -8" fill="none" stroke={GOLD} strokeWidth="1" />
    </g>
  );
}

function Pip({ suit, x, y, flip = false }: { suit: string; x: number; y: number; flip?: boolean }) {
  const turn = flip ? `translate(${x} ${y}) rotate(180)` : `translate(${x} ${y})`;
  if (suit === "Cups") {
    return (
      <g transform={turn} stroke={GOLD} fill="none" strokeWidth="1.3">
        <path d="M-7 -6 h14 l-1.4 8 a6 6 0 0 1-11.2 0Z" fill="#1a3c66" />
        <path d="M0 4 v5 M-4 9 h8" />
      </g>
    );
  }
  if (suit === "Wands") {
    return (
      <g transform={turn} stroke={GOLD} fill="none" strokeWidth="1.4">
        <path d="M-2 8 L4 -8" />
        <path d="M1 -8 h6 v4" />
      </g>
    );
  }
  if (suit === "Swords") {
    return (
      <g transform={turn} stroke={VIOLET} fill="none" strokeWidth="1.3">
        <path d="M0 -9 v16 M-4 7 h8 M-3 -2 h6" />
      </g>
    );
  }
  return (
    <g transform={turn}>
      <circle cx="0" cy="0" r="7" fill="#243018" stroke={GOLD} strokeWidth="1.2" />
      <path d="M0 -4.2 l1.2 2.6 h2.8 l-2.2 1.7.8 2.6L0 3.2l-2.6 1.5.8-2.6-2.2-1.7h2.8Z" fill={GOLD} />
    </g>
  );
}

const PIPS: Record<number, [number, number][]> = {
  1: [[60, 86]],
  2: [[60, 52], [60, 118]],
  3: [[60, 46], [60, 86], [60, 126]],
  4: [[38, 52], [82, 52], [38, 118], [82, 118]],
  5: [[38, 50], [82, 50], [60, 86], [38, 122], [82, 122]],
  6: [[38, 46], [82, 46], [38, 86], [82, 86], [38, 126], [82, 126]],
  7: [[38, 44], [82, 44], [60, 64], [38, 90], [82, 90], [38, 128], [82, 128]],
  8: [[38, 40], [82, 40], [38, 70], [82, 70], [38, 102], [82, 102], [38, 132], [82, 132]],
  9: [[38, 40], [82, 40], [38, 68], [82, 68], [60, 86], [38, 104], [82, 104], [38, 132], [82, 132]],
  10: [[38, 36], [82, 36], [60, 54], [38, 74], [82, 74], [38, 102], [82, 102], [60, 118], [38, 136], [82, 136]],
};

const RANK_COUNT: Record<string, number> = {
  Ace: 1,
  Two: 2,
  Three: 3,
  Four: 4,
  Five: 5,
  Six: 6,
  Seven: 7,
  Eight: 8,
  Nine: 9,
  Ten: 10,
};

function MinorScene({ suit, rank }: { suit: string; rank: string }) {
  if (rank === "Page" || rank === "Knight" || rank === "Queen" || rank === "King") {
    const y = rank === "Knight" ? 128 : 132;
    const scale = rank === "King" || rank === "Queen" ? 1.15 : 1;
    return (
      <g>
        <Stars seed={suit.length * 13 + rank.length} />
        {rank === "Knight" ? <path d="M18 128 C40 110 78 112 104 126" fill="none" stroke={GOLD} strokeWidth="1.4" /> : null}
        {rank === "King" ? <rect x="34" y="78" width="52" height="46" rx="4" fill="#000" opacity="0.25" stroke={GOLD} /> : null}
        <Cloak x={60} y={y} scale={scale} fill={rank === "Queen" ? "#5a3068" : "#2a2458"} />
        {rank === "King" || rank === "Queen" ? <path d="M48 78 l6 8 6-8 6 8 6-8" fill="none" stroke={GOLD} strokeWidth="1.2" /> : null}
        <Pip suit={suit} x={rank === "Page" ? 86 : 78} y={96} />
      </g>
    );
  }
  const count = RANK_COUNT[rank] ?? 1;
  const spots = PIPS[count] ?? PIPS[1]!;
  return (
    <g>
      <Stars seed={count * 9 + suit.length} />
      {spots.map(([x, y], index) => (
        <Pip key={`${x}-${y}`} suit={suit} x={x!} y={y!} flip={index >= Math.ceil(spots.length / 2) && count > 1 && suit !== "Pentacles"} />
      ))}
    </g>
  );
}

function MajorScene({ index }: { index: number }) {
  const gold = { fill: "none" as const, stroke: GOLD, strokeWidth: 1.4 };
  switch (index) {
    case 0:
      return (
        <g>
          <Stars seed={3} />
          <path d="M8 132 L48 96 L70 132" fill="#1a1230" stroke={GOLD} />
          <circle cx="92" cy="36" r="10" fill={GOLD} opacity="0.9" />
          <Cloak x={58} y={118} />
          <circle cx="40" cy="108" r="4" fill="#f2c1c8" />
        </g>
      );
    case 1:
      return (
        <g>
          <path d="M46 28c8 6 20 6 28 0" {...gold} />
          <rect x="28" y="108" width="64" height="8" fill={GOLD} opacity="0.8" />
          <Cloak x={60} y={104} />
          <Pip suit="Wands" x={34} y={96} />
          <Pip suit="Cups" x={86} y={96} />
          <Pip suit="Swords" x={40} y={118} />
          <Pip suit="Pentacles" x={82} y={118} />
        </g>
      );
    case 2:
      return (
        <g>
          <rect x="22" y="40" width="8" height="90" fill="#241838" stroke={GOLD} />
          <rect x="90" y="40" width="8" height="90" fill="#241838" stroke={VIOLET} />
          <path d="M30 48 H90" stroke={VIOLET} strokeWidth="6" opacity="0.7" />
          <Cloak x={60} y={124} fill="#24143c" />
          <path d="M78 96 a10 10 0 1 0 0.1 0" {...gold} />
        </g>
      );
    case 3:
      return (
        <g>
          <path d="M10 140 Q60 100 110 140" fill="#2a4020" />
          <Cloak x={60} y={120} fill="#6a3058" scale={1.2} />
          <circle cx="60" cy="40" r="8" {...gold} />
          <path d="M60 48 v10 M54 54 h12" stroke={GOLD} />
          <path d="M24 118 q8 -16 0 -28 M96 118 q-8 -16 0 -28" stroke="#d6c07a" fill="none" />
        </g>
      );
    case 4:
      return (
        <g>
          <path d="M8 70 L30 120 H90 L112 70" fill="#2a2038" stroke={GOLD} />
          <rect x="40" y="78" width="40" height="36" fill="#1a1428" stroke={GOLD} />
          <Cloak x={60} y={108} />
          <path d="M48 70 l6 6 6-6 6 6 6-6" fill="none" stroke={GOLD} />
        </g>
      );
    case 5:
      return (
        <g>
          <Cloak x={60} y={118} scale={1.1} />
          <path d="M42 62 h36 l-6 10 h-24z" fill={GOLD} />
          <path d="M28 96 h10 M82 96 h10" stroke={GOLD} />
          <circle cx="34" cy="130" r="8" fill="#1a1428" stroke={GOLD} />
          <circle cx="86" cy="130" r="8" fill="#1a1428" stroke={GOLD} />
        </g>
      );
    case 6:
      return (
        <g>
          <path d="M60 18 l6 12 h-12z" fill={GOLD} />
          <Cloak x={40} y={124} />
          <Cloak x={80} y={124} fill="#5a2848" />
          <path d="M20 132 L60 96 L100 132" fill="#2a2040" stroke={GOLD} />
        </g>
      );
    case 7:
      return (
        <g>
          <rect x="26" y="88" width="68" height="28" rx="4" fill="#1a1428" stroke={GOLD} />
          <circle cx="40" cy="78" r="7" fill={VIOLET} opacity="0.8" />
          <circle cx="80" cy="78" r="7" fill={GOLD} opacity="0.8" />
          <path d="M18 70 H102" stroke={GOLD} />
          <path d="M60 28 l4 8 8 1-6 6 2 8-8-4-8 4 2-8-6-6 8-1z" fill={GOLD} />
        </g>
      );
    case 8:
      return (
        <g>
          <circle cx="78" cy="108" r="18" fill="#3a2a18" stroke={GOLD} />
          <path d="M66 100 q16 4 18 16" stroke={GOLD} fill="none" />
          <Cloak x={46} y={122} />
          <path d="M34 86 q16 -8 20 6" stroke={IVORY} fill="none" />
        </g>
      );
    case 9:
      return (
        <g>
          <path d="M16 140 L60 48 L104 140" fill="#221838" stroke={GOLD} />
          <Cloak x={60} y={118} />
          <circle cx="78" cy="86" r="6" fill={GOLD} />
          <path d="M78 92 v14" stroke={GOLD} />
        </g>
      );
    case 10:
      return (
        <g>
          <circle cx="60" cy="84" r="28" fill="none" stroke={GOLD} strokeWidth="3" />
          <path d="M60 58 v52 M34 84 h52 M42 66 l36 36 M78 66 l-36 36" stroke={VIOLET} />
          <path d="M48 40 h24 l-4 10 h-16z" fill={GOLD} />
        </g>
      );
    case 11:
      return (
        <g>
          <path d="M60 36 v70" stroke={VIOLET} strokeWidth="2" />
          <path d="M40 58 h40" stroke={GOLD} />
          <circle cx="34" cy="74" r="10" fill="#1a2848" stroke={GOLD} />
          <circle cx="86" cy="74" r="10" fill="#1a2848" stroke={GOLD} />
          <Cloak x={60} y={130} />
        </g>
      );
    case 12:
      return (
        <g>
          <path d="M30 36 h60 M60 36 v18" stroke={GOLD} strokeWidth="3" />
          <g transform="rotate(180 60 96)">
            <Cloak x={60} y={112} />
          </g>
          <circle cx="60" cy="132" r="7" fill="none" stroke={GOLD} />
        </g>
      );
    case 13:
      return (
        <g>
          <circle cx="86" cy="40" r="12" fill={GOLD} />
          <path d="M18 128 Q60 96 104 120" stroke={IVORY} fill="none" />
          <path d="M70 70 l28 48" stroke={VIOLET} strokeWidth="2" />
          <circle cx="48" cy="78" r="8" fill={IVORY} />
          <path d="M40 92 h16 l-8 16z" fill="#2a2438" stroke={GOLD} />
        </g>
      );
    case 14:
      return (
        <g>
          <path d="M20 130 Q60 100 100 130" fill="#243048" />
          <Cloak x={60} y={112} />
          <Pip suit="Cups" x={36} y={100} />
          <Pip suit="Cups" x={84} y={108} />
          <path d="M40 92 Q60 80 80 100" stroke={GOLD} fill="none" />
        </g>
      );
    case 15:
      return (
        <g>
          <rect x="36" y="70" width="48" height="46" fill="#240818" stroke={GOLD} />
          <path d="M48 58 l12 -16 12 16" fill="#6a2030" stroke={GOLD} />
          <circle cx="28" cy="124" r="8" fill="#1a1020" stroke={VIOLET} />
          <circle cx="92" cy="124" r="8" fill="#1a1020" stroke={VIOLET} />
          <path d="M28 116 V100 H92 V116" stroke={GOLD} fill="none" />
        </g>
      );
    case 16:
      return (
        <g>
          <path d="M78 18 L46 78" stroke={GOLD} strokeWidth="3" />
          <rect x="48" y="64" width="26" height="70" fill="#2a1830" stroke={IVORY} />
          <path d="M44 64 h34 l-6 -12 h-22z" fill={GOLD} />
          <circle cx="30" cy="100" r="4" fill={VIOLET} />
          <circle cx="96" cy="112" r="4" fill={GOLD} />
        </g>
      );
    case 17:
      return (
        <g>
          <Stars seed={17} />
          <path d="M60 34 l6 14 14 2-10 9 3 14-13-8-13 8 3-14-10-9 14-2z" fill={GOLD} />
          <ellipse cx="40" cy="130" rx="22" ry="8" fill="#1a3058" />
          <Cloak x={78} y={124} scale={0.85} />
        </g>
      );
    case 18:
      return (
        <g>
          <circle cx="60" cy="46" r="16" fill="#d9d3c4" />
          <circle cx="68" cy="42" r="13" fill="#1a2744" />
          <rect x="22" y="90" width="10" height="36" fill="#241838" stroke={GOLD} />
          <rect x="88" y="90" width="10" height="36" fill="#241838" stroke={GOLD} />
          <path d="M40 150 Q60 110 80 150" fill="none" stroke={VIOLET} />
          <ellipse cx="60" cy="146" rx="30" ry="8" fill="#16243c" />
        </g>
      );
    case 19:
      return (
        <g>
          <circle cx="60" cy="48" r="18" fill={GOLD} />
          {[0, 45, 90, 135].map((deg) => (
            <path key={deg} d="M60 24 v-8" stroke={GOLD} strokeWidth="2" transform={`rotate(${deg} 60 48)`} />
          ))}
          <Cloak x={60} y={128} fill="#6a4020" />
          <path d="M18 138 h20 M82 138 h20" stroke="#c4a24a" />
        </g>
      );
    case 20:
      return (
        <g>
          <path d="M20 48 Q60 20 100 48" fill="#d9d3c4" opacity="0.85" />
          <path d="M60 42 v28" stroke={GOLD} strokeWidth="3" />
          <path d="M60 58 l14 -6" stroke={GOLD} />
          <Cloak x={36} y={132} scale={0.8} />
          <Cloak x={60} y={128} scale={0.9} />
          <Cloak x={84} y={132} scale={0.8} />
        </g>
      );
    default:
      return (
        <g>
          <ellipse cx="60" cy="86" rx="34" ry="46" fill="none" stroke={GOLD} strokeWidth="3" />
          <Cloak x={60} y={118} />
          <Pip suit="Wands" x={18} y={28} />
          <Pip suit="Cups" x={102} y={28} />
          <Pip suit="Swords" x={18} y={142} />
          <Pip suit="Pentacles" x={102} y={142} />
        </g>
      );
  }
}

export function CardArt({
  cardId,
  name,
  suit,
  rank,
  reversed = false,
}: {
  cardId: string;
  name: string;
  suit: string;
  rank: string;
  reversed?: boolean;
}) {
  const id = cardId.replace(/[^a-z0-9]/gi, "") || "card";
  const major = suit === "Major";
  return (
    <svg
      className={reversed ? "card-art is-reversed" : "card-art"}
      viewBox="0 0 120 168"
      role="img"
      aria-label={`${name}${reversed ? ", reversed" : ""}`}
    >
      <Sky id={id} suit={major ? "Major" : suit} />
      {major ? <MajorScene index={Number(rank) || 0} /> : <MinorScene suit={suit} rank={rank} />}
      <rect x="4" y="4" width="112" height="160" rx="8" fill="none" stroke={GOLD} strokeOpacity="0.75" />
      <rect x="8" y="8" width="104" height="152" rx="6" fill="none" stroke={IVORY} strokeOpacity="0.25" />
    </svg>
  );
}

function Flame() {
  return <path d="M80 78c8-16 2-28-2-36 10 8 18 22 18 36a16 16 0 1 1-16 0z" fill={GOLD} />;
}

export function MeaningArt({
  value,
  root,
  angel,
  title,
  seed,
}: {
  value: number;
  root: number;
  angel: boolean;
  title: string;
  seed?: number;
}) {
  const gid = seed ?? value;
  const rings = root;
  return (
    <svg className="meaning-art" viewBox="0 0 160 160" role="img" aria-label={`Image for ${title}`}>
      <defs>
        <radialGradient id={`seal-${gid}`} cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor={angel ? "#6a4a18" : "#3a2468"} />
          <stop offset="55%" stopColor="#1a1230" />
          <stop offset="100%" stopColor={INK} />
        </radialGradient>
      </defs>
      <rect width="160" height="160" rx="18" fill={`url(#seal-${gid})`} />
      {Array.from({ length: rings }, (_, i) => (
        <circle key={i} cx="80" cy="78" r={18 + i * 7} fill="none" stroke={angel ? GOLD : VIOLET} strokeOpacity={0.35 + i * 0.05} />
      ))}
      {root === 1 ? <Flame /> : null}
      {root === 2 ? (
        <>
          <circle cx="62" cy="74" r="14" fill="#d9d3c4" />
          <circle cx="98" cy="74" r="14" fill="#2a2048" stroke={GOLD} />
        </>
      ) : null}
      {root === 3 ? <path d="M80 40 l22 40 h-44z" fill="none" stroke={GOLD} strokeWidth="2" /> : null}
      {root === 4 ? <rect x="58" y="52" width="44" height="52" fill="none" stroke={GOLD} strokeWidth="2" /> : null}
      {root === 5 ? <path d="M40 110 H120 V70 H92" fill="none" stroke={GOLD} strokeWidth="2" /> : null}
      {root === 6 ? <path d="M80 96c18-8 28-28 10-40-8 16-22 18-28 8 2 14 6 24 18 32z" fill="#c4553a" /> : null}
      {root === 7 ? (
        <>
          <circle cx="108" cy="58" r="8" fill={GOLD} />
          <path d="M108 66 v22" stroke={GOLD} />
          <path d="M40 120 L80 70 L120 120" fill="#241838" stroke={VIOLET} />
        </>
      ) : null}
      {root === 8 ? <path d="M80 78c-16-18-36-8-36 6s20 20 36 6c16 14 36 4 36-10s-20-20-36-2z" fill="none" stroke={GOLD} strokeWidth="2" /> : null}
      {root === 9 ? <ellipse cx="80" cy="78" rx="36" ry="28" fill="none" stroke={GOLD} strokeWidth="2" /> : null}
      {angel ? <circle cx="80" cy="78" r="46" fill="none" stroke={GOLD} strokeDasharray="2 4" /> : null}
      <text x="80" y="146" textAnchor="middle" fill={IVORY} fontSize="18" fontFamily="Georgia, serif">
        {value}
      </text>
    </svg>
  );
}
