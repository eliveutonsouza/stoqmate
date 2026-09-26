"use client";

import * as React from 'react';
import { unstable_rethrow, useRouter } from 'next/navigation';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { NOTIF_TONE } from '@/features/network-admin/notif-tone';
import { FormCard } from '@/components/ui/form-card';
import { markNotificationsReadAction } from '@/features/network-admin/notifications-actions';

const KIND = {
  out_of_stock: { tone: 'danger', icon: 'Alert' },
  low_stock: { tone: 'warning', icon: 'Alert' },
  access_request: { tone: 'info', icon: 'Lock' },
};

function timeAgo(iso) {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function Notifications({ notifications, preferences }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [filter, setFilter] = React.useState('all');
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState('');

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const rows = filter === 'unread' ? notifications.filter((n) => !n.read_at)
    : filter === 'danger' ? notifications.filter((n) => n.kind === 'out_of_stock')
    : filter === 'warning' ? notifications.filter((n) => n.kind === 'low_stock')
    : notifications;

  const markRead = (ids) => startTransition(async () => {
    setError('');
    try {
      const result = await markNotificationsReadAction(ids);
      if (result?.error) { setError(result.error); return; }
      router.refresh();
    } catch (e) {
      unstable_rethrow(e);
      setError('Não foi possível marcar como lida. Verifique a conexão e tente de novo.');
    }
  });

  const markAllRead = () => markRead();

  const open = (n) => {
    if (!n.read_at) markRead([n.id]);
    if (n.target_type === 'product') navigate(`/products/detail?id=${n.target_id}`);
    if (n.target_type === 'user') navigate('/settings/users');
  };

  return (
    <StoreShell route="/notifications" breadcrumb={['Notificações']} navigate={navigate}>
      <PageHeader
        title="Notificações"
        sub={`${unreadCount} não lidas · alertas de estoque e pedidos de acesso`}
        actions={<button onClick={markAllRead} disabled={pending || unreadCount === 0} className="btn btn-outline btn-sm">Marcar todas como lidas</button>}
        tabs={[
          { id: 'all', label: `Todas · ${notifications.length}` },
          { id: 'unread', label: `Não lidas · ${unreadCount}` },
          { id: 'danger', label: `Ruptura · ${notifications.filter((n) => n.kind === 'out_of_stock').length}` },
          { id: 'warning', label: `Alertas · ${notifications.filter((n) => n.kind === 'low_stock').length}` },
        ]}
        activeTab={filter}
        onTab={setFilter}
      />
      <Page width={900}>
        {error && (
          <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: 12.5 }}>{error}</div>
        )}
        <div className="card" style={{ overflow: 'hidden' }}>
          {rows.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>Nenhuma notificação aqui.</div>
          ) : rows.map((n, i) => {
            const kind = KIND[n.kind] ?? { tone: 'info', icon: 'Bell' };
            const tone = NOTIF_TONE[kind.tone];
            const Ico = I[kind.icon] || I.Bell;
            const unread = !n.read_at;
            return (
              <button key={n.id} onClick={() => open(n)} style={{
                display: 'flex', gap: 13, alignItems: 'flex-start', width: '100%', textAlign: 'left',
                padding: '14px 18px', background: unread ? 'var(--bg-elev)' : 'transparent',
                border: 'none', borderBottom: i < rows.length - 1 ? '1px solid var(--line-soft)' : 'none',
                borderLeft: '2px solid ' + (unread ? 'var(--accent)' : 'transparent'),
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = unread ? 'var(--bg-elev)' : 'transparent'; }}
              >
                <span style={{
                  width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                  background: tone.bg, color: tone.fg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Ico size={14} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: unread ? 600 : 500, color: 'var(--fg)', letterSpacing: '-0.01em' }}>{n.title}</span>
                    {unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}></span>}
                  </span>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 3, lineHeight: 1.5 }}>{n.message}</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, whiteSpace: 'nowrap' }}>{timeAgo(n.created_at)}</span>
              </button>
            );
          })}
        </div>

        <FormCard title="Preferências de notificação" desc="Todo aviso aparece aqui no painel. O envio por email ainda não está disponível." cols={1}>
          {preferences.map((r, i, arr) => (
            <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{r.desc}</div>
              </div>
              <label title="Em breve" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--fg-faint)', cursor: 'not-allowed' }}>
                <input type="checkbox" checked={false} readOnly disabled /> por email <span className="badge">Em breve</span>
              </label>
            </div>
          ))}
        </FormCard>
      </Page>
    </StoreShell>
  );
}
