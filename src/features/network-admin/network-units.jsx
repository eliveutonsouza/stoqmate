"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
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
import { createStoreAction } from '@/features/network-admin/actions';

const TYPE_LABEL = { loja: 'Loja', cd: 'CD', quiosque: 'Quiosque', estoque_externo: 'Estoque externo' };

export function NetworkUnits({ units, totalItems, totalSkus, planName, storeLimit, storeCount }) {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('loja');
  const [city, setCity] = React.useState('');
  const [cnpj, setCnpj] = React.useState('');
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();
  const maxItems = Math.max(1, ...units.map(u => u.items));

  const closeForm = () => { setFormOpen(false); setError(''); setName(''); setCity(''); setCnpj(''); setType('loja'); };
  const submit = () => {
    setError('');
    if (name.trim().length < 2) { setError('Informe o nome da unidade.'); return; }
    startTransition(async () => {
      const result = await createStoreAction({ name, type, city, cnpj });
      if (result?.error) { setError(result.error); return; }
      closeForm();
    });
  };

  const willExceed = type === 'loja' && storeLimit && storeCount >= storeLimit;

  return (
    <StoreShell route="/settings/units" breadcrumb={['Configurações', 'Unidades']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, unidades, equipe e assinatura." />
      <SettingsLayout route="/settings/units" navigate={navigate}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Unidades', v: `${units.length}`, s: `${storeCount} loja${storeCount === 1 ? '' : 's'}${storeLimit ? ` de ${storeLimit}` : ''}` },
            { l: 'SKUs na rede', v: totalSkus.toLocaleString('pt-BR'), s: 'com saldo em algum local' },
            { l: 'Itens em estoque', v: totalItems.toLocaleString('pt-BR'), s: 'somando todas' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 2 ? '1px solid var(--line)' : 'none' }}>
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
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Cada unidade tem saldo e locais de estoque próprios.</p>
            </div>
            <button onClick={() => setFormOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={12} /> Adicionar unidade</button>
          </div>
          <table className="table">
            <thead>
              <tr><th>Unidade</th><th>Tipo</th><th>Cidade</th><th className="num">SKUs</th><th style={{ width: '18%' }}>Itens</th><th className="num">Usuários</th><th>Desde</th></tr>
            </thead>
            <tbody>
              {units.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StoreAvatar name={u.name} />
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
                    </div>
                  </td>
                  <td><span className="badge">{TYPE_LABEL[u.type] ?? u.type}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{u.city ?? '—'}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.skus.toLocaleString('pt-BR')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--bg-sunken)', borderRadius: 2 }}>
                        <div style={{ width: `${(u.items / maxItems) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }}></div>
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)', minWidth: 44, textAlign: 'right' }}>{u.items.toLocaleString('pt-BR')}</span>
                    </div>
                  </td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{u.users}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {storeLimit && (
            <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--fg-muted)', flex: 1 }}>
                {storeCount} de {storeLimit} lojas do plano {planName} utilizadas — centro de distribuição e quiosque não contam.
              </span>
              <button onClick={() => navigate('/settings/subscription')} className="btn btn-outline btn-sm">Ver planos</button>
            </div>
          )}
        </div>

        <FormCard title="Como as unidades funcionam" cols={1}>
          <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
            Catálogo, preços e equipe são compartilhados entre todas as unidades da rede — não há cadastro
            duplicado. Toda transferência exige confirmação de recebimento no destino antes de entrar no saldo.
          </div>
        </FormCard>
      </SettingsLayout>

      <Modal open={formOpen} onClose={closeForm} title="Adicionar unidade" desc="A nova unidade começa com saldo zerado." width={480}
        footer={<><button onClick={closeForm} className="btn btn-ghost">Cancelar</button><button onClick={submit} disabled={pending} className="btn btn-primary">{pending ? 'Criando…' : 'Criar unidade'}</button></>}>
        <Field label="Nome da unidade" required><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Loja Santo André" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Tipo" required>
            <SelectInput value={type} onChange={setType} options={[
              { value: 'loja', label: 'Loja' }, { value: 'cd', label: 'CD' },
              { value: 'quiosque', label: 'Quiosque' }, { value: 'estoque_externo', label: 'Estoque externo' },
            ]} />
          </Field>
          <Field label="CNPJ" hint="Se tiver CNPJ próprio."><TextInput mono value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="Opcional" /></Field>
        </div>
        <Field label="Cidade e estado"><TextInput value={city} onChange={(e) => setCity(e.target.value)} placeholder="Santo André · SP" /></Field>
        {willExceed && (
          <div style={{ padding: '11px 13px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 7, fontSize: 12, color: 'var(--fg)', lineHeight: 1.5 }}>
            Isso passaria do limite de {storeLimit} lojas do plano {planName}. A criação será recusada — considere um upgrade primeiro.
          </div>
        )}
        {error && (
          <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>{error}</div>
        )}
      </Modal>
    </StoreShell>
  );
}
