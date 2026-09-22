"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { ProductThumb } from '@/components/ui/product-thumb';
import { variantLabel } from '@/lib/attr-colors';
import { AttrChip } from '@/components/ui/attr-chip';
import { EmptyState } from '@/components/ui/empty-state';

export function AIAnomalies({ stockouts, deadStock }) {
  const navigate = useNavigate();
  const [ignored, setIgnored] = React.useState(new Set());
  const ignore = (id) => setIgnored((s) => new Set(s).add(id));

  const visibleStockouts = stockouts.filter((s) => !ignored.has(`stockout-${s.productId}`));
  const visibleDeadStock = deadStock.filter((d) => !ignored.has(`dead-${d.productId}`));
  const totalLoss = visibleStockouts.reduce((s, i) => s + i.lossEstimate, 0);
  const totalParked = visibleDeadStock.reduce((s, i) => s + i.value, 0);
  const openCount = visibleStockouts.length + visibleDeadStock.length;

  return (
    <StoreShell route="/ai/anomalies" breadcrumb={['IA', 'Anomalias']} navigate={navigate}>
      <PageHeader
        title="Detecção de anomalia"
        sub="Sinais calculados sobre estoque e vendas reais desta unidade — sem IA, só matemática."
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Anomalias abertas', v: `${openCount}`, tone: openCount > 0 ? 'warn' : undefined },
            { l: 'Venda perdida estimada (7 dias)', v: brl(totalLoss), tone: totalLoss > 0 ? 'bad' : undefined },
            { l: 'Capital parado (sem venda 90d)', v: brl(totalParked), tone: totalParked > 0 ? 'warn' : undefined },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRight: i < 2 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{
                fontSize: 21, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4,
                color: m.tone === 'bad' ? 'var(--danger)' : m.tone === 'warn' ? 'var(--warning)' : 'var(--fg)',
              }}>{m.v}</div>
            </div>
          ))}
        </div>

        {visibleStockouts.length === 0 && visibleDeadStock.length === 0 ? (
          <EmptyState icon={<I.Check size={18} />} title="Nada em aberto" desc="Nenhuma ruptura com venda recente e nenhum estoque parado detectado." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleStockouts.map((s) => (
              <div key={s.productId} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                  <ProductThumb category={s.category} attrs={s.attrs} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 7px', borderRadius: 4, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 11, fontWeight: 600 }}>Ruptura</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{s.name}</span>
                      {variantLabel(s.attrs || {}) && <AttrChip value={variantLabel(s.attrs || {})} />}
                    </div>
                    <p style={{ margin: '7px 0 0', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
                      Saldo zerado, mas vendia {s.soldPerDay.toFixed(1)}/dia nos últimos 30 dias — perda estimada de {brl(s.lossEstimate)} em uma semana sem repor.
                    </p>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{s.sku}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => navigate('/stock/entry')} className="btn btn-primary btn-sm">Repor agora</button>
                    <button onClick={() => ignore(`stockout-${s.productId}`)} className="btn btn-ghost btn-sm">Ignorar</button>
                  </div>
                </div>
              </div>
            ))}
            {visibleDeadStock.map((d) => (
              <div key={d.productId} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: 16, display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                  <ProductThumb category={d.product?.category} brand={d.product?.brand} attrs={d.product?.attrs} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 7px', borderRadius: 4, background: 'var(--warning-soft)', color: 'var(--warning)', fontSize: 11, fontWeight: 600 }}>Estoque parado</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em' }}>{d.product?.name}</span>
                    </div>
                    <p style={{ margin: '7px 0 0', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
                      {d.qty} unidades ({brl(d.value)} a custo) sem nenhuma venda nos últimos 90 dias.
                    </p>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{d.product?.sku}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => navigate('/products/pricing')} className="btn btn-primary btn-sm">Simular preço</button>
                    <button onClick={() => ignore(`dead-${d.productId}`)} className="btn btn-ghost btn-sm">Ignorar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Page>
    </StoreShell>
  );
}
