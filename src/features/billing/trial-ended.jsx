"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { LayoutPublic } from '@/components/layout/layout-public';
import { PLANS } from '@/lib/plans';
import { PlanOption } from '@/features/billing/plan-option';

export function TrialEnded() {
  const navigate = useNavigate();
  const [plan, setPlan] = React.useState('controle');
  return (
    <LayoutPublic navigate={navigate} route="/trial-ended">
      <section style={{ maxWidth: 940, margin: '0 auto', padding: '56px 32px 80px' }}>
        <span className="badge badge-warning" style={{ marginBottom: 14 }}>Teste de 30 dias encerrado</span>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.12 }}>
          Seu teste acabou ontem.<br />Nada do que você cadastrou foi perdido.
        </h1>
        <p style={{ margin: '14px 0 0', fontSize: 15, color: 'var(--fg-muted)', maxWidth: 560, lineHeight: 1.6 }}>
          Em 30 dias você cadastrou 312 SKUs, registrou 184 vendas e a IA leu 9 notas fiscais.
          Escolha um plano para o balcão voltar a funcionar hoje.
        </p>

        <div className="card g4" style={{ padding: 18, margin: '26px 0', gap: 16 }}>
          {[
            ['312', 'SKUs cadastrados'], ['184', 'vendas registradas'],
            ['9', 'notas lidas pela IA'], ['R$ 2.140', 'em ruptura evitada'],
          ].map(([v, l]) => (
            <div key={l}>
              <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.025em' }}>{v}</div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>

        <div className="g3" style={{ gap: 12 }}>
          {PLANS.map(p => <PlanOption key={p.id} plan={p} selected={plan === p.id} onSelect={() => setPlan(p.id)} />)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/checkout')} className="btn btn-primary">Assinar {PLANS.find(p => p.id === plan).name} e voltar ao trabalho</button>
          <button onClick={() => navigate('/exports')} className="btn btn-outline">Só exportar meus dados</button>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Seus dados ficam guardados por 90 dias.</span>
        </div>
      </section>
    </LayoutPublic>
  );
}

// === /billing/past-due — inadimplência em etapas ===
