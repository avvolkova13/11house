import { useId, type ReactNode } from 'react'
// app/wheel.jsx: original NatalWheel geometry, palette, aspects and labels.
/* ===========================================================================
   NatalWheel — натальное колесо, отрисованное программно (math → SVG).
   Зодиакальные деления, дома, глифы планет, аспектные линии.
   Декоративный, но «настоящий» астрологический объект, не ручной рисунок.
   =========================================================================== */

const ZODIAC = ['\u2648','\u2649','\u264A','\u264B','\u264C','\u264D','\u264E','\u264F','\u2650','\u2651','\u2652','\u2653'];

// glyph, долгота (0..360), цвет-метка
const DEFAULT_PLANETS = [
  { g: '\u2609', lon: 24,  c: 'gold' },   // Солнце
  { g: '\u263D', lon: 312, c: 'moon' },   // Луна
  { g: '\u263F', lon: 48,  c: 'ame' },    // Меркурий
  { g: '\u2640', lon: 76,  c: 'ame' },    // Венера
  { g: '\u2642', lon: 150, c: 'gold' },   // Марс
  { g: '\u2643', lon: 205, c: 'moon' },   // Юпитер
  { g: '\u2644', lon: 258, c: 'ame' },    // Сатурн
  { g: '\u2645', lon: 130, c: 'moon' },   // Уран
  { g: '\u2646', lon: 285, c: 'ame' },    // Нептун
  { g: '\u2647', lon: 95,  c: 'gold' },   // Плутон
];

const COL: Record<string, string> = { gold: '#F4C430', moon: '#D8D4EC', ame: '#B79CFB' };

function polar(cx: number, cy: number, r: number, deg: number) {
  // 0° слева (асцендент), против часовой
  const a = (180 - deg) * Math.PI / 180;
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
}

export function NatalWheel({ size = 320, planets = DEFAULT_PLANETS, aspects = true, spin = false, faint = false }) {
  const gradientId = useId();
  const cx = size / 2, cy = size / 2;
  const rOuter = size * 0.47;
  const rZodInner = size * 0.385;
  const rHouse = size * 0.30;
  const rPlanet = size * 0.235;
  const rAspect = size * 0.205;
  const op = faint ? 0.5 : 1;

  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const deg = i * 30;
    const [x1, y1] = polar(cx, cy, rOuter, deg);
    const [x2, y2] = polar(cx, cy, rZodInner, deg);
    ticks.push(<line key={'z' + i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(216,212,236,0.18)" strokeWidth="1" />);
    // глиф знака в середине сектора
    const [gx, gy] = polar(cx, cy, (rOuter + rZodInner) / 2, deg + 15);
    ticks.push(
      <text key={'g' + i} x={gx} y={gy} fontSize={size * 0.045} fill="rgba(216,212,236,0.62)"
            textAnchor="middle" dominantBaseline="central" fontFamily="serif">{ZODIAC[i]}</text>
    );
  }

  // дома — 12 спиц во внутреннем круге
  const houses = [];
  for (let i = 0; i < 12; i++) {
    const deg = i * 30 + 8;
    const [x1, y1] = polar(cx, cy, rHouse, deg);
    const [x2, y2] = polar(cx, cy, rAspect, deg);
    houses.push(<line key={'h' + i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(216,212,236,0.08)" strokeWidth="1" />);
  }

  // аспектные линии между планетами (декоративная выборка)
  const aspectLines: ReactNode[] = [];
  if (aspects) {
    const pairs = [[0,4],[0,2],[1,5],[2,6],[3,9],[4,7],[5,8],[1,3]];
    pairs.forEach(([a, b], k) => {
      if (!planets[a] || !planets[b]) return;
      const [x1, y1] = polar(cx, cy, rAspect, planets[a].lon);
      const [x2, y2] = polar(cx, cy, rAspect, planets[b].lon);
      const dash = k % 3 === 0 ? '3 4' : 'none';
      aspectLines.push(<line key={'a' + k} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={k % 2 ? 'rgba(139,92,246,0.45)' : 'rgba(244,196,48,0.30)'} strokeWidth="1" strokeDasharray={dash} />);
    });
  }

  const planetNodes = planets.map((p, i) => {
    const [px, py] = polar(cx, cy, rPlanet, p.lon);
    const [tx, ty] = polar(cx, cy, rAspect, p.lon);
    return (
      <g key={'p' + i}>
        <line x1={px} y1={py} x2={tx} y2={ty} stroke="rgba(216,212,236,0.14)" strokeWidth="1" />
        <circle cx={px} cy={py} r={size * 0.028} fill="#16142F" stroke={COL[p.c]} strokeWidth="1.2" />
        <text x={px} y={py} fontSize={size * 0.04} fill={COL[p.c]} textAnchor="middle"
              dominantBaseline="central" fontFamily="serif">{p.g}</text>
        <circle cx={tx} cy={ty} r="1.6" fill={COL[p.c]} />
      </g>
    );
  });

  return (
    <svg role="img" aria-label="Натальная карта: знаки, дома, планеты и аспекты" width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity: op, overflow: 'visible', display: 'block' }}>
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(139,92,246,0.16)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={rAspect} fill={`url(#${gradientId})`} />
      <g style={spin ? { transformOrigin: 'center', animation: 'spin-slow 120s linear infinite' } : undefined}>
        <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="rgba(216,212,236,0.22)" strokeWidth="1.2" />
        <circle cx={cx} cy={cy} r={rZodInner} fill="none" stroke="rgba(216,212,236,0.14)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={rHouse} fill="none" stroke="rgba(216,212,236,0.10)" strokeWidth="1" />
        {ticks}
        {houses}
      </g>
      {aspectLines}
      {planetNodes}
      <circle cx={cx} cy={cy} r="2.4" fill="rgba(216,212,236,0.4)" />
    </svg>
  );
}


for (let i = 0; i < ZODIAC.length; i++) ZODIAC[i] += "\uFE0E";
DEFAULT_PLANETS.forEach(p => { p.g += "\uFE0E"; });
