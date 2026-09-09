import { useId, useState } from 'react'
// Extracted from app/{matrix-data,matrix-graph,numerology-data,numerology-extra,hd-data,hd-graph}.jsx.
// Original SVG/grid geometry and CSS retained; app stores and full-page controls omitted.
const MATRIX_POINTS = [
  { key: 'A', label: 'Характер', angle: 180, kind: 'card', hint: 'личность, врождённые качества' },
  { key: 'B', label: 'Детство · род', angle: 90, kind: 'card', hint: 'программа детства, влияние мамы' },
  { key: 'C', label: 'Карма рода', angle: 0, kind: 'card', hint: 'задача, принесённая из рода' },
  { key: 'D', label: 'Зона комфорта', angle: 270, kind: 'card', hint: 'опора, отдых, восстановление' },
  { key: 'tl', label: 'Таланты', angle: 135, kind: 'diag', hint: 'дары и сильные стороны' },
  { key: 'tr', label: 'Кармический хвост', angle: 45, kind: 'diag', hint: 'непрожитые уроки прошлого' },
  { key: 'br', label: 'Род · ресурс', angle: 315, kind: 'diag', hint: 'поддержка и сила рода' },
  { key: 'bl', label: 'Отношения', angle: 225, kind: 'diag', hint: 'сценарий близости' },
  { key: 'E', label: 'Портрет · Я', angle: 0, kind: 'center', hint: 'ядро личности' },
  { key: 'A1', label: 'Скрытый талант', angle: 180, kind: 'inner', hint: 'потенциал, ждущий раскрытия' },
  { key: 'B1', label: 'Духовная задача', angle: 90, kind: 'inner', hint: 'урок души в этой жизни' },
  { key: 'C1', label: 'Кармический опыт', angle: 0, kind: 'inner', hint: 'наработанное в прошлых циклах' },
  { key: 'D1', label: 'Земная задача', angle: 270, kind: 'inner', hint: 'реализация в материи' },
  { key: 'tl1', label: 'Мужская линия рода', angle: 135, kind: 'inner', hint: 'программы по линии отца' },
  { key: 'tr1', label: 'Женская линия рода', angle: 45, kind: 'inner', hint: 'программы по линии матери' },
  { key: 'br1', label: 'Ресурс рода', angle: 315, kind: 'inner', hint: 'дар, передающийся по роду' },
  { key: 'bl1', label: 'Уроки рода', angle: 225, kind: 'inner', hint: 'что род просит завершить' },
];


const MX_AGE_ORDER = ['A', 'tl', 'B', 'tr', 'C', 'br', 'D', 'bl'];
function reduce22(n: number) {
  n = Math.abs(Math.trunc(n) || 0);
  while (n > 22) n = String(n).split('').reduce((s, d) => s + (+d), 0);
  return n || 22;
}
function _sd(s: string) { return String(s).replace(/\D/g, '').split('').reduce((a, d) => a + (+d), 0); }

function computeMatrix(date: string) {
  const m = (date || '').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return null;
  const A = reduce22(+m[1]);            // день — характер
  const B = reduce22(+m[2]);            // месяц — детство/род
  const C = reduce22(_sd(m[3]));        // год — карма рода
  const D = reduce22(A + B + C);        // зона комфорта
  const E = reduce22(A + B + C + D);    // центр — портрет
  const tl = reduce22(A + B), tr = reduce22(B + C), br = reduce22(C + D), bl = reduce22(D + A);
  // внутренние точки (линии к центру)
  const A1 = reduce22(A + E), B1 = reduce22(B + E), C1 = reduce22(C + E), D1 = reduce22(D + E);
  const tl1 = reduce22(tl + E), tr1 = reduce22(tr + E), br1 = reduce22(br + E), bl1 = reduce22(bl + E);
  // предназначения
  const earth = reduce22(A + C), sky = reduce22(B + D);
  const male = reduce22(tl + br), female = reduce22(tr + bl);
  const p1 = reduce22(earth + sky);          // личное (до 40)
  const p2 = reduce22(male + female);        // социальное (40–60)
  const p3 = reduce22(p1 + p2);              // духовное (60+)
  const mx = {
    A, B, C, D, E, tl, tr, br, bl, A1, B1, C1, D1, tl1, tr1, br1, bl1,
    earth, sky, male, female, p1, p2, p3,
    zones: {
      purpose: p1,
      money: reduce22(E + br),
      love: reduce22(E + bl),
      health: reduce22(E + B),
    },
  };
  return mx;
}
const MX_COL: Record<string, string> = { card: '#B79CFB', diag: '#6FA8FF', center: '#F4C430', inner: '#8B86B0' };
const MX_LOVE = '#E0635C', MX_MONEY = '#F4C430';

