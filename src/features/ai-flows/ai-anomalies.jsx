"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { AIChip } from '@/features/ai/ai-chip';
import { ProductThumb } from '@/components/ui/product-thumb';
import { variantLabel } from '@/lib/attr-colors';
import { AttrChip } from '@/components/ui/attr-chip';
import { ConfidenceBar } from '@/features/ai/confidence-bar';

export function AIAnomalies() {
  const navigate = useNavigate();
  const items = [
    { sev: 'high', kind: 'Estoque fantasma', sku: 'VES-CPIM-BR-M', cat: 'vestuario', name: 'Camiseta Algodão Pima', attrs: { cor: 'Branco', tamanho: 'M' },
      says: 204, since: '6 dias', loss: 3916, conf: 82,
      what: 'O sistema diz 204 unidades, mas a venda caiu de 11/dia para 0,4/dia sem causa externa. O padrão é típico de item que não está na prateleira.',
      fix: 'Conferir o local C-01', route: '/mobile/count' },
    { sev: 'high', kind: 'Padrão de perda', sku: 'Local A-05', cat: 'eletronicos', name: 'Corredor A · base · acessórios', attrs: {},
      says: null, since: '30 dias', loss: 2840, conf: 77,
      what: '4 ajustes negativos no mesmo local, todos entre 14h e 18h, sempre em itens de alto valor e pequeno volume. A-05 concentra 68% dos ajustes negativos da loja.',
      fix: 'Abrir contagem em A-05', route: '/stock/count' },
    { sev: 'med', kind: 'Quebra silenciosa', sku: 'ALI-CAFE-IN-5KG', cat: 'alimentos', name: 'Café em Grãos', attrs: { sabor: 'Intenso', peso: '5 kg' },
      says: 2, since: '11 dias', loss: 1608, conf: 91,
      what: 'Ficou em ruptura 11 dos últimos 30 dias. Clientes corporativos que compravam este SKU não migraram para o de 1 kg — a venda simplesmente não aconteceu.',
      fix: 'Repor com urgência', route: '/purchase-orders' },
    { sev: 'med', kind: 'Preço fora da curva', sku: 'VES-MOLE-CZ-G', cat: 'vestuario', name: 'Moletom Flanelado', attrs: { cor: 'Cinza', tamanho: 'G' },
      says: 76, since: '90 dias', loss: 0, conf: 74,
      what: 'Preço 32% acima da média da categoria com giro de 0,3×/ano. R$ 18.426 parados em um item classe C.',
      fix: 'Simular novo preço', route: '/products/pricing' },
    { sev: 'low', kind: 'Divergência recorrente', sku: 'ELE-FONE-PR-128', cat: 'eletronicos', name: 'Fone Bluetooth ANC', attrs: { cor: 'Preto', capacidade: '128 GB' },
      says: 42, since: '60 dias', loss: 632, conf: 86,
      what: 'Três ajustes negativos de 2 unidades nos últimos 60 dias, sempre após transferência recebida. Sugere conferência incompleta no recebimento.',
      fix: 'Revisar recebimentos', route: '/stock/transfer/receive' },
  ];
  const SEV = { high: ['Alta', 'var(--danger)', 'var(--danger-soft)'], med: ['Média', 'var(--warning)', 'var(--warning-soft)'], low: ['Baixa', 'var(--fg-muted)', 'var(--bg-sunken)'] };
  const totalLoss = items.reduce((s, i) => s + i.loss, 0);

  return (
    <StoreShell route="/ai/anomalies" breadcrumb={['IA', 'Anomalias']} navigate={navigate}>
      <PageHeader
        title="Detecção de anomalia"
        sub="Última varredura hoje às 06:00 · 1.688 SKUs e 1.142 movimentações analisados"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Filter size={13} /> Severidade <I.ChevronDown size={11} /></button>
            <button className="btn btn-primary btn-sm"><I.Sparkle size={13} /> Varrer agora</button>
          </>
        )}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Anomalias abertas', v: '5', s: '2 de severidade alta', tone: 'warn' },
            { l: 'Perda estimada', v: brl(totalLoss), s: 'venda não realizada + ajustes', tone: 'bad' },
            { l: 'SKUs sob suspeita', v: '4', s: 'de 1.688 analisados' },
            { l: 'Acerto das detecções', v: '78%', s: 'confirmadas na conferência', tone: 'ok' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{
                fontSize: 21, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4,
                color: m.tone === 'bad' ? 'var(--danger)' : m.tone === 'warn' ? 'var(--warning)' : m.tone === 'ok' ? 'var(--success)' : 'var(--fg)',
              }}>{m.v}</div>
              <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', background: 'var(--bg-sunken)',
          border: '1px solid var(--line)', borderRadius: 8,
        }}>
          <span style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><I.Sparkle size={15} /></span>
          <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>Estoque fantasma</strong> é o achado mais valioso aqui:
            o saldo está certo no sistema e errado na prateleira, então nenhum relatório acusa —
            só o padrão de venda revela.
          </span>
          <AIChip label="IA" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((a, i) => {
            const [sevLabel, sevColor, sevBg] = SEV[a.sev];
            return (
              <div key={i} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                  <ProductThumb cat={a.cat} attrs={a.attrs} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 7px', borderRadius: 4, background: sevBg, color: sevColor, fontSize: 11, fontWeight: 600 }}>
                        {sevLabel}
                      </span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{a.kind}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--fg-muted)' }}>· {a.name}</span>
                      {variantLabel(a.attrs) && <AttrChip value={variantLabel(a.attrs)} />}
                    </div>
                    <p style={{ margin: '7px 0 0', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>{a.what}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 11, flexWrap: 'wrap' }}>
                      <ConfidenceBar value={a.conf} />
                      <span style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
                        Detectado há <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{a.since}</strong>
                      </span>
                      {a.loss > 0 && (
                        <span style={{ fontSize: 11.5, color: 'var(--danger)' }}>
                          Perda estimada <strong>{brl(a.loss)}</strong>
                        </span>
                      )}
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{a.sku}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => navigate(a.route)} className="btn btn-primary btn-sm">{a.fix}</button>
                    <button className="btn btn-ghost btn-sm">Ignorar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Page>
    </StoreShell>
  );
}
