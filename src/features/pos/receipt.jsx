"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { I } from '@/components/icons';
import { brl } from '@/lib/format';
import { EmptyState } from '@/components/ui/empty-state';
import { paymentLabel } from '@/lib/payment-methods';

const describe = (p) => (p.method === 'credito' && p.installments > 1 ? `${paymentLabel(p.method)} ${p.installments}×` : paymentLabel(p.method));

export function Receipt({ sale }) {
  const navigate = useNavigate();

  if (!sale) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-sunken)', padding: '32px 24px' }}>
        <div style={{ maxWidth: 480, margin: '80px auto 0' }}>
          <EmptyState
            icon={<I.Alert size={18} />}
            title="Venda não encontrada"
            desc="O link do recibo é inválido ou a venda não existe mais."
            action={<button onClick={() => navigate('/pos')} className="btn btn-primary btn-sm">Voltar ao balcão</button>}
          />
        </div>
      </div>
    );
  }

  const items = sale.sale_items ?? [];
  const gross = sale.subtotal;
  const off = sale.discount_amount;
  const net = sale.total;
  // Vendas antigas (antes do registro por forma) caem no rótulo da venda.
  const payments = sale.payments?.length ? sale.payments
    : net > 0 ? [{ method: sale.payment_method, amount: net, installments: sale.installments }] : [];
  const paymentDetail = payments.length ? payments.map((p) => (payments.length > 1 ? `${describe(p)} ${brl(p.amount)}` : describe(p))).join(' · ') : 'Sem cobrança';
  const createdAt = new Date(sale.created_at);
  const shortId = sale.id.slice(0, 8).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-sunken)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'var(--success-soft)', color: 'var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><I.Check size={18} stroke={2.4} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em' }}>Venda #{shortId} registrada</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 2 }}>
              {brl(net)} · {paymentDetail} · estoque de {items.length} {items.length === 1 ? 'SKU' : 'SKUs'} atualizado
            </div>
          </div>
          <button onClick={() => navigate('/pos')} className="btn btn-primary btn-sm">Próximo atendimento</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          {/* 80mm thermal receipt */}
          <div style={{
            background: '#fff', color: '#16140F',
            padding: '20px 18px', borderRadius: 4,
            boxShadow: 'var(--shadow-md)',
            fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.55,
          }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>{sale.store?.name?.toUpperCase() ?? 'STOQMATE'}</div>
            </div>
            <div style={{ borderTop: '1px dashed #B8B2A4', borderBottom: '1px dashed #B8B2A4', padding: '7px 0', fontSize: 9.5, color: '#5C574F' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VENDA</span><span>#{shortId}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{createdAt.toLocaleDateString('pt-BR')}</span><span>{createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {sale.customer?.name && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CLIENTE</span><span>{sale.customer.name.toUpperCase()}</span></div>
              )}
            </div>
            <div style={{ padding: '10px 0' }}>
              {items.map((it) => (
                <div key={it.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 500 }}>{it.name_snapshot.toUpperCase()}</div>
                  {it.variant_snapshot && <div style={{ fontSize: 9.5, color: '#5C574F' }}>{it.variant_snapshot}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }}>
                    <span>{it.qty} × {it.unit_price.toFixed(2).replace('.', ',')}{it.discount_pct ? ` (-${it.discount_pct}%)` : ''}</span>
                    <span>{it.total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px dashed #B8B2A4', paddingTop: 8, fontSize: 10.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SUBTOTAL</span><span>{gross.toFixed(2).replace('.', ',')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>DESCONTOS</span><span>-{off.toFixed(2).replace('.', ',')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginTop: 6, paddingTop: 6, borderTop: '1px solid #16140F' }}>
                <span>TOTAL</span><span>{net.toFixed(2).replace('.', ',')}</span>
              </div>
              {payments.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginTop: i ? 2 : 6, fontSize: 10 }}>
                  <span>{describe(p).toUpperCase()}</span><span>{Number(p.amount).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 9, color: '#5C574F', lineHeight: 1.6 }}>
              NÃO É DOCUMENTO FISCAL
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 12 }}>O que aconteceu</div>
              {[
                ['Estoque baixado', `${items.length} ${items.length === 1 ? 'SKU' : 'SKUs'} · ${items.reduce((s, i) => s + i.qty, 0)} unidades em ${sale.store?.name ?? '—'}`],
                ['Movimentações criadas', `1 venda com ${items.length} ${items.length === 1 ? 'linha' : 'linhas'} · ref #${shortId}`],
                ['Pagamento', paymentDetail],
                ...(sale.notes ? [['Observações', sale.notes]] : []),
              ].map(([k, v], i, arr) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 150, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 12.5 }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 12 }}>Próximos passos</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <button onClick={() => navigate('/pos')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', width: '100%' }}>
                  <I.Plus size={12} /> Iniciar próximo atendimento
                </button>
                <button onClick={() => navigate('/stock/history?kind=sale')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', width: '100%' }}>
                  <I.Activity size={12} /> Ver as vendas no histórico
                </button>
                <button onClick={() => navigate('/cash')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', width: '100%' }}>
                  <I.Credit size={12} /> Conferir caixa do turno
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
