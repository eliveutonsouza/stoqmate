"use client";

import * as React from 'react';
import { SECTION } from '@/features/landing/section';
import { Eyebrow } from '@/features/landing/eyebrow';
import { H2 } from '@/features/landing/h2';
import { Lead } from '@/features/landing/lead';
import { brl } from '@/lib/format';
import { I } from '@/components/icons';

const Row = ({ label, value, hint }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13 }}>{label}</div>
      {hint && <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{hint}</div>}
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>{value}</div>
  </div>
);

const Slider = ({ label, value, set, min, max, step, fmt }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmt(value)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => set(+e.target.value)}
      style={{ width: '100%', accentColor: 'var(--accent)' }} />
  </div>
);

export function LandingROI({ navigate, plans, trialDays }) {
  const [skus, setSkus] = React.useState(800);
  const [ticket, setTicket] = React.useState(180);
  const [stores, setStores] = React.useState(2);
  const [notes, setNotes] = React.useState(12);

  // Conservative model, stated openly so the number survives scrutiny.
  const rupturePerMonth = Math.round(skus * 0.04 * 1.6 * ticket);   // 4% em ruptura, 1,6 venda perdida cada
  const hoursOnNotes = notes * 6 / 60;                              // 6 min por nota
  const hoursOnCount = stores * 4;                                  // 4 h de inventário por loja
  const laborValue = Math.round((hoursOnNotes + hoursOnCount) * 28); // R$ 28/h
  const deadStock = Math.round(skus * 0.38 * ticket * 0.55 * 0.12);  // 12% do capital classe C liberado
  const gain = rupturePerMonth + laborValue + deadStock;
  const plan = stores > 3 ? plans[2] : stores > 1 ? plans[1] : plans[0];
  const cost = plan.monthly * stores;
  const roi = cost > 0 ? gain / cost : 0;

  return (
    <section style={{ ...SECTION, padding: '76px 32px' }}>
      <div style={{ textAlign: 'center' }}>
        <Eyebrow>Calculadora</Eyebrow>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <H2 max={620}>Quanto o descontrole custa na sua loja, hoje</H2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Lead max={560}>Mexa nos números do seu negócio. A conta é conservadora e está toda aberta abaixo.</Lead>
        </div>
      </div>

      <div className="lp-roi" style={{ marginTop: 36 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.012em', marginBottom: 20 }}>Seu cenário</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Slider label="SKUs no catálogo" value={skus} set={setSkus} min={100} max={5000} step={100} fmt={v => v.toLocaleString('pt-BR')} />
            <Slider label="Ticket médio" value={ticket} set={setTicket} min={20} max={800} step={10} fmt={v => brl(v)} />
            <Slider label="Lojas" value={stores} set={setStores} min={1} max={10} step={1} fmt={v => v + (v === 1 ? ' loja' : ' lojas')} />
            <Slider label="Notas de entrada por mês" value={notes} set={setNotes} min={2} max={80} step={2} fmt={v => v + ' notas'} />
          </div>
        </div>

        <div className="card" style={{ padding: 22, borderColor: 'var(--accent)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.012em', marginBottom: 6 }}>Ganho estimado por mês</div>
          <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginBottom: 16 }}>
            Com {skus.toLocaleString('pt-BR')} SKUs em {stores} {stores === 1 ? 'loja' : 'lojas'}.
          </div>

          <Row label="Venda recuperada de ruptura" value={brl(rupturePerMonth)}
            hint="4% do catálogo em falta, 1,6 venda perdida por item" />
          <Row label="Horas devolvidas à equipe" value={brl(laborValue)}
            hint={`${hoursOnNotes.toFixed(0)} h em notas + ${hoursOnCount} h de inventário, a R$ 28/h`} />
          <Row label="Capital liberado de item parado" value={brl(deadStock)}
            hint="12% do estoque classe C convertido em giro" />

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '16px 0 0' }}>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Total estimado</div>
            <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.028em', color: 'var(--success)' }}>{brl(gain)}</div>
          </div>

          <div style={{
            marginTop: 18, padding: '14px 16px', background: 'var(--bg-sunken)',
            border: '1px solid var(--line)', borderRadius: 9,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-muted)', flex: 1 }}>
                Plano {plan.name} · {stores} {stores === 1 ? 'loja' : 'lojas'}
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{brl(cost)}/mês</span>
            </div>
            <div style={{ height: 1, background: 'var(--line)', margin: '12px 0' }}></div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>Retorno sobre o custo</span>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-text)' }}>
                {roi.toFixed(1)}×
              </span>
            </div>
          </div>

          <button onClick={() => navigate('/signup')} className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            Testar {trialDays} dias grátis <I.ArrowRight size={14} />
          </button>
          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
            Estimativa, não promessa. Serve para você decidir se vale o teste.
          </div>
        </div>
      </div>
    </section>
  );
}

// === 8 · COMPARISON (anchoring) ===
