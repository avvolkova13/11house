import type { CSSProperties, ReactNode } from 'react'
// Ported directly from the supplied app/icons.jsx; only TS types and SVG accessibility added.
/* ===========================================================================
   Иконки — единый stroke-набор (1.6px), наследует currentColor.
   =========================================================================== */
type IconProps = { size?: number; style?: CSSProperties };
const I = ({ d, size = 20, fill, sw = 1.6, children, vb = 24, style }: IconProps & {d?: string; fill?: string; sw?: number; children?: ReactNode; vb?: number}) => (
  <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill || "none"}
       stroke={fill ? "none" : "currentColor"} strokeWidth={sw}
       aria-hidden="true" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d ? <path d={d} /> : children}
  </svg>
);

export const Icon = {
  grid: (p: IconProps) => <I {...p}><rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/></I>,
  calendar: (p: IconProps) => <I {...p}><rect x="3" y="4.5" width="18" height="16.5" rx="2.4"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></I>,
  users: (p: IconProps) => <I {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0M16 5.4a3.2 3.2 0 0 1 0 6.2M21 19.5a5.5 5.5 0 0 0-3.2-5"/></I>,
  box: (p: IconProps) => <I {...p}><path d="M21 8.2 12 3 3 8.2v7.6L12 21l9-5.2V8.2Z"/><path d="m3.3 8 8.7 5 8.7-5M12 21v-8"/></I>,
  flow: (p: IconProps) => <I {...p}><rect x="3" y="3.5" width="6" height="5" rx="1.4"/><rect x="15" y="3.5" width="6" height="5" rx="1.4"/><rect x="9" y="15.5" width="6" height="5" rx="1.4"/><path d="M6 8.5v3.5a2 2 0 0 0 2 2h1M18 8.5v3.5a2 2 0 0 1-2 2h-1"/></I>,
  orbit: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="3"/><path d="M5.2 8.5C2.8 10 1.5 11.9 2.2 13.4c1 2.2 6.3 2 11.8-.4S23.4 6.3 22.4 4.1c-.7-1.5-3-1.7-5.9-.8"/></I>,
  chat: (p: IconProps) => <I {...p}><path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 16.5H9l-4.5 4V16.5H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5Z"/><path d="M7.5 9.5h9M7.5 12.5h6"/></I>,
  wallet: (p: IconProps) => <I {...p}><rect x="3" y="5.5" width="18" height="14" rx="2.6"/><path d="M3 9.5h18M16.5 14.5h.01" strokeWidth={2.2}/></I>,
  content: (p: IconProps) => <I {...p}><rect x="4" y="3" width="16" height="18" rx="2.4"/><path d="M8 8h8M8 12h8M8 16h5"/></I>,
  settings: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6"/></I>,
  sidebar: (p: IconProps) => <I {...p}><rect x="3" y="4.5" width="18" height="15" rx="2.2"/><path d="M15 4.5v15"/></I>,
  link: (p: IconProps) => <I {...p}><path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5"/><path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5L12.5 17"/></I>,
  search: (p: IconProps) => <I {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></I>,
  bell: (p: IconProps) => <I {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></I>,
  plus: (p: IconProps) => <I {...p}><path d="M12 5v14M5 12h14"/></I>,
  chevR: (p: IconProps) => <I {...p}><path d="m9 6 6 6-6 6"/></I>,
  chevL: (p: IconProps) => <I {...p}><path d="m15 6-6 6 6 6"/></I>,
  chevD: (p: IconProps) => <I {...p}><path d="m6 9 6 6 6-6"/></I>,
  check: (p: IconProps) => <I {...p}><path d="m5 12.5 4.5 4.5L19 6.5"/></I>,
  arrowUR: (p: IconProps) => <I {...p}><path d="M7 17 17 7M8 7h9v9"/></I>,
  video: (p: IconProps) => <I {...p}><rect x="2.5" y="6" width="13" height="12" rx="2.4"/><path d="m15.5 10 6-3v10l-6-3"/></I>,
  mic: (p: IconProps) => <I {...p}><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></I>,
  doc: (p: IconProps) => <I {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5"/></I>,
  spark: (p: IconProps) => <I {...p}><path d="M12 3c.4 3.8 2.2 5.6 6 6-3.8.4-5.6 2.2-6 6-.4-3.8-2.2-5.6-6-6 3.8-.4 5.6-2.2 6-6Z"/><path d="M19 14c.2 1.6 1 2.4 2.5 2.6-1.6.2-2.3 1-2.5 2.6-.2-1.6-1-2.4-2.5-2.6 1.6-.2 2.3-1 2.5-2.6Z" strokeWidth={1.3}/></I>,
  clock: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="8.4"/><path d="M12 7.5V12l3 2"/></I>,
  moon: (p: IconProps) => <I {...p}><path d="M20 13.5A8 8 0 1 1 10.5 4a6.4 6.4 0 0 0 9.5 9.5Z"/></I>,
  arrowUp: (p: IconProps) => <I {...p}><path d="M12 19V5M6 11l6-6 6 6"/></I>,
  arrowDown: (p: IconProps) => <I {...p}><path d="M12 5v14M6 13l6 6 6-6"/></I>,
  dots: (p: IconProps) => <I {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></I>,
  bolt: (p: IconProps) => <I {...p}><path d="M13 2 4 13.5h6L9 22l9-11.5h-6L13 2Z"/></I>,
  gift: (p: IconProps) => <I {...p}><rect x="3.5" y="9" width="17" height="11.5" rx="1.8"/><path d="M3.5 13h17M12 9v11.5M12 9S9.5 4.5 7 6s1 3 5 3c4 0 7.5 1.5 5-3s-5 3-5 3Z"/></I>,
  star: (p: IconProps) => <I {...p}><path d="M12 3.5 14.4 9l6 .5-4.6 4 1.4 5.9L12 16.4 6.8 19.4l1.4-5.9-4.6-4 6-.5L12 3.5Z"/></I>,
  pin: (p: IconProps) => <I {...p}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></I>,
  send: (p: IconProps) => <I {...p}><path d="M21 3 10.5 13.5M21 3l-6.5 18-4-8-8-4L21 3Z"/></I>,
  pause: (p: IconProps) => <I {...p}><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></I>,
  globe: (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8M12 3.6c2.4 2.3 3.6 5.2 3.6 8.4S14.4 18.1 12 20.4c-2.4-2.3-3.6-5.2-3.6-8.4S9.6 5.9 12 3.6Z"/></I>,
  eye: (p: IconProps) => <I {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/></I>,
  chart: (p: IconProps) => <I {...p}><path d="M4 4v16h16"/><path d="M8 16v-4M12.5 16V8M17 16v-6"/></I>,
  pie: (p: IconProps) => <I {...p}><path d="M12 3v9h9a9 9 0 1 1-9-9Z"/><path d="M14 3.5a9 9 0 0 1 6.5 6.5H14V3.5Z"/></I>,
  user: (p: IconProps) => <I {...p}><circle cx="12" cy="8" r="3.6"/><path d="M5 20a7 7 0 0 1 14 0"/></I>,
  trash: (p: IconProps) => <I {...p}><path d="M4 6.5h16M9 6.5V4.5h6v2M6 6.5 7 20a1.5 1.5 0 0 0 1.5 1.4h7a1.5 1.5 0 0 0 1.5-1.4l1-13.5M10 10.5v6M14 10.5v6"/></I>,
  edit: (p: IconProps) => <I {...p}><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></I>,
  play: (p: IconProps) => <I {...p}><path d="M7 4.5v15l12-7.5L7 4.5Z"/></I>,
  download: (p: IconProps) => <I {...p}><path d="M12 3.5v11M7.5 10l4.5 4.5L16.5 10M4.5 20h15"/></I>,
  grip: (p: IconProps) => <I {...p}><circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none"/></I>,
  map: (p: IconProps) => <I {...p}><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z"/><path d="M9 4v14M15 6v14"/></I>,
  book: (p: IconProps) => <I {...p}><path d="M5 4.5h11a2 2 0 0 1 2 2v13H7a2 2 0 0 0-2 2V4.5Z"/><path d="M5 19.5a2 2 0 0 1 2-2h11"/><path d="M9 8.5h6M9 12h5"/></I>,
  library: (p: IconProps) => <I {...p}><rect x="3.5" y="4" width="5" height="16" rx="1.2"/><rect x="10" y="4" width="5" height="16" rx="1.2"/><path d="M17.5 5.5l3 .8-2.6 14-3-.8 2.6-14Z"/><path d="M3.5 9h5M10 9h5"/></I>,
  num: (p: IconProps) => <I {...p}><path d="M9.5 4 7.5 20M16.5 4l-2 16M5 9h15M4 15h15"/></I>,
  menu: (p: IconProps) => <I {...p}><path d="M4 6.5h16M4 12h16M4 17.5h16"/></I>,
  matrix: (p: IconProps) => <I {...p}><rect x="4.5" y="4.5" width="15" height="15" rx="1"/><path d="M12 2.5 21.5 12 12 21.5 2.5 12Z"/></I>,
  lock: (p: IconProps) => <I {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></I>,
  hd: (p: IconProps) => <I {...p}><circle cx="12" cy="4.5" r="2.2"/><rect x="8" y="8.5" width="8" height="5.5" rx="1.2"/><rect x="8.5" y="16.5" width="7" height="4" rx="1.2"/><path d="M12 6.7v1.8M12 14v2.5"/></I>,
};