export function MatrixOctagram() {
  const sel = 'E';
  const mx = computeMatrix('14.05.1992')! as unknown as Record<string, number>;
  const size = 390, labels = true;

  const cx = size / 2, cy = size / 2;
  const R = size * 0.37, Rin = R * 0.52, Rage = R + 22;
  const pos = (a: number, r: number) => ({ x: cx + r * Math.cos(a * Math.PI / 180), y: cy - r * Math.sin(a * Math.PI / 180) });
  const main = MATRIX_POINTS.filter(p => p.kind === 'card' || p.kind === 'diag');
  const inner = MATRIX_POINTS.filter(p => p.kind === 'inner');
  const card = MATRIX_POINTS.filter(p => p.kind === 'card').map(p => pos(p.angle, R));
  const diag = MATRIX_POINTS.filter(p => p.kind === 'diag').map(p => pos(p.angle, R));
  const poly = (pts: {x: number; y: number}[]) => pts.map(p => `${p.x},${p.y}`).join(' ');
  const k = size / 460; // масштаб шрифтов/радиусов

  const Pt = ({ p, q, r, fs, col }: {p: typeof MATRIX_POINTS[number]; q: {x: number; y: number}; r: number; fs: number; col: string}) => {
    const on = sel === p.key;
    return (
      <g>
        <title>{`${p.label} · аркан ${mx[p.key]}`}</title>
        {on && <circle cx={q.x} cy={q.y} r={r + 4.5} fill="none" stroke={col} strokeWidth="2" />}

        <circle cx={q.x} cy={q.y} r={r} fill={`color-mix(in srgb, ${col} ${on ? 34 : 18}%, #14122B)`} stroke={col} strokeWidth={on ? 2 : 1.3} />
        <text x={q.x} y={q.y} textAnchor="middle" dominantBaseline="central" fontFamily="Onest, sans-serif" fontWeight="800" fontSize={fs} fill={on ? col : 'var(--text-1)'}>{mx[p.key]}</text>
      </g>
    );
  };

  return (
    <svg role="img" aria-label="Матрица судьбы" width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: '100%', overflow: 'visible', display: 'block' }}>
      {/* контуры */}
      <polygon points={poly(card)} fill="none" stroke="rgba(183,156,251,0.35)" strokeWidth="1.4" />
      <polygon points={poly(diag)} fill="none" stroke="rgba(111,168,255,0.32)" strokeWidth="1.4" />
      {/* лучи к центру; линии любви и денег — окрашенные */}
      {main.map(p => {
        const q = pos(p.angle, R);
        const special = p.key === 'bl' ? MX_LOVE : p.key === 'br' ? MX_MONEY : null;
        return <line key={'l' + p.key} x1={cx} y1={cy} x2={q.x} y2={q.y}
          stroke={special ? `color-mix(in srgb, ${special} 55%, transparent)` : 'var(--line-strong)'} strokeWidth={special ? 1.8 : 1} />;
      })}
      {/* подписи линий любви и денег */}
      {labels && <>
        <text x={pos(225, R * 0.78).x - 8} y={pos(225, R * 0.78).y + 14} fontSize={10.5 * k} fill={MX_LOVE} fontFamily="var(--font)" textAnchor="middle" transform={`rotate(45 ${pos(225, R * 0.78).x - 8} ${pos(225, R * 0.78).y + 14})`}>линия любви</text>
        <text x={pos(315, R * 0.78).x + 8} y={pos(315, R * 0.78).y + 14} fontSize={10.5 * k} fill={MX_MONEY} fontFamily="var(--font)" textAnchor="middle" transform={`rotate(-45 ${pos(315, R * 0.78).x + 8} ${pos(315, R * 0.78).y + 14})`}>линия денег</text>
      </>}
      {/* возрастная разметка 0–80 */}
      {labels && MX_AGE_ORDER.map((key, i) => {
        const p = MATRIX_POINTS.find(x => x.key === key);
        const q = pos(p!.angle, Rage);
        return <text key={'age' + key} x={q.x} y={q.y} textAnchor="middle" dominantBaseline="central" fontSize={10 * k} fontFamily="var(--mono, monospace)" fill={'var(--text-3)'}>{i * 10}</text>;
      })}
      {/* точки */}
      {inner.map(p => <Pt key={p.key} p={p} q={pos(p.angle, Rin)} r={12.5 * k} fs={11 * k} col={MX_COL.inner} />)}
      {main.map(p => <Pt key={p.key} p={p} q={pos(p.angle, R)} r={20 * k} fs={17 * k} col={MX_COL[p.kind]} />)}
      <Pt p={MATRIX_POINTS.find(p => p.key === 'E')!} q={{ x: cx, y: cy }} r={27 * k} fs={24 * k} col={MX_COL.center} />
    </svg>
  );
}

