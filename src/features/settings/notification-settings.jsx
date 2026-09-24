"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { I } from '@/components/icons';
import { saveNotificationPreferencesAction } from '@/features/network-admin/notifications-actions';

export function NotificationSettings({ preferences }) {
  const navigate = useNavigate();
  const [prefs, setPrefs] = React.useState(preferences);
  const [error, setError] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const toggle = (key) => { setSaved(false); setPrefs((p) => p.map((r) => (r.key === key ? { ...r, email: !r.email } : r))); };
  const emailOn = prefs.filter((r) => r.email).length;

  const save = () => {
    setError(''); setSaved(false);
    startTransition(async () => {
      const result = await saveNotificationPreferencesAction(prefs.map((p) => ({ key: p.key, email: p.email })));
      if (result?.error) { setError(result.error); return; }
      setSaved(true);
    });
  };

  return (
    <StoreShell route="/settings/notifications" breadcrumb={['Configurações', 'Avisos']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, unidades, equipe e assinatura." />
      <SettingsLayout route="/settings/notifications" navigate={navigate}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '11px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
            Todo evento sempre aparece na caixa de avisos do painel. Aqui você escolhe quais também chegam por email.
          </span>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{emailOn} de {prefs.length} por email</span>
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
              <tr><th>Evento</th><th style={{ textAlign: 'center', width: 100 }}>Email</th></tr>
            </thead>
            <tbody>
              {prefs.map((r) => (
                <tr key={r.key}>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>{r.desc}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={r.email} onChange={() => toggle(r.key)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {error && <span style={{ fontSize: 12, color: 'var(--danger)', flex: 1 }}>{error}</span>}
            {saved && <span style={{ fontSize: 12, color: 'var(--success)', flex: 1 }}>Preferências salvas.</span>}
            {!error && !saved && <span style={{ flex: 1 }} />}
            <button onClick={save} disabled={pending} className="btn btn-primary btn-sm">{pending ? 'Salvando…' : 'Salvar preferências'}</button>
          </div>
        </div>
      </SettingsLayout>
    </StoreShell>
  );
}
