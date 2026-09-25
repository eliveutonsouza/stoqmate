"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { useQueryUpdate } from '@/hooks/use-query-update';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Toolbar } from '@/components/ui/toolbar';
import { Pagination } from '@/components/ui/pagination';
import { CategoryBadge } from '@/components/ui/category-badge';
import { ProductThumb } from '@/components/ui/product-thumb';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { EmptyState } from '@/components/ui/empty-state';
import { brl } from '@/lib/format';
import { RowMenu } from '@/components/ui/row-menu';
import { duplicateProductAction, setProductActiveAction } from '@/features/products/actions';

const STOCK_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'in', label: 'Em estoque' },
  { value: 'low', label: 'Abaixo do mínimo' },
  { value: 'out', label: 'Zerado' },
];

// Busca, filtros e página moram na URL (?q ?category ?brand ?stock
// ?location ?page) — o servidor filtra e pagina (fn_products_list).
export function ProductsList({ filters, pageSize, rows, total, catalogTotal, countByCategory, brands, categories, locations }) {
  const navigate = useNavigate();
  const { update, pending } = useQueryUpdate();
  const [selected, setSelected] = React.useState(() => new Set());
  const [error, setError] = React.useState('');
  const [, startTransition] = React.useTransition();

  const runAction = (fn) => {
    setError('');
    startTransition(async () => {
      const result = await fn();
      if (result?.error) setError(result.error);
    });
  };
  const rowItems = (p) => [
    { label: 'Ver detalhe', onSelect: () => navigate(`/products/detail?id=${p.id}`) },
    { label: 'Editar', onSelect: () => navigate(`/products/edit?id=${p.id}`) },
    {
      label: 'Duplicar',
      onSelect: () => runAction(async () => {
        const result = await duplicateProductAction(p.id);
        if (result?.id) navigate(`/products/edit?id=${result.id}`);
        return result;
      }),
    },
    p.active
      ? { label: 'Desativar', tone: 'danger', onSelect: () => runAction(() => setProductActiveAction({ id: p.id, active: false })) }
      : { label: 'Reativar', onSelect: () => runAction(() => setProductActiveAction({ id: p.id, active: true })) },
  ];

  const activeCat = filters.category ? categories.find((c) => c.id === filters.category) ?? null : null;
  const activeLocation = filters.location ? locations.find((l) => l.id === filters.location) ?? null : null;
  const hasFilters = !!(filters.q || filters.category || filters.brand || filters.stock || filters.location);
  const selectedCount = rows.filter((p) => selected.has(p.id)).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  const toggleOne = (id) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const toolbarFilters = [
    ...(brands.length > 0 ? [{
      label: 'Marca', value: filters.brand ?? 'Todas', active: !!filters.brand,
      selected: filters.brand ?? '',
      options: [{ value: '', label: 'Todas' }, ...brands.map((b) => ({ value: b, label: b }))],
      onChange: (v) => update({ brand: v || null }),
    }] : []),
    ...(locations.length > 0 ? [{
      label: 'Local', value: activeLocation?.code ?? 'Todos', active: !!filters.location,
      selected: filters.location ?? '',
      options: [
        { value: '', label: 'Todos' },
        ...locations.map((l) => ({ value: l.id, label: l.store ? `${l.code} · ${l.store}` : l.code })),
      ],
      onChange: (v) => update({ location: v || null }),
    }] : []),
    {
      label: 'Estoque', value: STOCK_OPTIONS.find((o) => o.value === (filters.stock ?? ''))?.label ?? 'Todos',
      active: !!filters.stock, selected: filters.stock ?? '', options: STOCK_OPTIONS,
      onChange: (v) => update({ stock: v || null }),
    },
  ];

  const clearFilters = () => update({ q: null, category: null, brand: null, stock: null, location: null });

  return (
    <StoreShell route="/products" breadcrumb={['Catálogo', 'Produtos']} navigate={navigate}>
      <PageHeader
        title="Catálogo"
        sub={`${catalogTotal} SKU${catalogTotal === 1 ? '' : 's'} · ${categories.length} categoria${categories.length === 1 ? '' : 's'}`}
        actions={(
          <>
            <button onClick={() => navigate('/categories')} className="btn btn-outline btn-sm"><I.Sliders size={13} /> Categorias</button>
            <button onClick={() => navigate('/products/import')} className="btn btn-outline btn-sm"><I.Download size={13} /> Importar planilha</button>
            <button onClick={() => navigate('/products/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Cadastrar produto</button>
          </>
        )}
        tabs={[
          { id: 'all', label: `Todas · ${catalogTotal}` },
          ...categories.map((c) => ({ id: c.id, label: `${c.name} · ${countByCategory[c.id] ?? 0}` })),
        ]}
        activeTab={filters.category ?? 'all'}
        onTab={(id) => { setSelected(new Set()); update({ category: id === 'all' ? null : id }); }}
      />

      <Page>
        {catalogTotal === 0 ? (
          <EmptyState
            icon={<I.Box size={18} />}
            title="Nenhum produto cadastrado ainda"
            desc={categories.length === 0
              ? 'Crie uma categoria primeiro — ela define os atributos do produto e a unidade de medida do estoque.'
              : 'Cadastre o primeiro SKU pra começar a controlar o estoque.'}
            action={categories.length === 0
              ? <button onClick={() => navigate('/categories')} className="btn btn-primary btn-sm">Criar categoria</button>
              : <button onClick={() => navigate('/products/new')} className="btn btn-primary btn-sm"><I.Plus size={12} /> Cadastrar produto</button>}
          />
        ) : (
          <>
            <Toolbar
              placeholder="Buscar por SKU, código de barras, marca ou nome…"
              value={filters.q ?? ''}
              onChange={(q) => update({ q })}
              debounce={300}
              filters={toolbarFilters}
              right={(
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--fg-muted)' }}>
                  {hasFilters && <button type="button" onClick={clearFilters} className="btn btn-ghost btn-sm">Limpar filtros</button>}
                  {selectedCount > 0 ? `${selectedCount} selecionado(s)` : `${total} de ${catalogTotal}`}
                </span>
              )}
            />

            {activeCat && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap',
                padding: '10px 14px', background: 'var(--bg-sunken)',
                border: '1px solid var(--line)', borderRadius: 8, fontSize: 12,
              }}>
                <CategoryBadge category={activeCat} />
                <span style={{ color: 'var(--fg-muted)' }}>unidade de medida: <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{activeCat.unit}</strong></span>
                <div style={{ flex: 1 }}></div>
                <button onClick={() => navigate('/categories')} className="btn btn-ghost btn-sm">Editar esquema</button>
              </div>
            )}

            {error && <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>}

            <div className="card" style={{ opacity: pending ? 0.6 : 1, transition: 'opacity .15s' }}>
              {rows.length === 0 ? (
                <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Nenhum produto encontrado</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>
                    {total > 0 ? 'Esta página não existe mais — volte para a primeira.' : 'Nenhum SKU bate com a busca e os filtros atuais.'}
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {total > 0
                      ? <button type="button" onClick={() => update({ page: null })} className="btn btn-outline btn-sm">Primeira página</button>
                      : hasFilters && <button type="button" onClick={clearFilters} className="btn btn-outline btn-sm">Limpar filtros</button>}
                  </div>
                </div>
              ) : (
                <div className="table-scroll">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>
                          <input type="checkbox" aria-label="Selecionar todos da página" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((p) => p.id)))} />
                        </th>
                        <th>Produto</th>
                        <th>SKU</th>
                        {!activeCat && <th>Categoria</th>}
                        <th>Variação</th>
                        <th>Local</th>
                        <th>Fornecedor</th>
                        <th className="num">Estoque</th>
                        <th className="num">Preço</th>
                        <th style={{ width: 30 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => (
                        <tr key={p.id} style={{ background: selected.has(p.id) ? 'var(--accent-soft)' : undefined, opacity: p.active ? 1 : 0.55 }}>
                          <td>
                            <input type="checkbox" aria-label={`Selecionar ${p.name}`} checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <ProductThumb category={p.category} brand={p.brand} attrs={p.attrs} size={28} />
                              <div>
                                <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/products/detail?id=${p.id}`); }} style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</a>
                                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{p.brand}{!p.active && ' · inativo'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{p.sku}</td>
                          {!activeCat && <td>{p.category && <CategoryBadge category={p.category} />}</td>}
                          <td><AttrChip value={variantLabel(p.attrs || {})} /></td>
                          <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{p.location?.code ?? '—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{p.supplier?.name ?? '—'}</td>
                          <td className="num">
                            <span style={{
                              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
                              color: p.stock < p.min_stock ? 'var(--danger)' : p.stock < p.min_stock * 2 ? 'var(--warning)' : 'var(--fg)',
                            }}>{p.stock}</span>
                            <span style={{ fontSize: 10, color: 'var(--fg-muted)', marginLeft: 4 }}>{p.category?.unit}</span>
                          </td>
                          <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(p.sale_price)}</td>
                          <td><RowMenu label={`Ações de ${p.name}`} items={rowItems(p)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Pagination
                page={filters.page} pageSize={pageSize} total={total} pending={pending}
                onPage={(page) => { setSelected(new Set()); update({ page }); }}
              />
            </div>
          </>
        )}
      </Page>
    </StoreShell>
  );
}
