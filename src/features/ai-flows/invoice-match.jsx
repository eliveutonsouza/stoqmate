"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { brl } from '@/lib/format';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { TextInput } from '@/components/ui/text-input';
import { receivePurchaseOrderAction } from '@/features/purchasing/actions';

function diagnose(r) {
  if (r.received < r.invoiced) return { k: 'short', tone: 'danger', l: 'Faltou', d: `Nota cobra ${r.invoiced}, chegaram ${r.received}.` };
  if (r.invoiced > r.ordered) return { k: 'over', tone: 'warning', l: 'A mais', d: `Pedido ${r.ordered}, nota ${r.invoiced}.` };
  if (r.nfPrice > r.poPrice + 0.001) return { k: 'price', tone: 'danger', l: 'Preço acima', d: `Pedido a ${brl(r.poPrice)}, cobrado a ${brl(r.nfPrice)}.` };
  return { k: 'ok', tone: 'success', l: 'Confere', d: 'Quantidade e preço batem com o pedido.' };
}

/**
 * @param {{ order?: any, openOrders?: any }} props
 */
export function InvoiceMatch({ order = null, openOrders = null }) {
  const navigate = useNavigate();

  if (!order && !openOrders) {
    return (
      <StoreShell route="/stock/receive/match" breadcrumb={['Estoque', 'Recebimento']} navigate={navigate}>
        <PageHeader title="Conferência da nota" />
        <Page>
          <EmptyState icon={<I.Alert size={18} />} title="Pedido não encontrado" desc="O link é inválido ou o pedido já foi recebido." action={<button onClick={() => navigate('/purchase-orders')} className="btn btn-primary btn-sm">Ver pedidos</button>} />
        </Page>
      </StoreShell>
    );
  }

  if (!order) {
    return (
      <StoreShell route="/stock/receive/match" breadcrumb={['Estoque', 'Recebimento']} navigate={navigate}>
        <PageHeader title="Conferência da nota" sub="Escolha um pedido em aberto pra conferir contra a nota recebida." />
        <Page>
          {openOrders.length === 0 ? (
            <EmptyState icon={<I.Truck size={18} />} title="Nenhum pedido em aberto" desc="Pedidos aguardando recebimento aparecem aqui." action={<button onClick={() => navigate('/purchase-orders')} className="btn btn-primary btn-sm">Ver pedidos</button>} />
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="table">
                <thead><tr><th>Fornecedor</th><th>Unidade</th><th className="num">Itens</th><th>Data</th><th style={{ width: 100 }}></th></tr></thead>
                <tbody>
                  {openOrders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontSize: 13 }}>{o.supplier?.name}</td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{o.store?.name}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{o.purchase_order_items.length}</td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                      <td><button onClick={() => navigate(`/stock/receive/match?id=${o.id}`)} className="btn btn-outline btn-sm">Conferir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Page>
      </StoreShell>
    );
  }

  return <OrderMatch order={order} navigate={navigate} />;
}

function OrderMatch({ order, navigate }) {
  const [invoice, setInvoice] = React.useState(() => Object.fromEntries(
    order.purchase_order_items.map((i) => [i.id, { invoiced: String(i.qty_ordered), received: String(i.qty_ordered), nfPrice: String(i.unit_cost) }]),
  ));
  const [decisions, setDecisions] = React.useState({});
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const setField = (id, field, v) => setInvoice((s) => ({ ...s, [id]: { ...s[id], [field]: v } }));

  const rows = order.purchase_order_items.map((i) => {
    const inv = invoice[i.id];
    const r = {
      id: i.id, product: i.product, ordered: i.qty_ordered, poPrice: i.unit_cost,
      invoiced: parseInt(inv.invoiced, 10) || 0, received: parseInt(inv.received, 10) || 0, nfPrice: parseFloat(inv.nfPrice) || 0,
    };
    return { ...r, ...{ diag: diagnose(r) } };
  });
  const problems = rows.filter((r) => r.diag.k !== 'ok');
  const decided = problems.filter((r) => decisions[r.id]).length;
  const canConfirm = decided === problems.length;

  const rowImpact = (r) => {
    if (r.diag.k === 'price') return (r.nfPrice - r.poPrice) * r.invoiced;
    if (r.diag.k === 'short') return (r.invoiced - r.received) * r.nfPrice;
    if (r.diag.k === 'over') return (r.invoiced - r.ordered) * r.nfPrice;
    return 0;
  };
  const exposure = problems.reduce((s, r) => s + rowImpact(r), 0);
  const nfTotal = rows.reduce((s, r) => s + r.invoiced * r.nfPrice, 0);

  const confirm = () => {
    setError('');
    startTransition(async () => {
      const result = await receivePurchaseOrderAction({
        orderId: order.id,
        items: rows.map((r) => {
          const accepted = decisions[r.id] === 'Aceito como está';
          return { orderItemId: r.id, qtyReceived: r.received, unitCost: accepted ? r.nfPrice : r.poPrice };
        }),
      });
      if (result?.error) { setError(result.error); return; }
      navigate('/purchase-orders');
    });
  };

  return (
    <StoreShell route="/stock/receive/match" breadcrumb={['Estoque', 'Recebimento', 'Conferência da nota']} navigate={navigate}>
      <PageHeader
        title="Conferência da nota"
        sub={`${order.supplier?.name} · ${order.purchase_order_items.length} itens · unidade ${order.store?.name}`}
        actions={<button onClick={() => navigate('/purchase-orders')} className="btn btn-outline btn-sm">Ver pedido</button>}
      />
      <Page>
        {problems.length > 0 && (
          <div className="card" style={{ padding: 18, borderColor: exposure > 0 ? 'var(--danger)' : 'var(--line)' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--danger)', display: 'flex', marginTop: 2 }}><I.Alert size={18} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.015em' }}>
                  {problems.length} de {rows.length} itens não batem com o pedido
                </div>
                {exposure > 0 && (
                  <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.6, maxWidth: 680 }}>
                    A diferença a seu favor é de <strong style={{ color: 'var(--danger)', fontWeight: 600 }}>{brl(exposure)}</strong> nesta
                    nota{nfTotal > 0 ? ` — ${((exposure / nfTotal) * 100).toFixed(1)}% do valor total` : ''}.
                  </p>
                )}
              </div>
              {exposure > 0 && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Diferença</div>
                  <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', color: 'var(--danger)' }}>{brl(exposure)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Item a item</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                Preencha o que a nota física cobra e o que chegou fisicamente. Decida cada divergência antes de dar entrada.
              </p>
            </div>
            {problems.length > 0 && <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{decided}/{problems.length} resolvidos</span>}
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th className="num">Pedido</th><th style={{ width: 80 }}>Nota</th><th style={{ width: 80 }}>Chegou</th>
                <th className="num">Preço pedido</th><th style={{ width: 100 }}>Preço nota</th>
                <th className="num">Impacto</th><th>Situação</th><th style={{ width: 210 }}>Decisão</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const imp = rowImpact(r);
                const dec = decisions[r.id];
                return (
                  <tr key={r.id} style={{ background: r.diag.k !== 'ok' && !dec ? 'var(--danger-soft)' : undefined }}>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.product?.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.product?.sku}</div>
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.ordered}</td>
                    <td><TextInput mono type="number" value={invoice[r.id].invoiced} onChange={(e) => setField(r.id, 'invoiced', e.target.value)} style={{ height: 30 }} /></td>
                    <td><TextInput mono type="number" value={invoice[r.id].received} onChange={(e) => setField(r.id, 'received', e.target.value)} style={{ height: 30 }} /></td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(r.poPrice)}</td>
                    <td><TextInput mono type="number" value={invoice[r.id].nfPrice} onChange={(e) => setField(r.id, 'nfPrice', e.target.value)} style={{ height: 30 }} /></td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: imp > 0 ? 'var(--danger)' : 'var(--fg-soft)' }}>{imp > 0 ? brl(imp) : '—'}</td>
                    <td>
                      <span title={r.diag.d} className={'badge badge-' + (r.diag.tone === 'success' ? 'success' : r.diag.tone === 'danger' ? 'danger' : 'warning')}>{r.diag.l}</span>
                    </td>
                    <td>
                      {r.diag.k === 'ok' ? (
                        <span style={{ fontSize: 11.5, color: 'var(--fg-faint)' }}>Entrada automática</span>
                      ) : dec ? (
                        <span style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <I.Check size={12} stroke={2.4} /> {dec}
                          <button onClick={() => setDecisions((x) => { const y = { ...x }; delete y[r.id]; return y; })} className="btn btn-ghost btn-sm">Desfazer</button>
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => setDecisions((d) => ({ ...d, [r.id]: 'Contestado' }))} className="btn btn-outline btn-sm">Contestar</button>
                          <button onClick={() => setDecisions((d) => ({ ...d, [r.id]: 'Aceito como está' }))} className="btn btn-ghost btn-sm">Aceitar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {error && (
            <div style={{ margin: '0 18px 12px', padding: '9px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>
          )}
          <div style={{ padding: '12px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
              O que for contestado entra no estoque pelo preço do pedido. O que for aceito vira o novo custo.
            </span>
            <button onClick={confirm} className="btn btn-primary btn-sm" disabled={!canConfirm || pending}
              style={{ opacity: canConfirm && !pending ? 1 : 0.5 }}>
              {pending ? 'Confirmando…' : 'Dar entrada'}
            </button>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
