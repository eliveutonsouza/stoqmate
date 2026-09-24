"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { Page } from '@/components/ui/page-container';
import { BillingBanner } from '@/features/billing/billing-banner';
import { I } from '@/components/icons';
import { PLANS } from '@/lib/plans';
import { brl } from '@/lib/format';

export function AccountCancelled() {
  const navigate = useNavigate();
  return (
    <StoreShell route="/account/cancelled" breadcrumb={['Conta cancelada']} navigate={navigate}>
      <Page width={860}>
        <BillingBanner
          tone="danger" icon="Credit"
          title="Assinatura cancelada — a conta está em somente leitura"
          desc="Você pode consultar e exportar até 30 de dezembro de 2026. Registrar venda, entrada ou ajuste está bloqueado."
          action="Reativar assinatura" onAction={() => navigate('/settings/subscription/change')}
        />
        <div className="card" style={{ padding: 22 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em' }}>Seus dados continuam aqui</h2>
          <p style={{ margin: '8px 0 18px', fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.6, maxWidth: 560 }}>
            Nada foi apagado. Se reativar dentro de 90 dias, tudo volta exatamente como estava — catálogo, histórico, usuários e regras de aviso.
          </p>
          <div className="g4" style={{ gap: 14 }}>
            {[
              ['1.688', 'SKUs preservados'], ['24 meses', 'de movimentações'],
              ['6', 'usuários congelados'], ['90 dias', 'para exportar'],
            ].map(([v, l]) => (
              <div key={l} style={{ padding: '13px 15px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8 }}>
                <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="g2" style={{ gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Exportar antes do prazo</div>
            <p style={{ margin: '5px 0 14px', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>Arquivos abertos, sem amarra: XLSX e CSV que qualquer outro sistema importa.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Catálogo e estoque atual', 'Movimentações · 24 meses', 'Clientes e crédito em loja', 'Fornecedores e pedidos'].map(x => (
                <button key={x} onClick={() => navigate('/exports')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', width: '100%' }}><I.Download size={12} /> {x}</button>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 18, borderColor: 'var(--accent)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Reativar</div>
            <p style={{ margin: '5px 0 14px', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              Volta na hora, com os mesmos dados. Você pode voltar em um plano menor que o anterior.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLANS.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', border: '1px solid var(--line)', borderRadius: 7 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>{p.name}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{brl(p.monthly)}/loja</span>
                  <button onClick={() => navigate('/checkout')} className="btn btn-primary btn-sm">Reativar</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /trial-ended — o teste acabou ===
