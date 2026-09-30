"use client";

// Peças do filme do hero. Prints reais, capturados do nosso próprio app
// rodando (não do design original — as 4 telas já existem aqui, então
// capturamos direto pra refletir o app de verdade). Só a marca, o vidro e
// os celulares do cadastro continuam desenhados — é a única cena que um
// print não mostra.

// Paleta fixa do filme, literal (não var CSS): o filme tem estética própria
// (fundo escuro, cinematográfico) independente do tema claro/escuro do app.
export const C = {
  acc: '#E94B1C', accStrong: '#C43F14',
  ok: '#1F6B41', danger: '#B02525',
  mono: "'Geist Mono', ui-monospace, Menlo, monospace",
  sans: "'Geist', ui-sans-serif, system-ui, sans-serif",
};

// Capturados via claude-in-chrome em 1347×893 contra o app rodando local.
export const SHOTS = {
  dashboard: '/hero-film/dashboard.webp',
  match: '/hero-film/match.webp',
  network: '/hero-film/network.webp',
  anomalies: '/hero-film/anomalies.webp',
};
export const SHOT_W = 1347, SHOT_H = 893;
export const SLAB_W = 1600, SLAB_H = Math.round((SLAB_W * SHOT_H) / SHOT_W);

export function Mark({ size = 28, fill = C.accStrong, box = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill={fill} />
      <path d="M6.4 8.6 11 6.1l4.6 2.5-4.6 2.5z" fill={box} fillOpacity=".95" />
      <path d="M6.4 8.6v5l4.6 2.5v-5z" fill={box} fillOpacity=".62" />
      <path d="M11 11.1v5l4.6-2.5v-5z" fill={box} fillOpacity=".82" />
      <circle cx="17.4" cy="16.4" r="2.4" fill={box} fillOpacity=".95" />
      <path d="m16.3 16.4.8.8 1.5-1.6" stroke={fill} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

// ─── celulares: a única cena que continua desenhada ──────────────────────

function Phone({ children, w = 300 }) {
  const h = w * 2.16;
  return (
    <div style={{
      width: w, height: h, borderRadius: w * 0.13, background: '#141210',
      padding: w * 0.028, boxShadow: '0 40px 90px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.09)',
      flexShrink: 0,
    }}>
      <div style={{ width: '100%', height: '100%', borderRadius: w * 0.105, overflow: 'hidden', background: '#0B0A08', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: w * 0.1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: w * 0.26, height: w * 0.045, background: '#000', borderRadius: 999 }} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function PhoneCamera({ shots = 0, flash = 0 }) {
  return (
    <Phone>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 14px 16px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px 10px' }}>
          <span style={{ fontSize: 16, fontWeight: 600, flex: 1 }}>Fotografar</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', fontFamily: C.mono }}>{`${shots} fotos`}</span>
        </div>
        <div style={{ flex: 1, borderRadius: 16, background: 'linear-gradient(160deg,#211E19,#0F0E0B)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 26, border: '2px dashed rgba(255,255,255,.24)', borderRadius: 12 }} />
          <div style={{
            position: 'absolute', inset: 40, borderRadius: 8,
            background: 'linear-gradient(145deg,#4a4038,#2b2621)', boxShadow: 'inset 0 2px 14px rgba(0,0,0,.5)',
          }}>
            <div style={{ position: 'absolute', left: 14, top: 18, width: '56%', height: 7, background: 'rgba(255,255,255,.22)', borderRadius: 3 }} />
            <div style={{ position: 'absolute', left: 14, top: 33, width: '38%', height: 6, background: 'rgba(255,255,255,.14)', borderRadius: 3 }} />
            <div style={{ position: 'absolute', left: 14, bottom: 16, display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              {Array.from({ length: 22 }, (_, i) => <div key={i} style={{ width: i % 3 ? 2 : 3.5, height: 26, background: 'rgba(255,255,255,.55)' }} />)}
            </div>
          </div>
          <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash }} />
          <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, padding: '8px 11px', background: 'rgba(0,0,0,.55)', borderRadius: 9, fontSize: 12.5, color: 'rgba(255,255,255,.8)' }}>
            Pode fotografar o próximo. Nada trava.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(255,255,255,.1)' }} />
          <div style={{
            width: 64, height: 64, borderRadius: '50%', border: '4px solid rgba(255,255,255,.3)',
            background: C.accStrong, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${1 - flash * 0.12})`,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(255,255,255,.1)' }} />
        </div>
      </div>
    </Phone>
  );
}

export const QUEUE = [
  ['Fone Bluetooth ANC', 'Foneclear · Preto 128 GB', 96],
  ['Carregador GaN 65W', 'Voltek · Preto 2 portas', 93],
  ['Cabo USB-C 2m', 'Voltek · Trançado cinza', 71],
  ['Powerbank 10.000 mAh', 'Genérico · Preto', 58],
  ['Suporte articulado', 'Deskline · Alumínio', 91],
];

export function PhoneQueue({ n = 0 }) {
  const shown = QUEUE.slice(0, Math.floor(n));
  const ready = shown.filter((q) => q[2] >= 85).length;
  const review = shown.filter((q) => q[2] < 85).length;
  return (
    <Phone>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 14px 16px', color: '#fff', minHeight: 0 }}>
        <div style={{ padding: '6px 4px 12px' }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>Fila de cadastro</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.5)', marginTop: 3 }}>
            {`${ready} prontos · ${review} para revisar`}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          {QUEUE.map(([name, sub, conf], i) => {
            const on = i < Math.floor(n);
            const app = i === Math.floor(n) ? n - Math.floor(n) : on ? 1 : 0;
            if (app <= 0.02) return null;
            const tone = conf >= 85 ? C.ok : conf >= 65 ? '#E0A028' : C.danger;
            return (
              <div key={name} style={{
                display: 'flex', gap: 10, padding: '10px 11px', background: 'rgba(255,255,255,.07)',
                borderRadius: 11, alignItems: 'center',
                opacity: app, transform: `translateX(${(1 - app) * 26}px)`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 7, background: 'rgba(255,255,255,.12)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
                </div>
                <span style={{ fontSize: 11, fontFamily: C.mono, color: tone, flexShrink: 0 }}>{`${conf}%`}</span>
              </div>
            );
          })}
        </div>
        <div style={{ paddingTop: 12 }}>
          <div style={{ height: 46, borderRadius: 11, background: C.accStrong, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14.5, fontWeight: 600 }}>
            {`Cadastrar ${ready} prontos`}
          </div>
        </div>
      </div>
    </Phone>
  );
}
