"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Toolbar } from '@/components/ui/toolbar';
import { MOVEMENT_TYPES } from '@/lib/movement-types';
import { CategoryBadge } from '@/components/ui/category-badge';
import { brl } from '@/lib/format';

export function StockHistory() {
  const navigate = useNavigate();
  const movements = [
    { date: '18/09 14:38', type: 'sale', cat: 'eletronicos', sku: 'ELE-FONE-PR-128', desc: 'Fone Bluetooth ANC · Preto · 128 GB', qty: -1, price: 299.00, discount: 0, total: 299.00, user: 'Lucas', ref: '#4286' },
    { date: '18/09 14:24', type: 'sale', cat: 'alimentos', sku: 'ALI-CAFE-IN-1KG', desc: 'Café em Grãos · Intenso · 1 kg', qty: -3, price: 60.00, discount: 0, total: 180.00, user: 'Lucas', ref: '#4285' },
    { date: '18/09 13:50', type: 'entry', cat: 'vestuario', sku: 'VES-CPIM-BR-M', desc: 'Camiseta Algodão Pima · Branco · M', qty: 120, price: 36.00, discount: 0, total: 4320.00, user: 'Ana', ref: 'NF 8421' },
    { date: '18/09 11:12', type: 'return', cat: 'calcados', sku: 'CAL-ESP3-PR-40', desc: 'Tênis Esporte 3 · Preto · 40', qty: 1, price: 279.90, discount: 0, total: 279.90, user: 'Lucas', ref: '#4281' },
    { date: '18/09 10:45', type: 'transfer', cat: 'casa', sku: 'CAS-TOAL-BE-ALG', desc: 'Jogo de Toalhas · Bege → Loja Campinas', qty: -24, price: 0, discount: 0, total: 0, user: 'Ana', ref: 'TRF-124' },
    { date: '18/09 10:18', type: 'exchange', cat: 'vestuario', sku: 'VES-CPIM-BR-M→G', desc: 'Camiseta Algodão Pima · Branco · M → G', qty: 0, price: 89.00, discount: 0, total: 0, user: 'Lucas', ref: '#4283' },
    { date: '18/09 09:32', type: 'sale', cat: 'papelaria', sku: 'PAP-CAD2-PR-A4', desc: 'Caderno Pautado 200f · Preto · A4', qty: -12, price: 34.00, discount: 0, total: 408.00, user: 'Marina', ref: '#4282' },
    { date: '18/09 09:05', type: 'entry', cat: 'eletronicos', sku: 'ELE-FONE-PR-128', desc: 'Fone Bluetooth ANC · Preto · 128 GB', qty: 48, price: 158.00, discount: 0, total: 7584.00, user: 'Ana', ref: 'NF 8420' },
    { date: '17/09 18:14', type: 'adjustment', cat: 'eletronicos', sku: 'ELE-FONE-PR-128', desc: 'Ajuste inventário · Fone Bluetooth ANC · Preto', qty: -2, price: 0, discount: 0, total: 0, user: 'Ana', ref: 'INV-05' },
    { date: '17/09 16:30', type: 'sale', cat: 'casa', sku: 'CAS-VASO-VE-CER', desc: 'Vaso Decorativo · Verde · Cerâmica', qty: -2, price: 129.00, discount: 5, total: 245.10, user: 'Lucas', ref: '#4278' },
    { date: '17/09 15:22', type: 'sale', cat: 'calcados', sku: 'CAL-BOTA-MR-40', desc: 'Bota Couro Trilha · Marrom · 40', qty: -1, price: 459.00, discount: 0, total: 459.00, user: 'Marina', ref: '#4277' },
    { date: '17/09 14:08', type: 'transfer', cat: 'eletronicos', sku: 'ELE-CARR-PR-65W', desc: 'Carregador GaN 65W · Preto ← CD Guarulhos', qty: 36, price: 0, discount: 0, total: 0, user: 'Ana', ref: 'TRF-121' },
    { date: '17/09 11:45', type: 'sale', cat: 'vestuario', sku: 'VES-MOLE-CZ-G', desc: 'Moletom Flanelado · Cinza · G', qty: -4, price: 189.00, discount: 10, total: 680.40, user: 'Marina', ref: '#4274' },
  ];

  return (
    <StoreShell route="/stock/history" breadcrumb={['Estoque', 'Histórico']} navigate={navigate}>
      <PageHeader
        title="Movimentações"
        sub="Tudo que entrou, saiu ou mudou de loja · 1.142 registros nos últimos 30 dias"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar</button>
            <button onClick={() => navigate('/stock/sale')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Nova movimentação <I.ChevronDown size={11} /></button>
          </>
        )}
        tabs={[
          { id: 'all', label: 'Todas · 1.142' },
          { id: 'sale', label: 'Vendas · 892' },
          { id: 'entry', label: 'Entradas · 86' },
          { id: 'transfer', label: 'Transferências · 64' },
          { id: 'return', label: 'Devoluções · 38' },
          { id: 'exchange', label: 'Trocas · 41' },
          { id: 'adjustment', label: 'Ajustes · 21' },
        ]}
        activeTab="all"
      />

      <Page>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
          background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden',
        }}>
          {[
            { l: 'Saídas (unidades)', v: '4.286', s: 'setembro' },
            { l: 'Entradas (unidades)', v: '+2.418', s: 'setembro' },
            { l: 'Receita bruta', v: 'R$ 412.680', s: 'antes de descontos' },
            { l: 'Descontos aplicados', v: 'R$ 24.760', s: '6,0% médio' },
            { l: 'Transferidos na rede', v: '648', s: '64 transferências' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 4 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{s.l}</div>
              <div style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', marginTop: 4 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 2 }}>{s.s}</div>
            </div>
          ))}
        </div>

        <Toolbar
          placeholder="Buscar por SKU, ref. ou produto…"
          filters={[
            { label: 'Período', value: 'Últimos 30 dias' },
            { label: 'Categoria', value: 'Todas' },
            { label: 'Unidade', value: 'Loja Centro' },
            { label: 'Usuário', value: 'Todos' },
          ]}
          right={<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>13 de 1.142</span>}
        />

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>Data/hora</th>
                <th style={{ width: 130 }}>Tipo</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Ref.</th>
                <th className="num">Qtd</th>
                <th className="num">Preço un.</th>
                <th className="num">Desc.</th>
                <th className="num">Total</th>
                <th>Por</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m, i) => {
                const t = MOVEMENT_TYPES[m.type];
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{m.date}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '2px 7px', borderRadius: 4,
                        background: t.soft, color: t.color, fontSize: 11, fontWeight: 500,
                      }}>{t.icon} {t.label}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13 }}>{m.desc}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-muted)' }}>{m.sku}</span>
                      </div>
                    </td>
                    <td><CategoryBadge cat={m.cat} /></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{m.ref}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: m.qty > 0 ? 'var(--success)' : m.qty < 0 ? 'var(--fg)' : 'var(--fg-muted)' }}>
                      {m.qty > 0 ? '+' : ''}{m.qty || '—'}
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: m.price ? 'var(--fg)' : 'var(--fg-muted)' }}>
                      {m.price ? brl(m.price) : '—'}
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: m.discount ? 'var(--warning)' : 'var(--fg-muted)' }}>
                      {m.discount ? `-${m.discount}%` : '—'}
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>
                      {m.total ? brl(m.total) : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.user}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Page>
    </StoreShell>
  );
}

// === Sales report ===
