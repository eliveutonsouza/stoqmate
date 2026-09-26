"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { I } from '@/components/icons';

// O canal de email ainda não existe (nenhum provedor de envio configurado).
// As preferências antigas continuam no banco, mas a tela não as edita até o
// envio existir — prometer email que nunca chega é pior que não oferecer.
export function NotificationSettings({ preferences }) {
  const navigate = useNavigate();
  const prefs = preferences;

  return (
    <StoreShell route="/settings/notifications" breadcrumb={['Configurações', 'Avisos']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, unidades, equipe e assinatura." />
      <SettingsLayout route="/settings/notifications" navigate={navigate}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '11px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
            Todo evento aparece na caixa de avisos do painel. O envio dos avisos por email ainda não está disponível.
          </span>
          <span className="badge">Email em breve</span>
        </div>

        <div className="card table-scroll">
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Regras de aviso</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Vale para toda a rede.</p>
            </div>
            <button onClick={() => navigate('/notifications')} className="btn btn-ghost btn-sm">Ver caixa de avisos <I.ChevronRight size={12} /></button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Evento</th>
                <th style={{ textAlign: 'center', width: 110 }}>No painel</th>
                <th style={{ textAlign: 'center', width: 110 }}>Email <span style={{ fontWeight: 400, color: 'var(--fg-faint)' }}>· em breve</span></th>
              </tr>
            </thead>
            <tbody>
              {prefs.map((r) => (
                <tr key={r.key}>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{r.desc}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked readOnly disabled aria-label="Sempre no painel" />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={false} readOnly disabled title="Em breve" aria-label="Email — em breve" style={{ cursor: 'not-allowed' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsLayout>
    </StoreShell>
  );
}
