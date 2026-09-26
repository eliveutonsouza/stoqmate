"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { I } from '@/components/icons';
import { saveNotificationPreferencesAction } from '@/features/network-admin/notifications-actions';

// Só regras com evento real (`ready`) podem ligar email; as demais ainda não
// geram aviso nenhum — nem no painel — e aparecem como "Em breve". Email vai
// para os proprietários da rede.
export function NotificationSettings({ preferences }) {
  const navigate = useNavigate();
  const [emails, setEmails] = React.useState(() => Object.fromEntries(preferences.map((r) => [r.key, r.email])));
  const [status, setStatus] = React.useState({ kind: 'idle', message: '' });
  const [pending, startTransition] = React.useTransition();
  const dirty = preferences.some((r) => r.ready && emails[r.key] !== r.email);

  const save = () => {
    setStatus({ kind: 'idle', message: '' });
    startTransition(async () => {
      const res = await saveNotificationPreferencesAction(
        preferences.filter((r) => r.ready).map((r) => ({ key: r.key, email: Boolean(emails[r.key]) })),
      ).catch(() => ({ error: 'Não foi possível salvar agora. Tente de novo.' }));
      if (res?.error) { setStatus({ kind: 'error', message: res.error }); return; }
      setStatus({ kind: 'ok', message: 'Preferências salvas.' });
    });
  };

  return (
    <StoreShell route="/settings/notifications" breadcrumb={['Configurações', 'Avisos']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, unidades, equipe e assinatura." />
      <SettingsLayout route="/settings/notifications" navigate={navigate}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '11px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
            Todo evento aparece na caixa de avisos do painel. Com email ligado, o aviso também vai para o email dos proprietários da rede.
          </span>
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
                <th style={{ textAlign: 'center', width: 110 }}>Email</th>
              </tr>
            </thead>
            <tbody>
              {preferences.map((r) => (
                <tr key={r.key} style={{ opacity: r.ready ? 1 : 0.6 }}>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title} {!r.ready && <span className="badge">Em breve</span>}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{r.desc}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={r.ready} readOnly disabled aria-label={r.ready ? 'Sempre no painel' : 'Em breve'} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={r.ready && Boolean(emails[r.key])}
                      disabled={!r.ready || pending}
                      onChange={(e) => setEmails((m) => ({ ...m, [r.key]: e.target.checked }))}
                      aria-label={`Email — ${r.title}`}
                      style={{ cursor: r.ready ? 'pointer' : 'not-allowed' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--line)' }}>
            {status.message && (
              <span role={status.kind === 'error' ? 'alert' : 'status'} style={{ fontSize: 12, color: status.kind === 'error' ? 'var(--danger)' : 'var(--success)' }}>{status.message}</span>
            )}
            <button onClick={save} disabled={!dirty || pending} className="btn btn-primary btn-sm">{pending ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </div>
      </SettingsLayout>
    </StoreShell>
  );
}
