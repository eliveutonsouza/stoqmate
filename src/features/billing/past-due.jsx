"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { Page } from '@/components/ui/page-container';
import { BillingBanner } from '@/features/billing/billing-banner';
import { brl } from '@/lib/format';
import { SUB, subTotal } from '@/features/billing/billing-state';
import { PLANS } from '@/lib/plans';
import { I } from '@/components/icons';

export function PastDue() {
  const navigate = useNavigate();
  const [stage, setStage] = React.useState(2);
  const stages = [
    { n: 1, l: 'Dia 1 · aviso', tone: 'warning', t: 'Não conseguimos cobrar o cartão', d: 'Tentamos hoje às 03:12 e o banco recusou (saldo insuficiente). Tentamos de novo em 3 dias. Nada mudou no sistema.', block: 'none' },
    { n: 2, l: 'Dia 7 · IA pausada', tone: 'warning', t: 'Recursos de IA pausados até o pagamento', d: 'Segunda tentativa recusada. Balcão, estoque e relatórios seguem normais — a IA volta assim que a cobrança passar.', block: 'ai' },
    { n: 3, l: 'Dia 15 · somente leitura', tone: 'danger', t: 'A conta está em somente leitura', d: 'Terceira tentativa recusada. Você consulta e exporta tudo, mas não registra venda nem entrada. O acesso volta na hora em que o pagamento for confirmado.', block: 'write' },
  ];
  const s = stages.find(x => x.n === stage);
  return (
    <StoreShell route="/billing/past-due" breadcrumb={['Cobrança', 'Pagamento pendente']} navigate={navigate}>
      <Page width={920}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)', marginRight: 4 }}>Ver o estado em:</span>
          {stages.map(x => (
            <button key={x.n} onClick={() => setStage(x.n)} className={'btn btn-sm ' + (stage === x.n ? 'btn-primary' : 'btn-outline')}>{x.l}</button>
          ))}
        </div>

        <BillingBanner tone={s.tone} title={s.t} desc={s.d} action="Atualizar pagamento" onAction={() => navigate('/settings/subscription')} secondary="Ver fatura" onSecondary={() => navigate('/settings/subscription/invoice')} />

        <div className="split-aside" style={{ '--aside': '300px', gap: 16, alignItems: 'start' }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, letterSpacing: '-0.015em' }}>Resolver agora</h3>
            <p style={{ margin: '6px 0 16px', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
              O caminho mais rápido é o PIX: cai em segundos e destrava o acesso na hora.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                ['Pagar por PIX', `${brl(subTotal())} · libera em segundos`, 'primary'],
                ['Tentar o cartão de novo', SUB.card, 'outline'],
                ['Usar outro cartão', 'Master •••• 8810 está cadastrado', 'outline'],
                ['Descer para o Balcão', `${brl(PLANS[0].monthly * SUB.units)}/mês · a diferença já vira crédito`, 'outline'],
              ].map(([t, d, kind]) => (
                <button key={t} onClick={() => navigate(kind === 'primary' ? '/settings/subscription' : '/settings/subscription/change')} className={'btn btn-' + kind} style={{ justifyContent: 'flex-start', width: '100%', height: 'auto', padding: '11px 13px', textAlign: 'left', whiteSpace: 'normal' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{t}</span>
                    <span style={{ fontSize: 11.5, opacity: 0.75, fontWeight: 400, lineHeight: 1.4 }}>{d}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 10 }}>O que ainda funciona</div>
            {[
              ['Balcão e caixa', s.block !== 'write'],
              ['Entrada e ajuste de estoque', s.block !== 'write'],
              ['Consulta e relatórios', true],
              ['Exportação de dados', true],
              ['Recursos de IA', s.block === 'none'],
            ].map(([l, on], i, arr) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <span style={{ color: on ? 'var(--success)' : 'var(--danger)', display: 'flex' }}>{on ? <I.Check size={13} stroke={2.4} /> : <I.X size={13} />}</span>
                <span style={{ fontSize: 12.5, color: on ? 'var(--fg)' : 'var(--fg-muted)', flex: 1 }}>{l}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              Nada é apagado por falta de pagamento. A conta só é encerrada depois de 60 dias em aberto, sempre com aviso por email e WhatsApp.
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /settings/subscription/annual — trocar o ciclo mensal por anual ===
