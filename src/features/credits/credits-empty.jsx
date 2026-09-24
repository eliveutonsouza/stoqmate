"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { Page } from '@/components/ui/page-container';
import { BillingBanner } from '@/features/billing/billing-banner';
import { I } from '@/components/icons';
import { CREDIT_PACKS } from '@/lib/plans';
import { brl } from '@/lib/format';

export function CreditsEmpty() {
  const navigate = useNavigate();
  return (
    <StoreShell route="/ai" breadcrumb={['Inteligência artificial', 'Créditos esgotados']} navigate={navigate}>
      <Page width={880}>
        <BillingBanner
          tone="warning" icon="Sparkle"
          title="Os créditos de IA deste ciclo acabaram"
          desc="A IA pausou em 19 de setembro. Balcão, estoque e relatórios continuam funcionando normalmente — nada foi cobrado a mais."
          action="Comprar créditos" onAction={() => navigate('/settings/credits')}
          secondary="Ver consumo" onSecondary={() => navigate('/settings/credits')}
        />
        <div className="g2">
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Pausado até 01 de outubro</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Leitura de nota fiscal por foto', 'Previsão de demanda', 'Enriquecimento de catálogo', 'Pergunta em linguagem natural'].map(x => (
                <div key={x} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ color: 'var(--fg-soft)', display: 'flex' }}><I.X size={13} /></span>
                  <span style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>{x}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Como seguir sem gastar crédito</div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Importar nota por XML', 'O arquivo do fornecedor entra direto, sem IA.', '/stock/entry'],
                ['Reposição por média móvel', 'O cálculo é local e continua rodando.', '/purchase-orders'],
                ['Filtros salvos nos relatórios', 'Responde as mesmas perguntas sem o modelo.', '/reports'],
              ].map(([t, d, r]) => (
                <button key={t} onClick={() => navigate(r)} className="btn btn-outline btn-sm" style={{ justifyContent: 'space-between', width: '100%', height: 'auto', padding: '10px 12px', textAlign: 'left' }}>
                  <span><span style={{ display: 'block', fontSize: 12.5, fontWeight: 500 }}>{t}</span><span style={{ display: 'block', fontSize: 11, opacity: 0.7, fontWeight: 400, marginTop: 1 }}>{d}</span></span>
                  <I.ChevronRight size={13} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 4 }}>Retomar agora</div>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--fg-muted)' }}>Os créditos entram na hora, sem esperar o ciclo virar.</p>
          <div className="g3" style={{ gap: 10 }}>
            {CREDIT_PACKS.map(p => (
              <button key={p.credits} onClick={() => navigate('/settings/credits')} style={{ padding: '13px 15px', border: '1px solid var(--line)', borderRadius: 8, background: 'var(--bg-elev)', textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg)' }}>{p.credits.toLocaleString('pt-BR')} créditos</div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', marginTop: 4, color: 'var(--fg)' }}>{brl(p.price)}</div>
              </button>
            ))}
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /limit-reached — teto do plano atingido ===
