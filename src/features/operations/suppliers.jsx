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
import { MOCK } from '@/lib/mock';
import { TextareaInput } from '@/components/ui/textarea-input';

export const SUPPLIERS = [
  { name: 'TechDistrib', cnpj: '12.345.678/0001-90', phone: '(11) 4002-1100', email: 'pedidos@techdistrib.com.br', cats: ['eletronicos'], brands: 'Foneclear, Voltway', skus: 186, lastBuy: '18 set 2026', volume: 186400, lead: 8 },
  { name: 'Vento Sul', cnpj: '98.765.432/0001-10', phone: '(51) 3222-8800', email: 'compras@ventosul.com.br', cats: ['calcados'], brands: 'Olympikus, Terrano', skus: 584, lastBuy: '11 set 2026', volume: 148200, lead: 12 },
  { name: 'Malha & Cia', cnpj: '45.678.901/0001-55', phone: '(11) 3555-4040', email: 'vendas@malhaecia.com.br', cats: ['vestuario'], brands: 'Malharia Sul', skus: 412, lastBuy: '18 set 2026', volume: 96800, lead: 15 },
  { name: 'Grão Nobre', cnpj: '33.222.111/0001-44', phone: '(41) 3030-7070', email: 'contato@graonobre.com.br', cats: ['alimentos'], brands: 'Serra Alta', skus: 142, lastBuy: '16 set 2026', volume: 74600, lead: 5 },
  { name: 'Lar Import', cnpj: '77.888.999/0001-22', phone: '(48) 3111-2200', email: 'comercial@larimport.com.br', cats: ['casa'], brands: 'Casa Viva', skus: 268, lastBuy: '09 set 2026', volume: 52400, lead: 21 },
  { name: 'Papel Forte', cnpj: '55.444.333/0001-66', phone: '(11) 2888-3300', email: 'pedidos@papelforte.com.br', cats: ['papelaria'], brands: 'Norma', skus: 96, lastBuy: '02 set 2026', volume: 28900, lead: 7 },
];

export function Suppliers() {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = React.useState(false);
  return (
    <StoreShell route="/suppliers" breadcrumb={['Fornecedores']} navigate={navigate}>
      <PageHeader
        title="Fornecedores"
        sub="6 fornecedores ativos · R$ 587.300 comprados nos últimos 12 meses"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar</button>
            <button onClick={() => navigate('/suppliers/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Cadastrar fornecedor</button>
          </>
        )}
      />
      <Page>
        <Toolbar placeholder="Buscar por nome, CNPJ ou marca…" filters={[{ label: 'Categoria', value: 'Todas' }, { label: 'Prazo', value: 'Todos' }]} right={<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>6 fornecedores</span>} />

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Fornecedor</th><th>CNPJ</th><th>Contato</th><th>Categorias</th><th>Marcas</th>
                <th className="num">SKUs</th><th className="num">Prazo</th><th className="num">Compras 12m</th><th>Última compra</th><th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {SUPPLIERS.map((s, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StoreAvatar name={s.name} />
                      <a href="#" onClick={(e) => { e.preventDefault(); navigate('/suppliers/detail'); }} style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</a>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{s.cnpj}</td>
                  <td>
                    <div style={{ fontSize: 12 }}>{s.phone}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{s.email}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>{s.cats.map(c => <CategoryBadge key={c} cat={c} />)}</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.brands}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.skus}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{s.lead}d</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>R$ {s.volume.toLocaleString('pt-BR')}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{s.lastBuy}</td>
                  <td><button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Cadastrar fornecedor" desc="Dados usados nas entradas de compra e nos relatórios de origem." width={520}
        footer={<><button onClick={() => setFormOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={() => setFormOpen(false)} className="btn btn-primary">Salvar fornecedor</button></>}>
        <Field label="Nome do fornecedor" required><TextInput placeholder="TechDistrib Comércio Ltda." /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="CNPJ" required hint="Formato 00.000.000/0000-00"><TextInput mono placeholder="00.000.000/0001-00" /></Field>
          <Field label="Telefone" required><TextInput mono placeholder="(11) 4002-1100" /></Field>
        </div>
        <Field label="Email" required><TextInput type="email" placeholder="pedidos@fornecedor.com.br" /></Field>
        <Field label="Categorias atendidas" hint="Filtra este fornecedor no cadastro de produtos.">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {MOCK.categories.map((c, i) => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <input type="checkbox" defaultChecked={i === 0} /> {c.name}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Marcas fornecidas" hint="Separe por vírgula."><TextInput placeholder="Foneclear, Voltway" /></Field>
        <Field label="Prazo médio de entrega"><TextInput mono placeholder="8" suffix="dias" /></Field>
        <Field label="Observações"><TextareaInput placeholder="Ex.: pedido mínimo de R$ 5.000, faturamento em 30/60 dias." /></Field>
      </Modal>
    </StoreShell>
  );
}

// === Promotions ===
