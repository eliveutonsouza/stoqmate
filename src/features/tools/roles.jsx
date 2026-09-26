"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { I } from '@/components/icons';
import { ACCESS, AREAS, COVERED_COUNT, ROLES, STAFF, TENANT_AREAS } from '@/lib/permissions';

const DOT = {
  none: ['—', 'var(--fg-faint)', 'transparent'],
  view: ['Consulta', 'var(--fg-muted)', 'var(--bg-sunken)'],
  edit: ['Edita', 'var(--accent-text)', 'var(--accent-soft)'],
  full: ['Total', 'var(--success)', 'var(--success-soft)'],
};

export function Roles({ counts = {} }) {
  const navigate = useNavigate();
  const [level, setLevel] = React.useState('view');

  return (
    <StoreShell route="/settings/roles" breadcrumb={['Configurações', 'Perfis e permissões']} navigate={navigate}>
      <PageHeader title="Perfis e permissões" sub={`${AREAS.length} áreas · ${ROLES.length} perfis · ${COVERED_COUNT} telas classificadas`} />
      <SettingsLayout route="/settings/roles" navigate={navigate}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 14px', background: 'var(--bg-sunken)',
          border: '1px solid var(--line)', borderRadius: 8, fontSize: 12,
        }}>
          <span style={{ color: 'var(--fg-muted)', flexShrink: 0 }}><I.Shield size={15} /></span>
          <span style={{ color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
            Esta tabela é o contrato do sistema: uma rota nova nasce negada até receber uma área.
            Por enquanto valem estes perfis fixos; perfis personalizados ainda não estão disponíveis.
          </span>
          <button className="btn btn-outline btn-sm" disabled title="Em breve" style={{ opacity: 0.55, cursor: 'not-allowed' }}>
            Criar perfil <span className="badge" style={{ marginLeft: 4 }}>Em breve</span>
          </button>
        </div>

        <div className="card" style={{ overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Matriz de permissões</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Por área do produto. Passe o mouse numa área para ver as telas que ela cobre.</p>
            </div>
            <button onClick={() => navigate('/settings/users')} className="btn btn-ghost btn-sm">Ver usuários <I.ChevronRight size={12} /></button>
          </div>
          <div className="table-scroll"><table className="table">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Área</th>
                {ROLES.map(r => (
                  <th key={r.id} style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 500, color: 'var(--fg)' }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                      {counts[r.id] ?? 0} usuário{(counts[r.id] ?? 0) === 1 ? '' : 's'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TENANT_AREAS.map(a => (
                <tr key={a.id} title={a.routes.join('  ·  ')}>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2, lineHeight: 1.45 }}>{a.why}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                      {a.routes.length} tela{a.routes.length > 1 ? 's' : ''}
                    </div>
                  </td>
                  {ROLES.map(r => {
                    const lv = a.access[r.id] || 'none';
                    const [lbl, col, bg] = DOT[lv];
                    return (
                      <td key={r.id} style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', minWidth: 68, padding: '3px 9px', borderRadius: 999,
                          background: bg, color: col, fontSize: 11.5, fontWeight: lv === 'none' ? 400 : 500,
                        }}>{lbl}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table></div>
          <div style={{ padding: '11px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>Para o desenvolvimento:</strong> esconder o item de menu não é permissão.
            Toda rota desta tabela precisa da mesma checagem na API — senão o vendedor chega no relatório de lucratividade digitando o endereço.
          </div>
        </div>

        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <span style={{ color: 'var(--fg-muted)', display: 'flex', marginTop: 2 }}><I.Shield size={16} /></span>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Console da plataforma</h3>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
              As {AREAS.find(a => a.staff).routes.length} telas internas da Stoqmate ficam fora desta matriz de propósito.
              Elas pertencem à {STAFF.name} e nenhum perfil de loja as alcança — nem o Proprietário.
            </p>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Simular um perfil</h3>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--fg-muted)' }}>
            O que cada pessoa vê ao entrar. Use antes de convidar alguém novo.
          </p>
          <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, marginBottom: 14, maxWidth: 420 }}>
            {['view', 'edit'].map(k => (
              <button key={k} onClick={() => setLevel(k)} style={{
                flex: 1, background: level === k ? 'var(--bg-elev)' : 'transparent',
                border: '1px solid ' + (level === k ? 'var(--line)' : 'transparent'),
                borderRadius: 5, padding: '6px 10px', fontSize: 12.5, fontWeight: 500,
                color: level === k ? 'var(--fg)' : 'var(--fg-muted)',
              }}>{k === 'view' ? 'Consegue abrir' : 'Consegue alterar'}</button>
            ))}
          </div>
          <div className="g4" style={{ gap: 12 }}>
            {ROLES.map(r => {
              const ok = TENANT_AREAS.filter(a => ACCESS[a.access[r.id] || 'none'] >= ACCESS[level]);
              return (
                <div key={r.id} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 14, background: 'var(--bg)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 4, lineHeight: 1.45, minHeight: 50 }}>{r.desc}</div>
                  <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.025em', marginTop: 8 }}>
                    {ok.length}<span style={{ fontSize: 13, color: 'var(--fg-faint)', fontWeight: 400 }}>/{TENANT_AREAS.length}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-faint)' }}>áreas</div>
                </div>
              );
            })}
          </div>
        </div>
      </SettingsLayout>
    </StoreShell>
  );
}
