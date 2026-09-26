"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { Page } from '@/components/ui/page-container';

const LABELS = {
  skus: { noun: 'SKUs', one: 'SKU', unlimited: 'ilimitados', manage: 'Revisar catálogo', route: '/products', freeHint: 'Desativar produtos que você não vende mais libera espaço na hora.' },
  users: { noun: 'usuários', one: 'usuário', unlimited: 'ilimitados', manage: 'Gerenciar usuários', route: '/settings/users', freeHint: 'Remover um usuário inativo ou cancelar um convite pendente libera um assento.' },
  stores: { noun: 'lojas', one: 'loja', unlimited: 'ilimitadas', manage: 'Ver unidades', route: '/settings/units', freeHint: 'Centros de distribuição e estoques externos não contam nesse limite — só lojas.' },
};

export function LimitReached({ kind, planName, limits, usage, upgrade }) {
  const navigate = useNavigate();
  const l = LABELS[kind] ?? LABELS.skus;
  const limit = limits[kind];
  const used = usage[kind];
  const next = upgrade[kind];

  return (
    <StoreShell route="/limit-reached" breadcrumb={['Plano', 'Limite atingido']} navigate={navigate}>
      <Page width={760}>
        <div className="card" style={{ padding: 24 }}>
          {limit != null && (
            <span className="badge badge-warning" style={{ marginBottom: 12 }}>
              {used != null ? `${used} de ${limit} ${l.noun}` : `Limite: ${limit} ${l.noun}`}
            </span>
          )}
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em' }}>
            Você chegou ao limite de {l.noun} do plano {planName}
          </h2>
          <p style={{ margin: '10px 0 18px', fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.6, maxWidth: 540 }}>
            {limit != null ? `O ${planName} cobre até ${limit} ${limit === 1 ? l.one : l.noun}.` : ''}{' '}
            {next
              ? `O plano ${next.name} ${next.limit == null ? `tem ${l.noun} ${l.unlimited}` : `vai até ${next.limit} ${l.noun}`}.`
              : 'Fale com o suporte para um plano sob medida.'}{' '}
            {l.freeHint}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/settings/subscription')} className="btn btn-primary">
              {next ? `Subir para o ${next.name}` : 'Ver assinatura'}
            </button>
            <button onClick={() => navigate(l.route)} className="btn btn-outline">{l.manage}</button>
          </div>
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            Nada do que já existe foi bloqueado — o limite só impede criar mais. Sua operação atual segue igual.
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
