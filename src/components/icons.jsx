"use client";

// Lucide-style minimal icons. All 16x16 stroke-based.
export const Icon = ({ d, paths, size = 16, stroke = 1.5, fill = 'none', ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...p}>
    {d ? <path d={d} /> : paths}
  </svg>
);

export const I = {
  // Brand mark
  // Caixa isométrica dentro de um quadrado arredondado + selo de conferido:
  // o estoque e a promessa de que o sistema bate com a prateleira.
  Brand: (p) => (
    <svg width={p.size || 22} height={p.size || 22} viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="var(--accent-strong)" />
      <path d="M6.4 8.6 11 6.1l4.6 2.5-4.6 2.5z" fill="#fff" fillOpacity="0.95" />
      <path d="M6.4 8.6v5l4.6 2.5v-5z" fill="#fff" fillOpacity="0.62" />
      <path d="M11 11.1v5l4.6-2.5v-5z" fill="#fff" fillOpacity="0.82" />
      <circle cx="17.4" cy="16.4" r="2.4" fill="#fff" fillOpacity="0.95" />
      <path d="m16.3 16.4.8.8 1.5-1.6" stroke="var(--accent-strong)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Wordmark: (p) => (
    <span style={{
      fontSize: p.size || 15, fontWeight: 600, letterSpacing: '-0.022em',
      color: 'var(--fg)', whiteSpace: 'nowrap',
    }}>Stoq<span style={{ color: 'var(--accent-text)' }}>mate</span></span>
  ),
  Home: (p) => <Icon paths={<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-3v-7h-8v7H5a2 2 0 0 1-2-2z"/></>} {...p} />,
  Box: (p) => <Icon paths={<><path d="m21 16-9 5-9-5V8l9-5 9 5z"/><path d="m3.5 7 8.5 5 8.5-5"/><path d="M12 22V12"/></>} {...p} />,
  Layers: (p) => <Icon paths={<><path d="m12 2 10 6-10 6L2 8z"/><path d="m2 17 10 6 10-6"/><path d="m2 12 10 6 10-6"/></>} {...p} />,
  Truck: (p) => <Icon paths={<><path d="M10 17h4V6H2v11h2"/><path d="M14 9h4l4 4v4h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>} {...p} />,
  Tag: (p) => <Icon paths={<><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/></>} {...p} />,
  Chart: (p) => <Icon paths={<><path d="M3 3v18h18"/><path d="m7 14 3-3 3 3 5-5"/></>} {...p} />,
  Grid: (p) => <Icon paths={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>} {...p} />,
  Settings: (p) => <Icon paths={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.05a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.05a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>} {...p} />,
  Search: (p) => <Icon paths={<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>} {...p} />,
  Bell: (p) => <Icon paths={<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>} {...p} />,
  Plus: (p) => <Icon paths={<><path d="M12 5v14"/><path d="M5 12h14"/></>} {...p} />,
  ChevronDown: (p) => <Icon paths={<><path d="m6 9 6 6 6-6"/></>} {...p} />,
  ChevronRight: (p) => <Icon paths={<><path d="m9 6 6 6-6 6"/></>} {...p} />,
  ChevronLeft: (p) => <Icon paths={<><path d="m15 6-6 6 6 6"/></>} {...p} />,
  ArrowUp: (p) => <Icon paths={<><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>} {...p} />,
  ArrowDown: (p) => <Icon paths={<><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></>} {...p} />,
  ArrowRight: (p) => <Icon paths={<><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>} {...p} />,
  Filter: (p) => <Icon paths={<><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></>} {...p} />,
  Download: (p) => <Icon paths={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></>} {...p} />,
  More: (p) => <Icon paths={<><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></>} {...p} />,
  Check: (p) => <Icon paths={<><path d="m5 12 5 5L20 7"/></>} {...p} />,
  X: (p) => <Icon paths={<><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>} {...p} />,
  Menu: (p) => <Icon paths={<><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></>} {...p} />,
  Store: (p) => <Icon paths={<><path d="m2 7 2-3h16l2 3"/><path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7"/><path d="M2 7a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M9 21v-7h6v7"/></>} {...p} />,
  Cpu: (p) => <Icon paths={<><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></>} {...p} />,
  Users: (p) => <Icon paths={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} {...p} />,
  Credit: (p) => <Icon paths={<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>} {...p} />,
  Activity: (p) => <Icon paths={<><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>} {...p} />,
  Logout: (p) => <Icon paths={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></>} {...p} />,
  ChartBar: (p) => <Icon paths={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>} {...p} />,
  Sun: (p) => <Icon paths={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>} {...p} />,
  Moon: (p) => <Icon paths={<><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>} {...p} />,
  Cmd: (p) => <Icon paths={<><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></>} {...p} />,
  Sparkle: (p) => <Icon paths={<><path d="M12 2l2.39 5.96L20 9.27l-4.5 4.39L16.78 20 12 16.77 7.22 20l1.28-6.34L4 9.27l5.61-1.31z"/></>} {...p} />,
  Alert: (p) => <Icon paths={<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>} {...p} />,
  QR: (p) => <Icon paths={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M21 14v.01M14 18v.01M17 21h4v-3M14 21v-1"/></>} {...p} />,
  Shield: (p) => <Icon paths={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>} {...p} />,
  Lock: (p) => <Icon paths={<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>} {...p} />,
  Zap: (p) => <Icon paths={<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>} {...p} />,
  Camera: (p) => <Icon paths={<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>} {...p} />,
  Pkg: (p) => <Icon paths={<><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/></>} {...p} />,
  Shirt: (p) => <Icon paths={<><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></>} {...p} />,
  Home: (p) => <Icon paths={<><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-6h6v6"/></>} {...p} />,
  Coffee: (p) => <Icon paths={<><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v3M10 2v3M14 2v3"/></>} {...p} />,
  Book: (p) => <Icon paths={<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>} {...p} />,
  Swap: (p) => <Icon paths={<><path d="M7 4 3 8l4 4"/><path d="M3 8h13a4 4 0 0 1 0 8h-1"/><path d="m17 20 4-4-4-4"/></>} {...p} />,
  Sliders: (p) => <Icon paths={<><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/></>} {...p} />,
};

