"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { subPlan } from '@/features/billing/billing-state';
import { StoreShell } from '@/components/ui/store-shell';
import { Page } from '@/components/ui/page-container';

export function LimitReached() {
  const navigate = useNavigate();
  const [kind, setKind] = React.useState('stores');
  const cur = subPlan();
  const cases = {
    stores: { t: 'Você chegou ao limite de lojas do Controle', now: `${cur.limits.stores} de ${cur.limits.stores} lojas`, d: 'O Controle cobre até 3 lojas. A quarta unidade precisa do plano Rede, que também libera recebimento com conferência cega e a visão consolidada.', cta: 'Subir para o Rede' },
    users: { t: 'Você chegou ao limite de usuários do Controle', now: `${cur.limits.users} de ${cur.limits.users} usuários`, d: 'Para liberar um assento agora, remova um usuário inativo — Diego Castro não acessa há 47 dias. Ou suba para o Rede, com usuários ilimitados.', cta: 'Subir para o Rede' },
    skus: { t: 'Você chegou ao limite de SKUs do Balcão', now: '300 de 300 SKUs', d: 'No Balcão o catálogo vai até 300 SKUs. No Controle é ilimitado — e a maioria das lojas cruza esse teto no terceiro mês.', cta: 'Subir para o Controle' },
  };
  const c = cases[kind];
  return (
    <StoreShell route="/limit-reached" breadcrumb={['Plano', 'Limite atingido']} navigate={navigate}>
      <Page width={760}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)', marginRight: 4 }}>Ver o caso de:</span>
          {[['stores', 'Lojas'], ['users', 'Usuários'], ['skus', 'SKUs']].map(([k, l]) => (
            <button key={k} onClick={() => setKind(k)} className={'btn btn-sm ' + (kind === k ? 'btn-primary' : 'btn-outline')}>{l}</button>
          ))}
        </div>
        <div className="card" style={{ padding: 24 }}>
          <span className="badge badge-warning" style={{ marginBottom: 12 }}>{c.now}</span>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em' }}>{c.t}</h2>
          <p style={{ margin: '10px 0 18px', fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.6, maxWidth: 540 }}>{c.d}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/settings/subscription/change')} className="btn btn-primary">{c.cta}</button>
            {kind === 'users' && <button onClick={() => navigate('/settings/users')} className="btn btn-outline">Gerenciar usuários</button>}
            {kind === 'stores' && <button onClick={() => navigate('/settings/units')} className="btn btn-outline">Ver unidades</button>}
            {kind === 'skus' && <button onClick={() => navigate('/products')} className="btn btn-outline">Revisar catálogo</button>}
          </div>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            Nada do que já existe foi bloqueado — o limite só impede criar mais. Sua operação atual segue igual.
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