function _sumDigits(s: string | number) { return String(s).replace(/\D/g, "").split("").reduce((a, d) => a + (+d), 0); }
function computePsycho(date: string) {
  const m = (date || '').match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!m) return null;
  const dStr = String(+m[1]) + String(+m[2]) + m[3];
  const base = dStr.split('').map(Number);
  const n1 = base.reduce((a, b) => a + b, 0);
  const n2 = _sumDigits(n1);
  const n3 = Math.abs(n1 - 2 * (+String(+m[1])[0]));
  const n4 = _sumDigits(n3);
  const all = [...base, ..._splitD(n1), ..._splitD(n2), ..._splitD(n3), ..._splitD(n4)].filter(d => d > 0);
  const counts: Record<number, number> = {}; for (let i = 1; i <= 9; i++) counts[i] = 0;
  all.forEach(d => { counts[d]++; });
  return { counts, work: [n1, n2, n3, n4] };
}
function _splitD(n: number) { return String(Math.abs(n)).split('').map(Number); }

const PSY_CELLS: Record<number, {name: string; levels: string[]}> = {
  1: { name: 'Характер', levels: ['безвольность — характер ещё формируется', 'мягкий, уступчивый характер', 'гибкий характер, дипломатичность', 'сильный, устойчивый характер', 'волевой, почти властный характер', 'перебор воли — склонность к давлению'] },
  2: { name: 'Энергия', levels: ['энергии мало — беречь ресурс, брать силу из любимого дела', 'энергии хватает на себя', 'хороший запас энергии, можно делиться', 'донор энергии, сильное биополе', 'мощный поток — нужен выход через большое дело', 'избыток энергии — без выхода превращается во вспыльчивость'] },
  3: { name: 'Интерес', levels: ['аккуратист: порядок и план важнее экспериментов', 'интерес к знаниям приходит волнами', 'устойчивая любознательность', 'склонность к науке и системному знанию', 'исследователь по природе', 'разбросанность интересов — важен фокус'] },
  4: { name: 'Здоровье', levels: ['хрупкое здоровье — режим и профилактика обязательны', 'здоровье среднее, беречь смолоду', 'крепкое здоровье от природы', 'очень крепкое здоровье, высокая выносливость', 'богатырский ресурс тела', 'избыточная физичность — важно направить в спорт'] },
  5: { name: 'Логика', levels: ['решает интуицией, не расчётом — и это работает', 'логика есть, но бывают ошибки', 'сильная логика, аналитический склад', 'выдающаяся логика, просчитывает наперёд', 'провидческое мышление', 'переанализ — паралич решений'] },
  6: { name: 'Труд', levels: ['рутина противопоказана — нужен творческий труд', 'умеренное трудолюбие, работает по настроению', 'мастеровитость, золотые руки', 'выраженное трудолюбие', 'трудоголизм — следить за балансом', 'труд как бегство — важно учиться отдыхать'] },
  7: { name: 'Удача', levels: ['удачу зарабатывает сам — зато навсегда', 'есть ангел-хранитель', 'везение в делах, открытые двери', 'редкая удачливость', 'особая защита судьбы', 'испытание удачей — не полагаться только на везение'] },
  8: { name: 'Долг', levels: ['свобода от обязательств, лёгкость', 'чувство долга к близким', 'сильная ответственность, надёжность', 'служение людям как путь', 'гиперответственность — брать только своё', 'долг подавляет желания — важны границы'] },
  9: { name: 'Память · ум', levels: ['короткая память на обиды — и на уроки', 'нормальная память', 'хорошая память, ясный ум', 'отличная память, способность к языкам', 'феноменальная память', 'перегруз памяти — застревание в прошлом'] },
};
const PSY_GRID = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];

