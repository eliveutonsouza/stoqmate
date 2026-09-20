"use client";

// Coreografia do filme do hero. Uma árvore só, tudo derivado de T (segundos).
// As telas do app são prints reais (hero-film-pieces.jsx) — como um print não
// anima sozinho, o movimento vem da câmera: cada cena tem uma trilha de foco
// (escala + ponto focal em % da imagem) que entra na tela, lê o que importa e
// sai.

import { useFilmClock, Shot, Easing, animate, clamp } from '@/features/landing/hero-film-engine';
import { C, SHOTS, SLAB_W, SLAB_H, Mark, PhoneCamera, PhoneQueue } from '@/features/landing/hero-film-pieces';

export const OM_SCENES = [
  { name: 'Abertura', dur: 6 },
  { name: 'Marca', dur: 5 },
  { name: 'Conferencia', dur: 10 },
  { name: 'Cadastro', dur: 9 },
  { name: 'Rede', dur: 9 },
  { name: 'Anomalias', dur: 8 },
  { name: 'Economia', dur: 6 },
  { name: 'Fechamento', dur: 7 },
];

const MOTION = {
  enter: (from, to, start, end) => animate({ from, to, start, end, ease: Easing.easeOutExpo }),
  glide: (from, to, start, end) => animate({ from, to, start, end, ease: Easing.easeInOutCubic }),
};

// Trilha de foco: [{t, s, x, y}] em segundos absolutos e % da imagem.
function focusAt(T, keys) {
  if (T <= keys[0].t) return keys[0];
  const last = keys[keys.length - 1];
  if (T >= last.t) return last;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (T >= a.t && T <= b.t) {
      const p = Easing.easeInOutCubic((T - a.t) / (b.t - a.t));
      return { s: a.s + (b.s - a.s) * p, x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p };
    }
  }
  return last;
}

function Backdrop({ T }) {
  const drift = T * 8;
  const pulse = 0.5 + 0.5 * Math.sin(T * 0.55);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0A0907', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: '-20%',
        background: `radial-gradient(900px 620px at ${38 + Math.sin(T * 0.3) * 6}% ${30 + Math.cos(T * 0.24) * 8}%, rgba(233,75,28,${0.20 + pulse * 0.07}), transparent 62%),
                     radial-gradient(760px 560px at ${72 + Math.cos(T * 0.21) * 7}% ${74 + Math.sin(T * 0.19) * 6}%, rgba(120,60,180,.13), transparent 64%)`,
      }} />
      <div style={{
        position: 'absolute', inset: '-40%', opacity: 0.30,
        backgroundImage: `linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px)`,
        backgroundSize: '92px 92px',
        transform: `perspective(1200px) rotateX(64deg) translateY(${-drift % 92}px) scale(2.1)`,
        transformOrigin: '50% 100%',
        maskImage: 'linear-gradient(to bottom, transparent, #000 45%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 45%, transparent)',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(1500px 900px at 50% 45%, transparent 40%, rgba(0,0,0,.72))' }} />
    </div>
  );
}

function Glass({ children, style, pad = '20px 26px' }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(255,255,255,.16), rgba(255,255,255,.055))',
      backdropFilter: 'blur(22px) saturate(150%)', WebkitBackdropFilter: 'blur(22px) saturate(150%)',
      border: '1px solid rgba(255,255,255,.22)', borderRadius: 18,
      boxShadow: '0 28px 70px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.3)',
      padding: pad, color: '#fff', ...style,
    }}>{children}</div>
  );
}

