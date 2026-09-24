"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { Toolbar } from '@/components/ui/toolbar';
import { StoreAvatar } from '@/components/domain/store-avatar';
import { CategoryBadge } from '@/components/ui/category-badge';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { EmptyState } from '@/components/ui/empty-state';
import { RowMenu } from '@/components/ui/row-menu';
import { createSupplierAction, setSupplierActiveAction } from '@/features/operations/actions';

function exportCsv(suppliers) {
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['Nome', 'CNPJ', 'Telefone', 'Email de pedidos', 'Marcas', 'Prazo (dias)', 'Status'],
    ...suppliers.map((s) => [s.name, s.cnpj, s.phone, s.order_email, (s.brands || []).join(', '), s.lead_time_days, s.active ? 'Ativo' : 'Inativo']),
  ];
  const blob = new Blob(['﻿' + rows.map((r) => r.map(cell).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'fornecedores.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function emptyForm() {
  return { name: '', cnpj: '', phone: '', email: '', brands: '', leadTimeDays: '', notes: '', categoryIds: new Set() };
}

export function Suppliers({ initialSuppliers, categories }) {
  const navigate = useNavigate();
  const suppliers = React.useMemo(
    () => initialSuppliers.map((s) => ({ ...s, cats: (s.supplier_categories || []).map((sc) => sc.category) })),
    [initialSuppliers],
  );

  const [formOpen, setFormOpen] = React.useState(false);
  const [f, setF] = React.useState(emptyForm());
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const toggleCategory = (id) => setF((s) => {
    const n = new Set(s.categoryIds);
    if (n.has(id)) n.delete(id); else n.add(id);
    return { ...s, categoryIds: n };
  });
  const [error, setError] = React.useState('');
  const [listError, setListError] = React.useState('');
  const [pending, startTransition] = React.useTransition();

  const setActive = (s, active) => {
    setListError('');
    startTransition(async () => {
      const result = await setSupplierActiveAction({ id: s.id, active });
      if (result?.error) setListError(result.error);
    });
  };

  const submit = () => {
    setError('');
    if (f.name.trim().length < 2) { setError('Informe o nome do fornecedor.'); return; }
    startTransition(async () => {
      const result = await createSupplierAction({
        name: f.name, cnpj: f.cnpj, phone: f.phone, email: f.email, brands: f.brands,
        leadTimeDays: f.leadTimeDays ? parseInt(f.leadTimeDays, 10) : null,
        notes: f.notes, categoryIds: [...f.categoryIds],
      });
      if (result?.error) { setError(result.error); return; }
      setFormOpen(false);
      setF(emptyForm());
    });
  };

  return (
    <StoreShell route="/suppliers" breadcrumb={['Fornecedores']} navigate={navigate}>
      <PageHeader
        title="Fornecedores"
        sub={`${suppliers.length} fornecedor${suppliers.length === 1 ? '' : 'es'} cadastrado${suppliers.length === 1 ? '' : 's'}`}
        actions={(
          <>
            <button onClick={() => exportCsv(suppliers)} disabled={suppliers.length === 0} className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar</button>
            <button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={13} /> Cadastrar fornecedor</button>
          </>
        )}
      />
      <Page>
        {suppliers.length === 0 ? (
          <EmptyState
            icon={<I.Truck size={18} />}
            title="Nenhum fornecedor cadastrado ainda"
            desc="Fornecedores aparecem nas entradas de compra e no cadastro de produtos."
            action={<button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={12} /> Cadastrar fornecedor</button>}
          />
        ) : (
          <>
            <Toolbar placeholder="Buscar por nome, CNPJ ou marca…" filters={[{ label: 'Categoria', value: 'Todas' }, { label: 'Prazo', value: 'Todos' }]} right={<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{suppliers.length} fornecedores</span>} />

            {listError && <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{listError}</div>}

            <div className="card table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fornecedor</th><th>CNPJ</th><th>Contato</th><th>Categorias</th><th>Marcas</th>
                    <th className="num">Prazo</th><th style={{ width: 30 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} style={{ opacity: s.active ? 1 : 0.55 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <StoreAvatar name={s.name} />
                          <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/suppliers/detail?id=${s.id}`); }} style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</a>
                          {!s.active && <span className="badge">Inativo</span>}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{s.cnpj ?? '—'}</td>
                      <td>
                        <div style={{ fontSize: 12 }}>{s.phone ?? '—'}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{s.order_email ?? '—'}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>{s.cats.map((c) => c && <CategoryBadge key={c.id} category={c} />)}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{(s.brands || []).join(', ') || '—'}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{s.lead_time_days ? `${s.lead_time_days}d` : '—'}</td>
                      <td>
                        <RowMenu label={`Ações de ${s.name}`} items={[
                          { label: 'Ver detalhe', onSelect: () => navigate(`/suppliers/detail?id=${s.id}`) },
                          { label: 'Editar', onSelect: () => navigate(`/suppliers/edit?id=${s.id}`) },
                          s.active
                            ? { label: 'Desativar', tone: 'danger', onSelect: () => setActive(s, false) }
                            : { label: 'Reativar', onSelect: () => setActive(s, true) },
                        ]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Page>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); setF(emptyForm()); }} title="Cadastrar fornecedor" desc="Dados usados nas entradas de compra e nos relatórios de origem." width={520}
        footer={<><button onClick={() => { setFormOpen(false); setF(emptyForm()); }} className="btn btn-ghost">Cancelar</button><button onClick={submit} disabled={pending} className="btn btn-primary">{pending ? 'Salvando…' : 'Salvar fornecedor'}</button></>}>
        <Field label="Nome do fornecedor" required><TextInput value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="TechDistrib Comércio Ltda." /></Field>
        <div className="g2" style={{ gap: 14 }}>
          <Field label="CNPJ" hint="Formato 00.000.000/0000-00"><TextInput mono value={f.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0001-00" /></Field>
          <Field label="Telefone"><TextInput mono value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(11) 4002-1100" /></Field>
        </div>
        <Field label="Email"><TextInput type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="pedidos@fornecedor.com.br" /></Field>
        <Field label="Categorias atendidas" hint="Filtra este fornecedor no cadastro de produtos.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {categories.map((c) => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <input type="checkbox" checked={f.categoryIds.has(c.id)} onChange={() => toggleCategory(c.id)} /> {c.name}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Marcas fornecidas" hint="Separe por vírgula."><TextInput value={f.brands} onChange={(e) => set('brands', e.target.value)} placeholder="Foneclear, Voltway" /></Field>
        <Field label="Prazo médio de entrega"><TextInput mono value={f.leadTimeDays} onChange={(e) => set('leadTimeDays', e.target.value)} suffix="dias" /></Field>
        <Field label="Observações"><TextareaInput value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Ex.: pedido mínimo de R$ 5.000, faturamento em 30/60 dias." /></Field>
        {error && (
          <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>
            {error}
          </div>
        )}
      </Modal>
    </StoreShell>
  );
}