/* Линии силы психоматрицы */
export function PsychoMatrix({ guidedCell }: { guidedCell?: string } = {}) {
  const [sel, onSel] = useState('cell:1');
  const pm = computePsycho('14.05.1992')!;
  const compact = true;
  const cellSize = compact ? 86 : 118;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, minmax(0, ${cellSize}px))`, gap: compact ? 7 : 9 }}>
      {PSY_GRID.map(row => row.map(n => {
        const count = pm.counts[n];
        const on = (guidedCell ?? sel) === 'cell:' + n;
        const alpha = count === 0 ? 0 : Math.min(0.08 + count * 0.07, 0.36);
        return (
          <button key={n} disabled={!!guidedCell} onClick={onSel ? () => onSel('cell:' + n) : undefined} title={`${PSY_CELLS[n].name} · цифра ${n}`}
            style={{
              height: cellSize, borderRadius: 13, cursor: 'pointer', fontFamily: 'var(--font)',
              border: '1px solid', borderColor: on ? 'var(--gold)' : count > 0 ? 'var(--accent-line)' : 'var(--line)',
              background: count > 0 ? `rgba(139,92,246,${alpha})` : 'var(--surface-1)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: 6, minWidth: 0,
            }}>
            <span className="tnum" style={{ fontSize: count > 3 ? (compact ? 15 : 19) : (compact ? 18 : 24), fontWeight: 800, letterSpacing: '0.06em', color: count > 0 ? 'var(--text-1)' : 'var(--text-3)', lineHeight: 1, whiteSpace: 'nowrap' }}>
              {count > 0 ? String(n).repeat(Math.min(count, 6)) + (count > 6 ? '…' : '') : '—'}
            </span>
            <span style={{ fontSize: compact ? 9.5 : 11, color: on ? 'var(--gold)' : 'var(--text-3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{PSY_CELLS[n].name}</span>
          </button>
        );
      }))}
    </div>
  );
}

const HD_CENTER_COLORS: Record<string, string> = {
  head: '#E9C964', ajna: '#8FBF6A', throat: '#B98A5A', g: '#E9C964', heart: '#E0635C',
  spleen: '#C49A6C', solar: '#C97E52', sacral: '#E0635C', root: '#A6714B',
};

const HD_CENTERS = [
  { key: 'head',   name: 'Голова',              theme: 'вдохновение, вопросы, ментальное давление', poly: '220,18 180,64 260,64' },
  { key: 'ajna',   name: 'Аджна',               theme: 'ум, концепции, осмысление',                 poly: '180,92 260,92 220,148' },
  { key: 'throat', name: 'Горло',               theme: 'проявление, речь, действие',                rect: [182, 176, 76, 84] },
  { key: 'g',      name: 'G-центр',             theme: 'идентичность, любовь, направление',         poly: '220,282 268,330 220,378 172,330' },
  { key: 'heart',  name: 'Сердце / Эго',        theme: 'воля, ценность, обещания',                  poly: '274,366 332,380 296,414' },
  { key: 'spleen', name: 'Селезёнка',           theme: 'интуиция, здоровье, страхи',                poly: '50,404 50,536 124,470' },
  { key: 'solar',  name: 'Солнечное сплетение', theme: 'эмоции, чувства, волна',                    poly: '390,404 390,536 316,470' },
  { key: 'sacral', name: 'Сакрал',              theme: 'жизненная сила, работа, отклик',            rect: [184, 438, 72, 64] },
  { key: 'root',   name: 'Корень',              theme: 'давление, драйв, стресс',                   rect: [184, 540, 72, 64] },
];

/* --- 64 ворот: позиция на холсте + центр --- */
const HD_GATES: Record<string, {x: number; y: number; c: string}> = {
  64: { c: 'head', x: 196, y: 55 }, 61: { c: 'head', x: 220, y: 55 }, 63: { c: 'head', x: 244, y: 55 },
  47: { c: 'ajna', x: 196, y: 101 }, 24: { c: 'ajna', x: 220, y: 101 }, 4: { c: 'ajna', x: 244, y: 101 },
  17: { c: 'ajna', x: 204, y: 119 }, 43: { c: 'ajna', x: 220, y: 133 }, 11: { c: 'ajna', x: 236, y: 119 },
  62: { c: 'throat', x: 196, y: 184 }, 23: { c: 'throat', x: 220, y: 184 }, 56: { c: 'throat', x: 244, y: 184 },
  16: { c: 'throat', x: 190, y: 202 }, 20: { c: 'throat', x: 190, y: 224 },
  35: { c: 'throat', x: 250, y: 196 }, 12: { c: 'throat', x: 250, y: 218 }, 45: { c: 'throat', x: 250, y: 240 },
  31: { c: 'throat', x: 196, y: 252 }, 8: { c: 'throat', x: 220, y: 252 }, 33: { c: 'throat', x: 244, y: 252 },
  1: { c: 'g', x: 220, y: 296 }, 7: { c: 'g', x: 202, y: 314 }, 13: { c: 'g', x: 238, y: 314 },
  10: { c: 'g', x: 188, y: 330 }, 25: { c: 'g', x: 252, y: 330 },
  15: { c: 'g', x: 202, y: 346 }, 46: { c: 'g', x: 238, y: 346 }, 2: { c: 'g', x: 220, y: 362 },
  21: { c: 'heart', x: 302, y: 378 }, 51: { c: 'heart', x: 288, y: 390 }, 26: { c: 'heart', x: 300, y: 400 }, 40: { c: 'heart', x: 316, y: 388 },
  48: { c: 'spleen', x: 64, y: 420 }, 57: { c: 'spleen', x: 63, y: 437 }, 44: { c: 'spleen', x: 62, y: 455 },
  50: { c: 'spleen', x: 62, y: 472 }, 32: { c: 'spleen', x: 62, y: 490 }, 28: { c: 'spleen', x: 63, y: 507 }, 18: { c: 'spleen', x: 64, y: 524 },
  36: { c: 'solar', x: 376, y: 420 }, 22: { c: 'solar', x: 377, y: 437 }, 37: { c: 'solar', x: 378, y: 455 },
  6: { c: 'solar', x: 378, y: 472 }, 49: { c: 'solar', x: 378, y: 490 }, 55: { c: 'solar', x: 377, y: 507 }, 30: { c: 'solar', x: 376, y: 524 },
  5: { c: 'sacral', x: 196, y: 446 }, 14: { c: 'sacral', x: 220, y: 446 }, 29: { c: 'sacral', x: 244, y: 446 },
  34: { c: 'sacral', x: 190, y: 464 }, 27: { c: 'sacral', x: 190, y: 484 }, 59: { c: 'sacral', x: 250, y: 478 },
  42: { c: 'sacral', x: 196, y: 494 }, 3: { c: 'sacral', x: 220, y: 494 }, 9: { c: 'sacral', x: 244, y: 494 },
  53: { c: 'root', x: 196, y: 548 }, 60: { c: 'root', x: 220, y: 548 }, 52: { c: 'root', x: 244, y: 548 },
  54: { c: 'root', x: 190, y: 566 }, 38: { c: 'root', x: 190, y: 581 }, 58: { c: 'root', x: 190, y: 596 },
  19: { c: 'root', x: 250, y: 566 }, 39: { c: 'root', x: 250, y: 581 }, 41: { c: 'root', x: 250, y: 596 },
};

/* --- 36 каналов: пары ворот, имя, короткая тема. via — обходные точки трассы --- */
const HD_CHANNELS36 = [
  { g: [64, 47], name: 'Абстракции', desc: 'Осмысление прошлого опыта: образы превращаются в понимание.' },
  { g: [61, 24], name: 'Осознания', desc: 'Мыслитель: внутренняя истина, инсайты в тишине.' },
  { g: [63, 4], name: 'Логики', desc: 'Сомнение → формула: проверка гипотез и прогноз.' },
  { g: [17, 62], name: 'Принятия', desc: 'Мнения, подкреплённые фактами; организация деталей.' },
  { g: [43, 23], name: 'Структурирования', desc: 'Гениальность → простота: уникальные инсайты, понятные другим.' },
  { g: [11, 56], name: 'Любопытства', desc: 'Искатель: идеи и истории, которыми хочется делиться.' },
  { g: [31, 7], name: 'Альфы', desc: 'Естественное лидерство «от имени» коллектива.' },
  { g: [8, 1], name: 'Вдохновения', desc: 'Творческий вклад: ролевая модель самовыражения.' },
  { g: [33, 13], name: 'Блудного сына', desc: 'Свидетель: опыт превращается в истории и уроки.' },
  { g: [20, 10], name: 'Пробуждения', desc: 'Выражение собственных принципов здесь и сейчас.' },
  { g: [45, 21], name: 'Денег', desc: 'Управление ресурсами: материальный поток племени.' },
  { g: [35, 36], name: 'Мимолётности', desc: 'Жажда опыта: «было — стало», эмоциональные приключения.' },
  { g: [12, 22], name: 'Открытости', desc: 'Социальный канал: эмоции в выражении, обаяние в настроении.' },
  { g: [16, 48], name: 'Таланта', desc: 'Мастерство через повторение: энтузиазм + глубина.' },
  { g: [20, 57], name: 'Мозговой волны', desc: 'Проницательность в моменте, спонтанная ясность.' },
  { g: [20, 34], name: 'Харизмы', desc: 'Занятость делом, которое откликается, — здесь и сейчас.', via: [[164, 304], [164, 408]] },
  { g: [2, 14], name: 'Пульса', desc: 'Хранитель ключей: направление + ресурс на путь.' },
  { g: [15, 5], name: 'Ритма', desc: 'Поток: свой темп, который магнетит окружение.' },
  { g: [46, 29], name: 'Открытия', desc: 'Упорство: сказать «да» и пройти до конца.' },
  { g: [10, 34], name: 'Исследования', desc: 'Следование своим убеждениям: любовь к себе через действие.' },
  { g: [25, 51], name: 'Посвящения', desc: 'Инициация: дух соревнования, прыжок первым.' },
  { g: [10, 57], name: 'Совершенной формы', desc: 'Выживание через интуицию: красота и точность формы.' },
  { g: [40, 37], name: 'Общности', desc: 'Договор: семья и община, тепло в обмен на вклад.' },
  { g: [26, 44], name: 'Передачи', desc: 'Предприниматель: память + воля, умение донести и продать.' },
  { g: [59, 6], name: 'Близости', desc: 'Интимность: пробивать барьеры, создавать союз.' },
  { g: [34, 57], name: 'Силы', desc: 'Архетип силы: интуиция, помноженная на жизненность.' },
  { g: [27, 50], name: 'Сохранения', desc: 'Забота и ответственность за своих.' },
  { g: [3, 60], name: 'Мутации', desc: 'Новизна через ограничение: эволюционные скачки.' },
  { g: [42, 53], name: 'Созревания', desc: 'Циклы: начать, прожить и завершить.' },
  { g: [9, 52], name: 'Концентрации', desc: 'Фокус: внимание к деталям, сосредоточенность.' },
  { g: [32, 54], name: 'Преображения', desc: 'Амбиция: признание через трансформацию.' },
  { g: [28, 38], name: 'Борьбы', desc: 'Упрямство: борьба за то, что наполняет жизнь смыслом.' },
  { g: [18, 58], name: 'Суждения', desc: 'Коррекция: радость замечать и улучшать.' },
  { g: [30, 41], name: 'Узнавания', desc: 'Фантазия → опыт: жажда чувствовать.' },
  { g: [55, 39], name: 'Эмоциональности', desc: 'Дух: настроение, муза, провокация чувств.' },
  { g: [49, 19], name: 'Синтеза', desc: 'Чувствительность: потребности близких и революция.' },
].map(ch => ({ ...ch, key: ch.g[0] + '-' + ch.g[1] }));

/* --- Планеты для колонок активаций --- */
const HD_COL_P = '#EFEAFB';   /* личность (аналог «чёрного» на тёмной теме) */
const HD_COL_D = '#E5566D';   /* дизайн (красный) */
const HD_COL_T = '#6FA8FF';   /* транзит */

/* Разбить полилинию на две половины равной длины */
function hdSplitPath(P: number[][]) {
  const segs = []; let total = 0;
  for (let i = 0; i < P.length - 1; i++) { const l = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); segs.push(l); total += l; }
  let half = total / 2, i = 0; const a = [P[0]];
  while (half > segs[i]) { half -= segs[i]; a.push(P[i + 1]); i++; }
  const t = half / segs[i];
  const m = [P[i][0] + (P[i + 1][0] - P[i][0]) * t, P[i][1] + (P[i + 1][1] - P[i][1]) * t];
  a.push(m);
  return { a, b: [m, ...P.slice(i + 1)] };
}
const hdPts = (P: number[][]) => P.map(p => p.join(',')).join(' ');

/* Половина канала: цвет по активациям ворот этой половины */
function HdHalf({ pts, p, d, tr }: {pts: number[][]; p: boolean; d: boolean; tr?: boolean}) {
  if (tr) return <polyline points={hdPts(pts)} fill="none" stroke={HD_COL_T} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 5" opacity="0.95" />;
  if (!p && !d) return null;
  if (p && d) return (
    <g>
      <polyline points={hdPts(pts)} fill="none" stroke={HD_COL_D} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={hdPts(pts)} fill="none" stroke={HD_COL_P} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  return <polyline points={hdPts(pts)} fill="none" stroke={p ? HD_COL_P : HD_COL_D} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />;
}

/* Ворота: кружок с номером */
function HdGate({ n, x, y, p, d, tr, def, onClick }: {n:number; x:number; y:number; p:boolean; d:boolean; tr:boolean; def:boolean; onClick?:()=>void}) {
  const r = 7.5;
  const active = p || d;
  let body;
  if (p && d) body = (
    <g>
      <path d={`M ${x} ${y - r} A ${r} ${r} 0 0 0 ${x} ${y + r} Z`} fill={HD_COL_P} />
      <path d={`M ${x} ${y - r} A ${r} ${r} 0 0 1 ${x} ${y + r} Z`} fill={HD_COL_D} />
    </g>
  );
  else if (active) body = <circle cx={x} cy={y} r={r} fill={p ? HD_COL_P : HD_COL_D} />;
  else if (tr) body = <circle cx={x} cy={y} r={r} fill="rgba(111,168,255,0.22)" stroke={HD_COL_T} strokeWidth="1.4" strokeDasharray="3 2.4" />;
  else body = <circle cx={x} cy={y} r={r} fill={def ? 'rgba(10,9,24,0.34)' : 'rgba(20,18,42,0.6)'} stroke="rgba(238,235,250,0.16)" strokeWidth="1" />;
  return (
    <g onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <title>{`Ворота ${n}`}</title>
      {body}
      <text x={x} y={y + 2.9} textAnchor="middle" style={{ fontSize: 8.4, fontWeight: 700, fontFamily: 'var(--mono, monospace)' }}
        fill={active ? '#100D24' : tr ? '#A9C8FF' : 'rgba(238,235,250,0.72)'}>{n}</text>
    </g>
  );
}

/* --- Бодиграф --- */
export function Bodygraph() {
  const sel = '';
  const gradientId = useId();
  const width = 250, transit = false, mini = false;
  const hd = {pGates: new Set([64,47,17,62,5,15,29,46]), dGates: new Set([9,52,3,60,19,49]), allGates: new Set([64,47,17,62,5,15,29,46,9,52,3,60,19,49]), defined: ['head','ajna','throat','g','sacral','root','solar']};
  const HD_TRANSIT_GATES = new Set<number>();
  const W = 440, H = 620;
  const pG = hd.pGates, dG = hd.dGates, all = hd.allGates;
  const isDef = (k: string) => hd.defined.includes(k);
  const trByKey: Record<string, {gate: number}> = {};

  return (
    <svg role="img" aria-label="Бодиграф: центры, каналы и ворота" width={width} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
      <defs>
        <filter id={gradientId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* === Каналы === */}
      {HD_CHANNELS36.map(ch => {
        const [gA, gB] = ch.g;
        const A = HD_GATES[gA], B = HD_GATES[gB];
        const P = [[A.x, A.y], ...(ch.via || []), [B.x, B.y]];
        const { a, b } = hdSplitPath(P);
        const on = sel === 'ch:' + ch.key;
        const tr = trByKey[ch.key];
        return (
          <g key={ch.key}>
            <polyline points={hdPts(P)} fill="none" stroke={on ? 'rgba(244,196,48,0.5)' : 'rgba(216,212,236,0.13)'} strokeWidth={on ? 3 : 1.6} strokeLinejoin="round" />
            <HdHalf pts={a} p={pG.has(gA)} d={dG.has(gA)} tr={tr && tr.gate === gA} />
            <HdHalf pts={b} p={pG.has(gB)} d={dG.has(gB)} tr={tr && tr.gate === gB} />

          </g>
        );
      })}

      {/* === Центры === */}
      {HD_CENTERS.map(c => {
        const def = isDef(c.key); const on = sel === c.key;
        const col = HD_CENTER_COLORS[c.key];
        const common = {
          fill: def ? `color-mix(in srgb, ${col} 80%, #181430)` : 'rgba(26,23,50,0.94)',
          stroke: on ? 'var(--gold)' : def ? `color-mix(in srgb, ${col} 75%, #fff)` : 'rgba(216,212,236,0.22)',
          strokeWidth: on ? 2.6 : def ? 1.6 : 1.3,
          strokeLinejoin: 'round' as const,
          filter: def && !mini ? `url(#${gradientId})` : undefined,
          style: { transition: 'stroke .15s' },
        };
        return (
          <g key={c.key}>
            <title>{c.name}</title>
            {c.rect
              ? <rect x={c.rect[0]} y={c.rect[1]} width={c.rect[2]} height={c.rect[3]} rx="9" {...common} />
              : <polygon points={c.poly} {...common} />}
          </g>
        );
      })}

      {/* === Ворота === */}
      {!mini && Object.keys(HD_GATES).map(n => {
        const g = HD_GATES[n]; const num = +n;
        return <HdGate key={n} n={num} x={g.x} y={g.y}
          p={pG.has(num)} d={dG.has(num)} def={isDef(g.c)}
          tr={transit && HD_TRANSIT_GATES.has(num) && !all.has(num)}
          />;
      })}
    </svg>
  );
}