// Laje com um print real dentro, sob uma câmera que aproxima e desliza. A
// <img> nunca é desmontada: <Shot> mantém os filhos montados justamente pra
// imagem preservar a prontidão.
function ShotSlab({ src, focus, x = 0, y = 0, z = 0, rx = 0, ry = 0, s = 1, o = 1, glow = 0 }) {
  const hidden = o <= 0.005;
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', width: SLAB_W, height: SLAB_H,
      marginLeft: -SLAB_W / 2, marginTop: -SLAB_H / 2, opacity: hidden ? 0 : o,
      visibility: hidden ? 'hidden' : 'visible',
      transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`,
      transformStyle: 'preserve-3d', willChange: 'transform', pointerEvents: 'none',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 14, overflow: 'hidden', background: '#fff',
        boxShadow: `0 60px 130px rgba(0,0,0,.62), 0 0 0 1px rgba(255,255,255,.10), 0 0 ${60 + glow * 90}px rgba(233,75,28,${glow * 0.5})`,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- animated
            composition frame (transform-scaled camera zoom, always mounted,
            visibility-toggled by <Shot>); client-only via next/dynamic
            (ssr:false), so it's never an LCP candidate. */}
        <img src={src} alt="" style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          transform: `scale(${focus.s})`, transformOrigin: `${focus.x}% ${focus.y}%`,
        }} />
      </div>
    </div>
  );
}

function Words({ text, T, start, size = 84, weight = 600, color = '#fff', stagger = 0.075, style, lh = 1.06 }) {
  const ws = text.split(' ');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.12em 0.30em', justifyContent: 'center', lineHeight: lh, fontSize: size, ...style }}>
      {ws.map((w, i) => {
        const p = clamp((T - (start + i * stagger)) / 0.62, 0, 1);
        const e = Easing.easeOutExpo(p);
        return (
          <span key={i} style={{
            display: 'inline-block', fontSize: size, fontWeight: weight, color,
            letterSpacing: '-0.035em', opacity: e,
            transform: `translateY(${(1 - e) * 46}px) rotateX(${(1 - e) * -55}deg)`,
            transformOrigin: '50% 100%',
          }}>{w}</span>
        );
      })}
    </div>
  );
}

function Sub({ text, T, start, size = 27, color = 'rgba(255,255,255,.72)', style }) {
  const e = Easing.easeOutExpo(clamp((T - start) / 0.7, 0, 1));
  return (
    <div style={{
      fontSize: size, color, fontWeight: 400, letterSpacing: '-0.012em', textAlign: 'center',
      opacity: e, transform: `translateY(${(1 - e) * 18}px)`, lineHeight: 1.45, ...style,
    }}>{text}</div>
  );
}

function Counter({ to, T, start, dur = 1.3, prefix = 'R$ ', dec = 2, size = 100, color = '#fff' }) {
  const v = to * Easing.easeOutExpo(clamp((T - start) / dur, 0, 1));
  return (
    <span style={{ fontFamily: C.mono, fontSize: size, fontWeight: 600, letterSpacing: '-0.04em', color, fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })}
    </span>
  );
}

function Chapter({ n, label, T, start, end }) {
  const p = clamp((T - start) / 0.5, 0, 1) * clamp((end - T) / 0.4, 0, 1);
  if (p <= 0.01) return null;
  return (
    <div style={{
      position: 'absolute', left: 78, bottom: 74, display: 'flex', alignItems: 'center', gap: 14,
      opacity: p, transform: `translateX(${(1 - p) * -22}px)`,
    }}>
      <span style={{ fontFamily: C.mono, fontSize: 17, color: C.acc, fontWeight: 500 }}>{n}</span>
      <span style={{ width: 34, height: 1, background: 'rgba(255,255,255,.3)' }} />
      <span style={{ fontSize: 19, color: 'rgba(255,255,255,.78)', fontWeight: 500, letterSpacing: '-0.01em' }}>{label}</span>
    </div>
  );
}

// Faixa de legenda no rodapé — fica fora do caminho da laje.
function Lower({ T, from, to, title, line }) {
  const p = clamp((T - from) / 0.55, 0, 1) * clamp((to - T) / 0.45, 0, 1);
  if (p <= 0.01) return null;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 58, display: 'flex', justifyContent: 'center',
      opacity: p, transform: `translateY(${(1 - p) * 20}px)`,
    }}>
      <Glass style={{ textAlign: 'center', maxWidth: 1180 }} pad="16px 38px">
        <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-0.032em' }}>{title}</div>
        <div style={{ fontSize: 23, color: 'rgba(255,255,255,.74)', marginTop: 6 }}>{line}</div>
      </Glass>
    </div>
  );
}

export function Film() {
  const { T, CUES: K, authoredTotal } = useFilmClock();

  const slide = (cue) => MOTION.glide(0, 1, cue - 0.55, cue + 0.55)(T);
  const PUSH = 2300;
  const slabO = (sIn, sOut) => clamp(sIn / 0.18, 0, 1) * (1 - clamp((sOut - 0.82) / 0.18, 0, 1));

  const sConf = slide(K.Conferencia), sCad = slide(K.Cadastro);
  const sRede = slide(K.Rede), sAnom = slide(K.Anomalias), sEcon = slide(K.Economia);

  // A laje sobe um pouco pro rodapé de legenda nunca encostar nela.
  const LIFT = -46;

  // 2 · Marca — o dashboard real entra voando
  const dashIn = MOTION.enter(0, 1, K.Marca - 0.25, K.Marca + 1.5)(T);
  const dashFocus = focusAt(T, [
    { t: K.Marca, s: 1.0, x: 50, y: 40 },
    { t: K.Conferencia, s: 1.14, x: 46, y: 26 },
  ]);

  // 3 · Conferência — entra na tabela e termina no número
  const cFocus = focusAt(T, [
    { t: K.Conferencia, s: 1.0, x: 50, y: 38 },
    { t: K.Conferencia + 2.6, s: 1.55, x: 30, y: 24 },
    { t: K.Conferencia + 6.2, s: 1.42, x: 60, y: 57 },
    { t: K.Cadastro, s: 1.30, x: 100, y: 22 },
  ]);

  // 4 · Cadastro em lote — a única cena animada
  const pLive = slabO(sCad, sRede);
  const pX = (1 - sCad) * PUSH - sRede * PUSH;
  const tp = T - K.Cadastro;
  const shotTimes = [1.0, 1.75, 2.45, 3.15, 3.8];
  const shots = shotTimes.filter((s) => tp > s).length;
  const lastShot = shotTimes.reduce((acc, s) => (tp > s && tp - s < 0.22 ? s : acc), -9);
  const flash = lastShot > -9 ? clamp(1 - (tp - lastShot) / 0.22, 0, 1) * 0.85 : 0;
  const qN = clamp((tp - 1.35) / 0.72, 0, 5);

  // 5 · Rede
  const nFocus = focusAt(T, [
    { t: K.Rede, s: 1.0, x: 50, y: 38 },
    { t: K.Rede + 3.2, s: 1.38, x: 58, y: 48 },
    { t: K.Anomalias, s: 1.34, x: 55, y: 80 },
  ]);

  // 6 · Anomalias
  const aFocus = focusAt(T, [
    { t: K.Anomalias, s: 1.0, x: 50, y: 34 },
    { t: K.Anomalias + 3.0, s: 1.44, x: 44, y: 38 },
    { t: K.Economia, s: 1.34, x: 10, y: 20 },
  ]);

  const closeIn = clamp((T - K.Fechamento) / 0.9, 0, 1);
  const loopFade = clamp((authoredTotal - 0.3 - T) / 0.3, 0, 1);

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      fontFamily: C.sans, perspective: 1900, perspectiveOrigin: '50% 46%',
    }}>
      <Backdrop T={T} />

      {/* As quatro lajes ficam montadas o filme inteiro — sem <Shot> em volta.
          São só quatro <img>, e um remount a frio pode piscar em branco. */}
      <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>
        <ShotSlab src={SHOTS.dashboard} focus={dashFocus}
          o={dashIn * (1 - clamp((sConf - 0.82) / 0.18, 0, 1))}
          s={0.30 + dashIn * 0.46} ry={34 - dashIn * 34 - sConf * 16}
          z={-1500 + dashIn * 1500} x={-sConf * PUSH}
          y={LIFT + Math.sin((T - K.Marca) * 0.5) * 8 + (1 - dashIn) * 90}
          rx={2.5 - dashIn * 2.5} glow={dashIn * (1 - sConf) * 0.3} />

        <ShotSlab src={SHOTS.match} focus={cFocus} o={slabO(sConf, sCad)} s={0.76}
          ry={(1 - sConf) * -14 + sCad * -14} x={(1 - sConf) * PUSH - sCad * PUSH}
          y={LIFT + Math.sin((T - K.Conferencia) * 0.45) * 6} glow={0.32} />

        <ShotSlab src={SHOTS.network} focus={nFocus} o={slabO(sRede, sAnom)} s={0.76}
          ry={(1 - sRede) * -14 + sAnom * -14} x={(1 - sRede) * PUSH - sAnom * PUSH}
          y={LIFT + Math.sin((T - K.Rede) * 0.45) * 6} glow={0.26} />

        <ShotSlab src={SHOTS.anomalies} focus={aFocus} o={slabO(sAnom, sEcon)} s={0.76}
          ry={(1 - sAnom) * -14 + sEcon * -14} x={(1 - sAnom) * PUSH - sEcon * PUSH}
          y={LIFT + Math.sin((T - K.Anomalias) * 0.45) * 6} glow={0.3} />

        <Shot from={K.Cadastro - 0.8} to={K.Rede + 0.8}>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 86, opacity: pLive,
            transform: `translate3d(${pX}px, -30px, 0px)`, transformStyle: 'preserve-3d',
          }}>
            <div style={{ transform: `perspective(1400px) rotateY(10deg) translateY(${Math.sin(T * 0.6) * 9}px)` }}>
              <PhoneCamera shots={shots} flash={flash} />
            </div>
            <div style={{ transform: `perspective(1400px) rotateY(-10deg) translateY(${Math.cos(T * 0.6) * 9 - 14}px)` }}>
              <PhoneQueue n={qN} />
            </div>
          </div>
        </Shot>
      </div>

      {/* 1 · Abertura */}
      <Shot from={0} to={K.Marca + 0.8}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 34,
          opacity: clamp((K.Marca - T) / 0.7, 0, 1),
        }}>
          <Words text="O cliente pede." T={T} start={0.25} size={96} />
          <Words text="Você não tem." T={T} start={0.95} size={96} color={C.acc} />
          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ opacity: clamp((T - 2.1) / 0.5, 0, 1) }}>
              <Counter to={4800} T={T} start={2.15} dec={0} size={104} />
            </div>
            <Sub text="por mês em venda que simplesmente não acontece" T={T} start={2.9} />
          </div>
        </div>
      </Shot>

      {/* 2 · Marca */}
      <Shot from={K.Marca + 0.2} to={K.Conferencia + 0.3}>
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 62, display: 'flex',
          flexDirection: 'column', alignItems: 'center', gap: 14,
          opacity: clamp((T - K.Marca - 0.5) / 0.6, 0, 1) * clamp((K.Conferencia - 0.35 - T) / 0.5, 0, 1),
        }}>
          <Glass style={{ display: 'flex', alignItems: 'center', gap: 18, borderRadius: 999 }} pad="13px 30px 13px 20px">
            <Mark size={38} fill="#fff" box={C.accStrong} />
            <span style={{ fontSize: 38, fontWeight: 600, letterSpacing: '-0.03em' }}>Stoq<span style={{ color: '#FFB99E' }}>mate</span></span>
          </Glass>
          <Sub text="Controle de estoque multi-loja com IA que trabalha sozinha." T={T} start={K.Marca + 1.0} size={27} />
        </div>
      </Shot>

      {/* 3 · Conferência */}
      <Lower T={T} from={K.Conferencia + 0.5} to={K.Cadastro - 2.6}
        title="A IA confere a nota contra o pedido"
        line="Item a item, em 4 segundos. Você nunca mais paga o que não pediu." />
      <Shot from={K.Cadastro - 2.8} to={K.Cadastro + 0.3}>
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 58, display: 'flex', justifyContent: 'center',
          opacity: clamp((T - K.Cadastro + 2.5) / 0.55, 0, 1) * clamp((K.Cadastro - 0.35 - T) / 0.45, 0, 1),
        }}>
          <Glass style={{ textAlign: 'center', borderColor: 'rgba(255,140,100,.4)' }} pad="16px 40px">
            <div style={{ fontSize: 22, color: 'rgba(255,255,255,.72)' }}>Nesta nota, a IA achou</div>
            <div style={{ marginTop: 2 }}><Counter to={3016.8} T={T} start={K.Cadastro - 2.3} size={64} color="#FF9B72" /></div>
          </Glass>
        </div>
      </Shot>

      {/* 4 · Cadastro */}
      <Shot from={K.Cadastro + 0.3} to={K.Rede + 0.3}>
        <div style={{
          position: 'absolute', left: 92, top: 0, bottom: 0, width: 520,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20,
          opacity: clamp((T - K.Cadastro - 0.5) / 0.6, 0, 1) * clamp((K.Rede - 0.4 - T) / 0.5, 0, 1),
        }}>
          <Words text="Cadastre pela câmera." T={T} start={K.Cadastro + 0.7} size={62} style={{ justifyContent: 'flex-start' }} />
          <Sub text="Fotografe a prateleira inteira em série. A IA lê em segundo plano e só o que ficou em dúvida pede a sua atenção."
            T={T} start={K.Cadastro + 1.5} size={25} style={{ textAlign: 'left' }} />
          <div style={{ display: 'flex', gap: 12, marginTop: 8, opacity: clamp((T - K.Cadastro - 2.6) / 0.6, 0, 1) }}>
            <Glass pad="14px 22px" style={{ borderRadius: 14 }}>
              <div style={{ fontSize: 34, fontWeight: 600, fontFamily: C.mono, letterSpacing: '-0.03em' }}>800</div>
              <div style={{ fontSize: 17, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>produtos num sábado</div>
            </Glass>
            <Glass pad="14px 22px" style={{ borderRadius: 14 }}>
              <div style={{ fontSize: 34, fontWeight: 600, fontFamily: C.mono, letterSpacing: '-0.03em' }}>4s</div>
              <div style={{ fontSize: 17, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>por item, sem digitar</div>
            </Glass>
          </div>
        </div>
      </Shot>

      {/* 5 · Rede */}
      <Lower T={T} from={K.Rede + 0.5} to={K.Anomalias - 0.35}
        title="Suas lojas param de competir entre si"
        line="Um catálogo, saldo por unidade, e a IA sugere a transferência antes da ruptura." />

      {/* 6 · Anomalias */}
      <Lower T={T} from={K.Anomalias + 0.5} to={K.Economia - 0.35}
        title="Ela acha o que nenhum relatório acusa"
        line="Estoque fantasma: o saldo está certo no sistema e errado na prateleira. Só o padrão de venda revela." />

      {/* 7 · Economia */}
      <Shot from={K.Economia - 0.2} to={K.Fechamento + 0.4}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 40,
          opacity: clamp((T - K.Economia) / 0.6, 0, 1) * clamp((K.Fechamento - 0.25 - T) / 0.45, 0, 1),
        }}>
          <Words text="O que isso devolve para você" T={T} start={K.Economia + 0.15} size={58} />
          <div style={{ display: 'flex', gap: 26 }}>
            {[
              ['6 min → 12 s', 'para dar entrada numa nota'],
              ['R$ 3.016', 'achados numa única conferência'],
              ['R$ 8.996', 'em perdas silenciosas encontradas'],
            ].map(([big, small], i) => {
              const p = clamp((T - K.Economia - 0.7 - i * 0.22) / 0.62, 0, 1);
              const e = Easing.easeOutBack(p);
              return (
                <Glass key={big} pad="30px 34px" style={{
                  minWidth: 330, textAlign: 'center',
                  opacity: clamp(p * 1.3, 0, 1), transform: `translateY(${(1 - e) * 44}px) scale(${0.92 + e * 0.08})`,
                }}>
                  <div style={{ fontSize: 46, fontWeight: 600, fontFamily: C.mono, letterSpacing: '-0.038em', color: '#FFB99E' }}>{big}</div>
                  <div style={{ fontSize: 20, color: 'rgba(255,255,255,.75)', marginTop: 9, lineHeight: 1.4 }}>{small}</div>
                </Glass>
              );
            })}
          </div>
        </div>
      </Shot>

      {/* 8 · Fechamento */}
      <Shot from={K.Fechamento - 0.2} to={authoredTotal + 0.5}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 26,
          opacity: closeIn * loopFade, transform: `scale(${0.95 + closeIn * 0.05})`,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 22,
            opacity: clamp((T - K.Fechamento - 0.1) / 0.6, 0, 1),
            transform: `scale(${0.8 + Easing.easeOutBack(clamp((T - K.Fechamento - 0.1) / 0.8, 0, 1)) * 0.2})`,
          }}>
            <Mark size={78} fill={C.accStrong} box="#fff" />
            <span style={{ fontSize: 82, fontWeight: 600, letterSpacing: '-0.038em', color: '#fff' }}>
              Stoq<span style={{ color: '#FF9B72' }}>mate</span>
            </span>
          </div>
          <Sub text="Controle de estoque multi-loja com IA. Para quem vende de tudo." T={T} start={K.Fechamento + 0.75} size={30} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginTop: 18,
            opacity: clamp((T - K.Fechamento - 1.35) / 0.6, 0, 1),
            transform: `translateY(${(1 - clamp((T - K.Fechamento - 1.35) / 0.6, 0, 1)) * 22}px)`,
          }}>
            <div style={{
              background: C.accStrong, color: '#fff', fontSize: 26, fontWeight: 600,
              padding: '18px 38px', borderRadius: 12, letterSpacing: '-0.015em',
              boxShadow: '0 18px 44px rgba(233,75,28,.45)',
            }}>Testar 30 dias grátis</div>
            <Glass pad="16px 26px" style={{ borderRadius: 12 }}>
              <span style={{ fontSize: 22, color: 'rgba(255,255,255,.82)' }}>a partir de </span>
              <span style={{ fontSize: 26, fontWeight: 600, fontFamily: C.mono }}>R$ 89</span>
              <span style={{ fontSize: 22, color: 'rgba(255,255,255,.82)' }}>/mês</span>
            </Glass>
          </div>
          <div style={{ fontSize: 19, color: 'rgba(255,255,255,.5)', marginTop: 10, opacity: clamp((T - K.Fechamento - 1.9) / 0.6, 0, 1) }}>
            Sem cartão para testar · sem fidelidade · cancela em dois cliques
          </div>
        </div>
      </Shot>

      <Chapter n="01" label="Conferência da nota" T={T} start={K.Conferencia + 0.6} end={K.Cadastro - 0.2} />
      <Chapter n="02" label="Cadastro pela câmera" T={T} start={K.Cadastro + 0.6} end={K.Rede - 0.2} />
      <Chapter n="03" label="Visão da rede" T={T} start={K.Rede + 0.6} end={K.Anomalias - 0.2} />
      <Chapter n="04" label="Detecção de anomalia" T={T} start={K.Anomalias + 0.6} end={K.Economia - 0.2} />

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 220px rgba(0,0,0,.55)' }} />
    </div>
  );
}
