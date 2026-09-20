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

export function MovementDetail() {
  const navigate = useNavigate();
  const m = {
    ref: '#4286', type: 'sale', date: '18 set 2026 · 14:38', user: 'Lucas Prado',
    unit: 'Loja Centro', sku: 'ELE-FONE-PR-128', cat: 'eletronicos',
    name: 'Fone Bluetooth ANC', attrs: { cor: 'Preto', capacidade: '128 GB' },
    qty: -1, price: 299.00, discount: 0, total: 299.00, cost: 158.00,
    payment: 'Cartão de crédito · 3×', before: 43, after: 42,
  };
  const t = MOVEMENT_TYPES[m.type];

  return (
    <StoreShell route="/stock/movement" breadcrumb={['Estoque', 'Histórico', m.ref]} navigate={navigate}>
      <PageHeader
        title={`Venda ${m.ref}`}
        sub={`${m.date} · registrada por ${m.user} em ${m.unit}`}
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Download size={13} /> Comprovante</button>
            <button onClick={() => navigate('/stock/return')} className="btn btn-outline btn-sm">Registrar devolução</button>
            <button className="btn btn-outline btn-sm">Estornar</button>
          </>
        )}
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--line)' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 8px', borderRadius: 4,
                  background: t.soft, color: t.color, fontSize: 12, fontWeight: 500,
                }}>{t.icon} {t.label}</span>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{m.ref}</span>
                <div style={{ flex: 1 }}></div>
                <span className="badge badge-success"><I.Check size={10} stroke={3} /> Confirmada</span>
              </div>
              <div style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 13 }}>
                <ProductThumb cat={m.cat} attrs={m.attrs} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.012em' }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="mono">{m.sku}</span><span>·</span>
                    <span>{variantLabel(m.attrs)}</span><span>·</span>
                    <CategoryBadge cat={m.cat} />
                  </div>
                </div>
                <button onClick={() => navigate('/products/detail')} className="btn btn-outline btn-sm">Abrir produto</button>
              </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Dados do lançamento</h3>
              </div>
              {[
                ['Tipo', t.label],
                ['Referência', m.ref, true],
                ['Data e hora', m.date, true],
                ['Unidade', m.unit],
                ['Registrado por', m.user],
                ['Quantidade', `${Math.abs(m.qty)} unidade`, true],
                ['Preço unitário', brl(m.price), true],
                ['Desconto', m.discount ? `${m.discount}%` : 'Sem desconto', true],
                ['Forma de pagamento', m.payment],
              ].map(([k, v, mono], i, arr) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 140, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Rastro de auditoria</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Movimentações não são editadas — apenas corrigidas por um novo lançamento.</p>
              </div>
              {[
                ['14:38:12', 'Venda registrada por Lucas Prado', 'terminal-balcao-01 · 192.168.0.42'],
                ['14:38:12', `Saldo de ${m.sku} em Loja Centro: ${m.before} → ${m.after}`, 'automático'],
                ['14:38:13', 'Comprovante gerado', 'automático'],
                ['14:38:14', 'Alerta de estoque mínimo não disparado (42 > 10)', 'automático'],
              ].map(([time, what, src], i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', width: 62, flexShrink: 0 }}>{time}</span>
                  <span style={{ fontSize: 12.5, flex: 1 }}>{what}</span>
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{src}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Financeiro</div>
              <SummaryRow label="Valor bruto" value={brl(m.price)} />
              <SummaryRow label="Desconto" value={m.discount ? '− ' + brl(m.price * m.discount / 100) : brl(0)} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Total cobrado" value={brl(m.total)} strong />
              </div>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                <SummaryRow label="Custo da mercadoria" value={brl(m.cost)} />
                <SummaryRow label="Lucro" value={brl(m.total - m.cost)} tone="success" />
                <SummaryRow label="Margem" value={(((m.total - m.cost) / m.total) * 100).toFixed(1) + '%'} tone="success" />
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Efeito no estoque</div>
              <SummaryRow label="Saldo antes" value={`${m.before} un`} />
              <SummaryRow label="Saldo depois" value={`${m.after} un`} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Saldo atual" value="42 un" strong />
              </div>
              <button onClick={() => navigate('/stock/history')} className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                Ver histórico do SKU
              </button>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
