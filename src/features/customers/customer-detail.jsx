"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { CUSTOMERS } from '@/features/customers/customers';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { ProductThumb } from '@/components/ui/product-thumb';
import { CategoryBadge } from '@/components/ui/category-badge';

export function CustomerDetail() {
  const navigate = useNavigate();
  const c = CUSTOMERS[2];
  const buys = [
    { ref: '#4241', date: '12 set', items: 2, value: 388.00, unit: 'Loja Centro' },
    { ref: '#4102', date: '28 ago', items: 1, value: 299.00, unit: 'Loja Centro' },
    { ref: '#3988', date: '14 ago', items: 4, value: 612.00, unit: 'Shopping Norte' },
    { ref: '#3844', date: '02 ago', items: 1, value: 189.00, unit: 'Loja Centro' },
    { ref: '#3702', date: '19 jul', items: 3, value: 447.00, unit: 'Loja Centro' },
  ];
  const credit = [
    { date: '12 set', kind: 'in', label: 'Devolução #4241 · crédito em loja', value: 299.00 },
    { date: '12 set', kind: 'out', label: 'Usado na venda #4242', value: -110.00 },
  ];

  return (
    <StoreShell route="/customers/detail" breadcrumb={['Clientes', c.name]} navigate={navigate}>
      <PageHeader
        title={c.name}
        sub={`CPF ${c.doc} · cliente desde ${c.since} · ${c.buys} compras`}
        actions={(
          <>
            <button className="btn btn-outline btn-sm">Editar</button>
            <button onClick={() => navigate('/stock/return')} className="btn btn-outline btn-sm">Registrar devolução</button>
            <button onClick={() => navigate('/pos')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova venda</button>
          </>
        )}
        tabs={[{ id: 'o', label: 'Visão geral' }, { id: 'c', label: `Compras · ${c.buys}` }, { id: 'k', label: 'Crédito em loja' }]}
        activeTab="o"
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Total gasto', v: brl(c.spent) },
            { l: 'Ticket médio', v: brl(c.spent / c.buys) },
            { l: 'Compras', v: `${c.buys}`, s: 'última em ' + c.last },
            { l: 'Crédito disponível', v: brl(c.credit), tone: 'warn' },
            { l: 'Devoluções', v: '1', s: '11% das compras' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 4 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{
                fontSize: 19, fontWeight: 600, letterSpacing: '-0.022em', fontVariantNumeric: 'tabular-nums', marginTop: 4,
                color: m.tone === 'warn' ? 'var(--warning)' : 'var(--fg)',
              }}>{m.v}</div>
              {m.s && <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>}
            </div>
          ))}
        </div>

        {c.credit > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', background: 'var(--warning-soft)',
            border: '1px solid var(--warning)', borderRadius: 8,
          }}>
            <span style={{ color: 'var(--warning)', flexShrink: 0 }}><I.Credit size={15} /></span>
            <span style={{ fontSize: 12.5, color: 'var(--fg)', flex: 1, lineHeight: 1.5 }}>
              Este cliente tem <strong>{brl(c.credit)}</strong> de crédito em loja, de uma devolução em 12 set.
              O saldo aparece automaticamente como forma de pagamento no balcão.
            </span>
            <button onClick={() => navigate('/pos')} className="btn btn-outline btn-sm">Usar numa venda</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Cadastro</h3>
              </div>
              {[
                ['CPF', c.doc, true], ['Telefone', c.phone, true],
                ['Email', 'eduardo.lacerda@email.com'], ['Perfil', c.tier],
                ['Cliente desde', c.since], ['Unidade preferida', 'Loja Centro'],
                ['Aceita promoções', 'Sim, por email'],
              ].map(([k, v, mono], i, arr) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 118, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Extrato de crédito</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Sem prazo de validade.</p>
              </div>
              {credit.map((k, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 18px', borderBottom: '1px solid var(--line-soft)' }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: k.kind === 'in' ? 'var(--success-soft)' : 'var(--bg-sunken)',
                    color: k.kind === 'in' ? 'var(--success)' : 'var(--fg-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{k.kind === 'in' ? <I.ArrowUp size={12} /> : <I.ArrowDown size={12} />}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5 }}>{k.label}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{k.date}</div>
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: k.value < 0 ? 'var(--fg-muted)' : 'var(--success)' }}>
                    {k.value < 0 ? '− ' : '+ '}{brl(Math.abs(k.value))}
                  </span>
                </div>
              ))}
              <div style={{ padding: '11px 18px', background: 'var(--bg-sunken)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>Saldo</span>
                <span style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{brl(c.credit)}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Histórico de compras</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Permite troca sem cupom — a compra está no sistema.</p>
                </div>
              </div>
              <table className="table">
                <thead>
                  <tr><th>Venda</th><th>Data</th><th>Unidade</th><th className="num">Itens</th><th className="num">Valor</th><th style={{ width: 80 }}></th></tr>
                </thead>
                <tbody>
                  {buys.map(b => (
                    <tr key={b.ref}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{b.ref}</td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{b.date}</td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{b.unit}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{b.items}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(b.value)}</td>
                      <td><button onClick={() => navigate('/stock/movement')} className="btn btn-ghost btn-sm">Abrir</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>O que costuma comprar</h3>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--fg-muted)' }}>Base para avisar de reposição e promoção.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { cat: 'eletronicos', name: 'Fone Bluetooth ANC', n: 3 },
                  { cat: 'papelaria', name: 'Caderno Pautado 200f', n: 2 },
                  { cat: 'alimentos', name: 'Café em Grãos', n: 2 },
                  { cat: 'vestuario', name: 'Camiseta Algodão Pima', n: 1 },
                ].map(p => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ProductThumb cat={p.cat} attrs={{}} size={26} />
                    <span style={{ fontSize: 12.5, flex: 1 }}>{p.name}</span>
                    <CategoryBadge cat={p.cat} />
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 44, textAlign: 'right' }}>
                      {p.n}× comprado
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /first-run — the app with nothing in it yet ===
