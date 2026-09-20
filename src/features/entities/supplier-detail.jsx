"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { CATALOG } from '@/lib/catalog';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { CategoryBadge } from '@/components/ui/category-badge';
import { brl } from '@/lib/format';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';

export function SupplierDetail() {
  const navigate = useNavigate();
  const purchases = [
    { date: '18/09', nf: 'NF 8420', cat: 'eletronicos', items: 48, value: 7584.00, status: 'received' },
    { date: '02/09', nf: 'NF 8318', cat: 'eletronicos', items: 120, value: 18960.00, status: 'received' },
    { date: '19/08', nf: 'NF 8204', cat: 'eletronicos', items: 96, value: 15168.00, status: 'received' },
    { date: '04/08', nf: 'NF 8102', cat: 'eletronicos', items: 144, value: 22752.00, status: 'received' },
    { date: '21/07', nf: 'NF 7988', cat: 'eletronicos', items: 72, value: 11376.00, status: 'received' },
    { date: '22/09', nf: 'PED 412', cat: 'eletronicos', items: 96, value: 15168.00, status: 'pending' },
  ];
  const skus = CATALOG.filter(p => p.supplier === 'TechDistrib');

  return (
    <StoreShell route="/suppliers/detail" breadcrumb={['Fornecedores', 'TechDistrib']} navigate={navigate}>
      <PageHeader
        title="TechDistrib"
        sub="Eletrônicos · CNPJ 12.345.678/0001-90 · fornecedor desde fev 2025"
        actions={(
          <>
            <button className="btn btn-outline btn-sm">Desativar</button>
            <button onClick={() => navigate('/suppliers/edit')} className="btn btn-outline btn-sm">Editar</button>
            <button onClick={() => navigate('/stock/entry')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova entrada</button>
          </>
        )}
        tabs={[{ id: 'o', label: 'Visão geral' }, { id: 'p', label: 'Compras · 24' }, { id: 's', label: `SKUs · ${skus.length}` }, { id: 'q', label: 'Qualidade' }]}
        activeTab="o"
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Comprado em 12m', v: 'R$ 186.400' },
            { l: 'SKUs vinculados', v: '186' },
            { l: 'Prazo médio', v: '8 dias', s: 'prometido: 8' },
            { l: 'Pontualidade', v: '96%', s: '23 de 24 no prazo', tone: 'up' },
            { l: 'Devoluções', v: '1,2%', s: 'por defeito', tone: 'up' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 4 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              {m.s && <div style={{ fontSize: 10, color: m.tone === 'up' ? 'var(--success)' : 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16, alignItems: 'start' }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Cadastro</h3>
            </div>
            {[
              ['Razão social', 'TechDistrib Comércio de Eletrônicos Ltda.'],
              ['CNPJ', '12.345.678/0001-90', true],
              ['Telefone', '(11) 4002-1100', true],
              ['Email', 'pedidos@techdistrib.com.br'],
              ['Representante', 'Sérgio Almeida'],
              ['Categorias', 'Eletrônicos'],
              ['Marcas', 'Foneclear, Voltway'],
              ['Pedido mínimo', 'R$ 5.000,00', true],
              ['Pagamento', '30/60 dias'],
            ].map(([k, v, mono], i, arr) => (
              <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 104, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 500, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Últimas compras</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>24 notas nos últimos 12 meses.</p>
                </div>
                <button className="btn btn-ghost btn-sm">Ver todas <I.ChevronRight size={12} /></button>
              </div>
              <table className="table">
                <thead>
                  <tr><th>Data</th><th>Documento</th><th>Categoria</th><th className="num">Itens</th><th className="num">Valor</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.nf}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{p.date}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{p.nf}</td>
                      <td><CategoryBadge cat={p.cat} /></td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.items}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(p.value)}</td>
                      <td>
                        {p.status === 'received'
                          ? <span className="badge badge-success"><I.Check size={10} stroke={3} /> Recebida</span>
                          : <span className="badge badge-info">Pedido aberto</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>SKUs deste fornecedor</h3>
              </div>
              <table className="table">
                <thead>
                  <tr><th>SKU</th><th>Produto</th><th>Variação</th><th className="num">Saldo</th><th className="num">Custo</th></tr>
                </thead>
                <tbody>
                  {skus.map(p => (
                    <tr key={p.sku}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{p.sku}</td>
                      <td style={{ fontSize: 13 }}>{p.name}</td>
                      <td><AttrChip value={variantLabel(p.attrs)} /></td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.stock}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(p.sale * 0.53)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--fg-muted)' }}>
                Mostrando {skus.length} de 186 SKUs
              </div>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /promotions/new · /promotions/edit ===
