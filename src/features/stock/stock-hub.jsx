"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { MOCK } from '@/lib/mock';
import { I } from '@/components/icons';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { HubCard } from '@/components/domain/hub-card';

export function StockHub() {
  const navigate = useNavigate();
  const totalItems = MOCK.categories.reduce((s, c) => s + c.stock, 0);
  const maxStock = Math.max(...MOCK.categories.map(c => c.stock));

  const flows = [
    { r: '/stock/entry', i: <I.ArrowUp size={15} />, t: 'Entrada', d: 'Compra recebida do fornecedor', n: '86 este mês' },
    { r: '/stock/sale', i: <I.ArrowDown size={15} />, t: 'Venda', d: 'Saída no balcão, com desconto', n: '892 este mês' },
    { r: '/stock/transfer', i: <I.Swap size={15} />, t: 'Transferência', d: 'Entre unidades da rede', n: '64 este mês' },
    { r: '/stock/exchange', i: <I.ArrowRight size={15} />, t: 'Troca', d: 'Devolve um item, entrega outro', n: '41 este mês' },
    { r: '/stock/return', i: <I.ArrowUp size={15} />, t: 'Devolução', d: 'Item volta ao estoque ou à avaria', n: '38 este mês' },
    { r: '/stock/adjustment', i: <I.Activity size={15} />, t: 'Ajuste de inventário', d: 'Alinha sistema com contagem física', n: '21 este mês' },
  ];

  return (
    <StoreShell route="/stock" breadcrumb={['Estoque']} navigate={navigate}>
      <PageHeader
        title="Estoque"
        sub={`${totalItems.toLocaleString('pt-BR')} itens nesta unidade · 1.688 SKUs em 6 categorias`}
        actions={(
          <>
            <button onClick={() => navigate('/stock/history')} className="btn btn-outline btn-sm"><I.Activity size={13} /> Histórico</button>
            <button onClick={() => navigate('/stock/entry')} className="btn btn-outline btn-sm"><I.Plus size={13} /> Entrada</button>
            <button onClick={() => navigate('/stock/sale')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova venda</button>
          </>
        )}
      />
      <Page gap={20}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Itens em estoque', v: totalItems.toLocaleString('pt-BR'), s: 'nesta unidade' },
            { l: 'Valor de custo', v: 'R$ 1,84 M', s: 'a preço de entrada' },
            { l: 'SKUs em ruptura', v: '7', s: 'saldo zerado', tone: 'danger' },
            { l: 'SKUs em alerta', v: '24', s: 'abaixo do mínimo', tone: 'warning' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{
                fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4,
                color: m.tone === 'danger' ? 'var(--danger)' : m.tone === 'warning' ? 'var(--warning)' : 'var(--fg)',
              }}>{m.v}</div>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="section-h"><h3>Registrar movimentação</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {flows.map(f => (
              <HubCard key={f.r} icon={f.i} title={f.t} desc={f.d} accent onClick={() => navigate(f.r)} meta={[['Volume', f.n.split(' ')[0]]]} />
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Saldo por categoria</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Cada categoria conta na sua própria unidade de medida.</p>
              </div>
              <button onClick={() => navigate('/categories')} className="btn btn-ghost btn-sm">Categorias <I.ChevronRight size={12} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MOCK.categories.map(c => {
                const Ico = I[c.icon] || I.Box;
                return (
                  <div key={c.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                      <span style={{ color: c.cssInk, display: 'flex' }}><Ico size={13} /></span>
                      <span style={{ fontSize: 12, flex: 1 }}>{c.name}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{c.skus} SKUs</span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 96, textAlign: 'right' }}>
                        {c.stock.toLocaleString('pt-BR')} {c.unitPlural}
                      </span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                      <div style={{ width: `${(c.stock / maxStock) * 100}%`, height: '100%', background: c.cssVar, borderRadius: 3 }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                Precisa de atenção
                <span className="badge badge-warning"><I.Alert size={10} /> 31</span>
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Ruptura e alerta de reposição.</p>
            </div>
            {[
              { sku: 'CAL-ESP3-PR-38', name: 'Tênis Esporte 3', variant: 'Preto · 38', qty: 1, cat: 'calcados' },
              { sku: 'ELE-FONE-PR-128', name: 'Fone Bluetooth ANC', variant: 'Preto · 128 GB', qty: 2, cat: 'eletronicos' },
              { sku: 'ALI-CAFE-IN-5KG', name: 'Café em Grãos', variant: 'Intenso · 5 kg', qty: 2, cat: 'alimentos' },
              { sku: 'VES-CPIM-BR-GG', name: 'Camiseta Algodão Pima', variant: 'Branco · GG', qty: 3, cat: 'vestuario' },
              { sku: 'CAS-VASO-VE-CER', name: 'Vaso Decorativo', variant: 'Verde · Cerâmica', qty: 0, cat: 'casa' },
            ].map((p, i, arr) => (
              <div key={p.sku} style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '11px 18px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 5, flexShrink: 0,
                  background: p.qty === 0 ? 'var(--danger-soft)' : 'var(--warning-soft)',
                  color: p.qty === 0 ? 'var(--danger)' : 'var(--warning)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 12,
                }}>{p.qty}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }} className="truncate">{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{p.sku}</div>
                </div>
                <button onClick={() => navigate('/stock/entry')} className="btn btn-outline btn-sm">Repor</button>
              </div>
            ))}
            <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>+26 outros itens</span>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/products'); }} style={{ fontSize: 11, color: 'var(--accent-text)', fontWeight: 500 }}>Ver no catálogo →</a>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /reports — relatórios index ===
