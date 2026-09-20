"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { brl } from '@/lib/format';
import { Toolbar } from '@/components/ui/toolbar';
import { StoreAvatar } from '@/components/domain/store-avatar';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { TextareaInput } from '@/components/ui/textarea-input';

export const CUSTOMERS = [
  { name: 'Patrícia Menezes', doc: '284.119.330-45', phone: '(11) 98812-4409', since: 'Mar 2025', buys: 18, spent: 6842.00, last: '18 set', credit: 0, tier: 'Frequente' },
  { name: 'Construtora Vale Norte', doc: '18.402.556/0001-31', phone: '(11) 3044-2200', since: 'Jan 2025', buys: 34, spent: 48260.00, last: '16 set', credit: 0, tier: 'Corporativo' },
  { name: 'Eduardo Lacerda', doc: '402.887.120-08', phone: '(11) 97733-1180', since: 'Jun 2025', buys: 9, spent: 2418.00, last: '12 set', credit: 189.00, tier: 'Ativo' },
  { name: 'Rita Camargo', doc: '331.204.665-72', phone: '(19) 98120-7744', since: 'Ago 2025', buys: 6, spent: 1284.00, last: '09 set', credit: 0, tier: 'Ativo' },
  { name: 'Escola Nova Aurora', doc: '22.918.774/0001-60', phone: '(11) 2255-8080', since: 'Fev 2026', buys: 11, spent: 18940.00, last: '04 set', credit: 0, tier: 'Corporativo' },
  { name: 'Marcos Tavares', doc: '118.994.302-19', phone: '(11) 96622-3341', since: 'Mai 2026', buys: 2, spent: 388.00, last: '22 ago', credit: 62.00, tier: 'Novo' },
];

export function Customers() {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = React.useState(false);
  const TIER = { Corporativo: 'badge-info', Frequente: 'badge-accent', Ativo: 'badge-success', Novo: 'badge' };

  return (
    <StoreShell route="/customers" breadcrumb={['Clientes']} navigate={navigate}>
      <PageHeader
        title="Clientes"
        sub="Cadastro opcional — habilita troca sem cupom, crédito em loja e histórico de compras"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar</button>
            <button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={13} /> Cadastrar cliente</button>
          </>
        )}
        tabs={[
          { id: 'all', label: `Todos · ${CUSTOMERS.length}` },
          { id: 'corp', label: 'Corporativos · 2' },
          { id: 'credit', label: 'Com crédito · 2' },
        ]}
        activeTab="all"
      />
      <Page>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Clientes cadastrados', v: '482', s: '34% das vendas identificadas' },
            { l: 'Ticket médio identificado', v: brl(412), s: 'vs. R$ 287 anônimo', tone: 'up' },
            { l: 'Recompra em 90 dias', v: '38%', s: '+4pp vs trimestre', tone: 'up' },
            { l: 'Crédito em loja aberto', v: brl(1284), s: '9 clientes', tone: 'warn' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 10.5, marginTop: 2, color: m.tone === 'up' ? 'var(--success)' : m.tone === 'warn' ? 'var(--warning)' : 'var(--fg-muted)' }}>{m.s}</div>
            </div>
          ))}
        </div>

        <Toolbar placeholder="Buscar por nome, CPF, CNPJ ou telefone…"
          filters={[{ label: 'Tipo', value: 'Todos' }, { label: 'Última compra', value: 'Sempre' }]}
          right={<span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{CUSTOMERS.length} de 482</span>} />

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th><th>Documento</th><th>Contato</th><th>Perfil</th>
                <th className="num">Compras</th><th className="num">Total gasto</th>
                <th className="num">Crédito</th><th>Última compra</th><th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {CUSTOMERS.map(c => (
                <tr key={c.doc}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StoreAvatar name={c.name} />
                      <a href="#" onClick={(e) => { e.preventDefault(); navigate('/customers/detail'); }} style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</a>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{c.doc}</td>
                  <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{c.phone}</td>
                  <td><span className={`badge ${TIER[c.tier]}`}>{c.tier}</span></td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.buys}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(c.spent)}</td>
                  <td className="num">
                    {c.credit > 0
                      ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--warning)' }}>{brl(c.credit)}</span>
                      : <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{c.last}</td>
                  <td><button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Cadastrar cliente" desc="Só nome e um contato são obrigatórios — o resto pode vir depois." width={480}
        footer={<><button onClick={() => setFormOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={() => setFormOpen(false)} className="btn btn-primary">Salvar cliente</button></>}>
        <Field label="Nome ou razão social" required><TextInput placeholder="Patrícia Menezes" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="CPF ou CNPJ"><TextInput mono placeholder="000.000.000-00" /></Field>
          <Field label="Telefone" required><TextInput mono placeholder="(11) 90000-0000" /></Field>
        </div>
        <Field label="Email" hint="Para enviar comprovante e avisar de promoções."><TextInput type="email" placeholder="cliente@email.com" /></Field>
        <Field label="Perfil">
          <SelectInput value="Ativo" onChange={() => {}} options={['Novo', 'Ativo', 'Frequente', 'Corporativo']} />
        </Field>
        <Field label="Observações"><TextareaInput placeholder="Ex.: compra sempre para a obra, pede nota no CNPJ." /></Field>
      </Modal>
    </StoreShell>
  );
}

// === /customers/detail ===
