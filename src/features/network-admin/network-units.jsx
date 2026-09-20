"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { UNITS } from '@/features/network-admin/units';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { I } from '@/components/icons';
import { StoreAvatar } from '@/components/domain/store-avatar';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { Modal } from '@/components/ui/modal';
import { TextInput } from '@/components/ui/text-input';

export function NetworkUnits() {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = React.useState(false);
  const totalItems = UNITS.reduce((s, u) => s + u.items, 0);
  const maxItems = Math.max(...UNITS.map(u => u.items));

  return (
    <StoreShell route="/settings/units" breadcrumb={['Configurações', 'Unidades']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, unidades, equipe e assinatura." />
      <SettingsLayout route="/settings/units" navigate={navigate}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Unidades', v: '4', s: '3 lojas cobradas + 1 CD' },
            { l: 'SKUs na rede', v: '7.998', s: 'sem duplicar entre lojas' },
            { l: 'Itens em estoque', v: totalItems.toLocaleString('pt-BR'), s: 'somando todas' },
            { l: 'Transferências · 30d', v: '64', s: '648 itens movidos' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Unidades da rede</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Cada unidade tem saldo, locais de estoque e equipe próprios.</p>
            </div>
            <button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={12} /> Adicionar unidade</button>
          </div>
          <table className="table">
            <thead>
              <tr><th>Unidade</th><th>Tipo</th><th>Cidade</th><th className="num">SKUs</th><th style={{ width: '18%' }}>Itens</th><th className="num">Usuários</th><th>Desde</th><th style={{ width: 30 }}></th></tr>
            </thead>
            <tbody>
              {UNITS.map(u => (
                <tr key={u.name} style={{ background: u.current ? 'var(--accent-soft)' : undefined }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StoreAvatar name={u.name} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {u.name}
                          {u.current && <span className="badge badge-accent">atual</span>}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                          {u.name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 14)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge">{u.type}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{u.city}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.skus.toLocaleString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                        <div style={{ width: `${(u.items / maxItems) * 100}%`, height: '100%', background: u.current ? 'var(--accent)' : 'var(--fg-faint)', borderRadius: 2 }}></div>
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 44, textAlign: 'right' }}>{u.items.toLocaleString('pt-BR')}</span>
                    </div>
                  </td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{u.users}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{u.since}</td>
                  <td><button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--fg-muted)', flex: 1 }}>
              3 de 3 lojas do plano Controle utilizadas — o centro de distribuição não é cobrado como loja. O plano Rede não tem limite.
            </span>
            <button onClick={() => navigate('/settings/subscription')} className="btn btn-outline btn-sm">Ver planos</button>
          </div>
        </div>

        <FormCard title="Regras da rede" desc="Como as unidades se relacionam entre si." cols={2}
          footer={<button className="btn btn-primary">Salvar alterações</button>}>
          <Field label="Catálogo" span={1} hint="Produtos compartilhados evitam cadastro duplicado.">
            <SelectInput value="Compartilhado entre todas as unidades" onChange={() => {}}
              options={['Compartilhado entre todas as unidades', 'Independente por unidade']} />
          </Field>
          <Field label="Preços" span={1}>
            <SelectInput value="Preço único na rede" onChange={() => {}}
              options={['Preço único na rede', 'Preço por unidade', 'Preço único com exceções']} />
          </Field>
          <Field label="Transferência" span={1} hint="Protege o saldo contra recebimento não conferido.">
            <SelectInput value="Exige confirmação no destino" onChange={() => {}}
              options={['Exige confirmação no destino', 'Entrada automática no destino']} />
          </Field>
          <Field label="Visibilidade de estoque" span={1} hint="Permite ao balcão indicar outra loja ao cliente.">
            <SelectInput value="Vendedor vê saldo das outras unidades" onChange={() => {}}
              options={['Vendedor vê saldo das outras unidades', 'Vendedor vê só a própria unidade']} />
          </Field>
        </FormCard>
      </SettingsLayout>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Adicionar unidade" desc="A nova unidade começa com o catálogo da rede e saldo zerado." width={480}
        footer={<><button onClick={() => setFormOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={() => setFormOpen(false)} className="btn btn-primary">Criar unidade</button></>}>
        <Field label="Nome da unidade" required><TextInput placeholder="Loja Santo André" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Tipo" required>
            <SelectInput value="Loja" onChange={() => {}} options={['Loja', 'CD', 'Quiosque', 'Estoque externo']} />
          </Field>
          <Field label="CNPJ" hint="Se tiver CNPJ próprio."><TextInput mono placeholder="Opcional" /></Field>
        </div>
        <Field label="Cidade e estado" required><TextInput placeholder="Santo André · SP" /></Field>
        <Field label="Copiar locais de estoque de" hint="Cria os mesmos códigos de prateleira na nova unidade.">
          <SelectInput value="Loja Centro" onChange={() => {}} options={['Não copiar', ...UNITS.map(u => u.name)]} />
        </Field>
        <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
          Esta será a <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>4ª loja</strong>, acima do limite de 3 do plano Controle. Centros de distribuição não contam. Para ir além, é necessário o plano Rede.
        </div>
      </Modal>
    </StoreShell>
  );
}

// === /notifications ===
