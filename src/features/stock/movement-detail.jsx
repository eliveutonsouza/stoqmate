"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { MOVEMENT_TYPES } from '@/lib/movement-types';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { ProductThumb } from '@/components/ui/product-thumb';
import { variantLabel } from '@/lib/attr-colors';
import { CategoryBadge } from '@/components/ui/category-badge';
import { brl } from '@/lib/format';
import { SummaryRow } from '@/components/ui/summary-row';
import { EmptyState } from '@/components/ui/empty-state';
import { useCan } from '@/hooks/use-can';

export function MovementDetail({ movement: m }) {
  const navigate = useNavigate();
  const canGo = useCan();

  if (!m) {
    return (
      <StoreShell route="/stock/movement" breadcrumb={['Estoque', 'Histórico']} navigate={navigate}>
        <PageHeader title="Movimentação" />
        <Page>
          <EmptyState
            icon={<I.Alert size={18} />}
            title="Movimentação não encontrada"
            desc="O link é inválido ou o registro não existe mais."
            action={<button onClick={() => navigate('/stock/history')} className="btn btn-primary btn-sm">Voltar ao histórico</button>}
          />
        </Page>
      </StoreShell>
    );
  }

  const t = MOVEMENT_TYPES[m.kind] ?? MOVEMENT_TYPES.adjustment;
  const total = m.qty ? Math.abs(m.qty) * (m.unit_price ?? m.unit_cost ?? 0) : 0;
  const cost = m.qty ? Math.abs(m.qty) * (m.unit_cost ?? 0) : 0;
  const canOpenReceipt = m.kind === 'sale' && m.reference_type === 'sale' && m.reference_id;

  return (
    <StoreShell route="/stock/movement" breadcrumb={['Estoque', 'Histórico', t.label]} navigate={navigate}>
      <PageHeader
        title={`${t.label} · ${m.product?.name ?? 'Movimentação'}`}
        sub={`${new Date(m.created_at).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })} · registrada por ${m.byName} em ${m.store?.name ?? '—'}`}
        actions={(
          <>
            {canOpenReceipt && (
              <button onClick={() => navigate(`/receipt?id=${m.reference_id}`)} className="btn btn-outline btn-sm"><I.Download size={13} /> Ver recibo</button>
            )}
            {m.kind === 'sale' && canGo('/stock/return') && (
              (<button onClick={() => navigate(`/stock/return?product=${m.product?.id ?? ''}&store=${m.store?.id ?? ''}&qty=${Math.abs(m.qty)}`)} className="btn btn-outline btn-sm">Registrar devolução</button>)
            )}
          </>
        )}
      />
      <Page>
        <div className="split-aside" style={{ '--aside': '320px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--line)' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 8px', borderRadius: 4,
                  background: t.soft, color: t.color, fontSize: 12, fontWeight: 500,
                }}>{t.icon} {t.label}</span>
                <div style={{ flex: 1 }}></div>
                <span className="badge badge-success"><I.Check size={10} stroke={3} /> Confirmada</span>
              </div>
              {m.product && (
                <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 13 }}>
                  <ProductThumb category={m.product.category} brand={m.product.brand} attrs={m.product.attrs} size={44} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.012em' }}>{m.product.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="mono">{m.product.sku}</span><span>·</span>
                      <span>{variantLabel(m.product.attrs || {})}</span><span>·</span>
                      {m.product.category && <CategoryBadge category={m.product.category} />}
                    </div>
                  </div>
                  <button onClick={() => navigate(`/products/detail?id=${m.product.id}`)} className="btn btn-outline btn-sm">Abrir produto</button>
                </div>
              )}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Dados do lançamento</h3>
              </div>
              {[
                ['Tipo', t.label],
                ['Data e hora', new Date(m.created_at).toLocaleString('pt-BR'), true],
                ['Unidade', m.store?.name ?? '—'],
                ['Registrado por', m.byName],
                ['Quantidade', `${Math.abs(m.qty)} unidade${Math.abs(m.qty) === 1 ? '' : 's'}`, true],
                ...(m.unit_price ? [['Preço unitário', brl(m.unit_price), true]] : []),
                ...(m.unit_cost ? [['Custo unitário', brl(m.unit_cost), true]] : []),
                ...(m.reason ? [['Motivo', m.reason]] : []),
                ...(m.justification ? [['Justificativa', m.justification]] : []),
              ].map(([k, v, mono], i, arr) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 140, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div data-sticky style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(m.unit_price || m.unit_cost) && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Financeiro</div>
                {m.unit_price && <SummaryRow label="Valor" value={brl(total)} strong />}
                {m.unit_cost && (
                  <>
                    <SummaryRow label="Custo da mercadoria" value={brl(cost)} />
                    {m.unit_price && (
                      <>
                        <SummaryRow label="Lucro" value={brl(total - cost)} tone="success" />
                        <SummaryRow label="Margem" value={total > 0 ? (((total - cost) / total) * 100).toFixed(1) + '%' : '—'} tone="success" />
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Efeito no estoque</div>
              <SummaryRow label="Saldo antes" value={`${m.before_qty} un`} />
              <SummaryRow label="Saldo depois" value={`${m.after_qty} un`} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Saldo atual" value={`${m.currentQty} un`} strong />
              </div>
              <button onClick={() => navigate(m.product?.sku ? `/stock/history?q=${encodeURIComponent(m.product.sku)}` : '/stock/history')} className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                Ver histórico do produto
              </button>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
