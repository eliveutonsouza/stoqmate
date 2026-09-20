"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { CATALOG } from '@/lib/catalog';
import { MOCK, catById } from '@/lib/mock';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Toolbar } from '@/components/ui/toolbar';
import { CategoryBadge } from '@/components/ui/category-badge';
import { ProductThumb } from '@/components/ui/product-thumb';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { brl } from '@/lib/format';

export function ProductsList() {
  const navigate = useNavigate();
  const [cat, setCat] = React.useState('all');
  const [selected, setSelected] = React.useState(new Set());

  const rows = cat === 'all' ? CATALOG : CATALOG.filter(p => p.cat === cat);
  const allSelected = selected.size > 0 && selected.size === rows.length;
  const activeCat = cat === 'all' ? null : catById(cat);

  // The attribute columns follow the selected category's schema; with mixed
  // categories there is no shared schema, so collapse to one "Variação" column.
  const attrCols = activeCat ? activeCat.attributes : null;

  return (
    <StoreShell route="/products" breadcrumb={['Catálogo', 'Produtos']} navigate={navigate}>
      <PageHeader
        title="Catálogo"
        sub="1.688 SKUs ativos · 6 categorias · 142 marcas"
        actions={(
          <>
            <button onClick={() => navigate('/categories')} className="btn btn-outline btn-sm"><I.Sliders size={13} /> Categorias</button>
            <button onClick={() => navigate('/products/import')} className="btn btn-outline btn-sm"><I.Download size={13} /> Importar planilha</button>
            <button onClick={() => navigate('/products/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Cadastrar produto</button>
          </>
        )}
        tabs={[
          { id: 'all', label: `Todas · ${CATALOG.length}` },
          ...MOCK.categories.map(c => ({ id: c.id, label: `${c.name} · ${CATALOG.filter(p => p.cat === c.id).length}` })),
        ]}
        activeTab={cat}
        onTab={(id) => { setCat(id); setSelected(new Set()); }}
      />

      <Page>
        <Toolbar
          placeholder="Buscar por SKU, código de barras, marca ou nome…"
          filters={[
            { label: 'Marca', value: 'Todas' },
            ...(attrCols ? attrCols.map(a => ({ label: a.label, value: 'Todos' })) : [{ label: 'Variação', value: 'Todas' }]),
            { label: 'Local', value: 'Todos' },
            { label: 'Estoque', value: '≥ 1' },
          ]}
          right={<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{selected.size > 0 ? `${selected.size} selecionado(s)` : `${rows.length} itens`}</span>}
        />

        {activeCat && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 11,
            padding: '10px 14px', background: 'var(--bg-sunken)',
            border: '1px solid var(--line)', borderRadius: 8, fontSize: 12,
          }}>
            <CategoryBadge cat={activeCat.id} />
            <span style={{ color: 'var(--fg-muted)' }}>
              Atributos desta categoria: <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{activeCat.attributes.map(a => a.label).join(' · ')}</strong>
              {' '}· unidade de medida: <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{activeCat.unit}</strong>
            </span>
            <div style={{ flex: 1 }}></div>
            <button onClick={() => navigate('/categories')} className="btn btn-ghost btn-sm">Editar esquema</button>
          </div>
        )}

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((_, i) => i)))} />
                </th>
                <th>Produto</th>
                <th>SKU</th>
                {!activeCat && <th>Categoria</th>}
                {attrCols ? attrCols.map(a => <th key={a.key}>{a.label}</th>) : <th>Variação</th>}
                <th>Local</th>
                <th>Fornecedor</th>
                <th className="num">Estoque</th>
                <th className="num">Preço</th>
                <th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => {
                const c = catById(p.cat);
                return (
                  <tr key={p.sku} style={{ background: selected.has(i) ? 'var(--accent-soft)' : undefined }}>
                    <td>
                      <input type="checkbox" checked={selected.has(i)} onChange={() => {
                        const n = new Set(selected); n.has(i) ? n.delete(i) : n.add(i); setSelected(n);
                      }} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ProductThumb cat={p.cat} brand={p.brand} attrs={p.attrs} size={28} />
                        <div>
                          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/products/detail'); }} style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</a>
                          <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{p.sku}</td>
                    {!activeCat && <td><CategoryBadge cat={p.cat} /></td>}
                    {attrCols
                      ? attrCols.map(a => <td key={a.key}><AttrChip value={p.attrs[a.key]} /></td>)
                      : <td><AttrChip value={variantLabel(p.attrs)} /></td>}
                    <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{p.loc}</td>
                    <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{p.supplier}</td>
                    <td className="num">
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                        color: p.stock < 5 ? 'var(--danger)' : p.stock < 25 ? 'var(--warning)' : 'var(--fg)',
                      }}>{p.stock}</span>
                      <span style={{ fontSize: 10, color: 'var(--fg-muted)', marginLeft: 4 }}>{c.unit === 'unidade' ? 'un' : c.unit}</span>
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(p.sale)}</td>
                    <td><button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-sunken)' }}>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Mostrando 1–{rows.length} de {cat === 'all' ? '1.688' : catById(cat).skus}</span>
            <div style={{ flex: 1 }}></div>
            <button className="btn btn-ghost btn-sm" disabled><I.ChevronLeft size={12} /> Anterior</button>
            <button className="btn btn-ghost btn-sm">Próxima <I.ChevronRight size={12} /></button>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
