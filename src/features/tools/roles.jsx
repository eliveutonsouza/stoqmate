"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { I } from '@/components/icons';
import { PERMISSIONS } from '@/lib/permissions';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';

export function Roles() {
  const navigate = useNavigate();
  const roles = ['Vendedor', 'Gestor de Estoque', 'Gestor Financeiro', 'Proprietário'];
  const counts = [2, 1, 1, 1];

  return (
    <StoreShell route="/settings/roles" breadcrumb={['Configurações', 'Perfis e permissões']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, unidades, equipe e assinatura." />
      <SettingsLayout route="/settings/roles" navigate={navigate}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 14px', background: 'var(--bg-sunken)',
          border: '1px solid var(--line)', borderRadius: 8, fontSize: 12,
        }}>
          <span style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><I.Shield size={15} /></span>
          <span style={{ color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
            Os quatro perfis padrão são hierárquicos: cada um inclui o que o anterior pode fazer.
            No plano Rede é possível criar perfis próprios com permissões avulsas.
          </span>
          <button className="btn btn-outline btn-sm" disabled style={{ opacity: 0.55, cursor: 'not-allowed' }}>Criar perfil</button>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Matriz de permissões</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>O que cada perfil pode fazer no sistema.</p>
            </div>
            <button onClick={() => navigate('/settings/users')} className="btn btn-ghost btn-sm">Ver usuários <I.ChevronRight size={12} /></button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '42%' }}>Permissão</th>
                {roles.map((r, i) => (
                  <th key={r} style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 500, color: 'var(--fg)' }}>{r}</div>
                    <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      {counts[i]} usuário{counts[i] > 1 ? 's' : ''}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map(g => (
                <React.Fragment key={g.group}>
                  <tr>
                    <td colSpan={5} style={{
                      background: 'var(--bg-sunken)', fontSize: 11, fontWeight: 500,
                      color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '7px 12px',
                    }}>{g.group}</td>
                  </tr>
                  {g.rows.map(([perm, allowed]) => (
                    <tr key={perm}>
                      <td style={{ fontSize: 13 }}>{perm}</td>
                      {allowed.map((a, j) => (
                        <td key={j} style={{ textAlign: 'center' }}>
                          {a
                            ? <span style={{ color: 'var(--accent-text)', display: 'inline-flex' }}><I.Check size={14} stroke={2.2} /></span>
                            : <span style={{ color: 'var(--fg-muted)' }} title="Não permitido">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <FormCard title="Regras adicionais" desc="Valem para todos os perfis, além da matriz acima." cols={2}
          footer={<button className="btn btn-primary">Salvar alterações</button>}>
          <Field label="Desconto máximo sem aprovação" span={1} hint="Acima disso, exige um Gestor Financeiro.">
            <TextInput mono defaultValue="20" suffix="%" />
          </Field>
          <Field label="Ajuste de inventário sem aprovação" span={1} hint="Divergências acima disso notificam o proprietário.">
            <TextInput mono prefix="R$" defaultValue="200,00" />
          </Field>
          <Field label="Vendedor vê custo e margem?" span={1}>
            <SelectInput value="Não" onChange={() => {}} options={['Não', 'Sim']} />
          </Field>
          <Field label="Vendedor pode operar em outras unidades?" span={1}>
            <SelectInput value="Apenas consulta de saldo" onChange={() => {}} options={['Não', 'Apenas consulta de saldo', 'Sim']} />
          </Field>
        </FormCard>
      </SettingsLayout>
    </StoreShell>
  );
}
