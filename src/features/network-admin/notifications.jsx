"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { NOTIFS } from '@/features/network-admin/notifs';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { NOTIF_TONE } from '@/features/network-admin/notif-tone';
import { FormCard } from '@/components/ui/form-card';

export function Notifications() {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState('all');
  const rows = filter === 'unread' ? NOTIFS.filter(n => n.unread) : filter === 'all' ? NOTIFS : NOTIFS.filter(n => n.type === filter);

  return (
    <StoreShell route="/notifications" breadcrumb={['Notificações']} navigate={navigate}>
      <PageHeader
        title="Notificações"
        sub="3 não lidas · alertas de estoque, transferências, cobrança e equipe"
        actions={(
          <>
            <button className="btn btn-outline btn-sm">Marcar todas como lidas</button>
            <button className="btn btn-outline btn-sm"><I.Settings size={13} /> Preferências</button>
          </>
        )}
        tabs={[
          { id: 'all', label: `Todas · ${NOTIFS.length}` },
          { id: 'unread', label: `Não lidas · ${NOTIFS.filter(n => n.unread).length}` },
          { id: 'danger', label: 'Ruptura · 1' },
          { id: 'warning', label: 'Alertas · 2' },
        ]}
        activeTab={filter}
        onTab={setFilter}
      />
      <Page width={900}>
        <div className="card" style={{ overflow: 'hidden' }}>
          {rows.map((n, i) => {
            const tone = NOTIF_TONE[n.type];
            const Ico = I[n.icon] || I.Bell;
            return (
              <button key={n.id} onClick={() => navigate(n.route)} style={{
                display: 'flex', gap: 13, alignItems: 'flex-start', width: '100%', textAlign: 'left',
                padding: '14px 18px', background: n.unread ? 'var(--bg-elev)' : 'transparent',
                border: 'none', borderBottom: i < rows.length - 1 ? '1px solid var(--line-soft)' : 'none',
                borderLeft: '2px solid ' + (n.unread ? 'var(--accent)' : 'transparent'),
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = n.unread ? 'var(--bg-elev)' : 'transparent'; }}
              >
                <span style={{
                  width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                  background: tone.bg, color: tone.fg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Ico size={14} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: n.unread ? 600 : 500, color: 'var(--fg)', letterSpacing: '-0.01em' }}>{n.title}</span>
                    {n.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}></span>}
                  </span>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 3, lineHeight: 1.5 }}>{n.desc}</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, whiteSpace: 'nowrap' }}>{n.time}</span>
              </button>
            );
          })}
        </div>

        <FormCard title="Preferências de notificação" desc="Você recebe no painel sempre; escolha o que também vai por email." cols={1}
          footer={<button className="btn btn-primary">Salvar preferências</button>}>
          {[
            ['Ruptura de estoque', 'Quando um SKU chega a zero', true],
            ['Estoque abaixo do mínimo', 'Resumo diário dos itens em alerta', true],
            ['Transferências pendentes', 'Recebimento não confirmado em 48 h', true],
            ['Divergência de inventário', 'Ajustes acima de R$ 200', true],
            ['Promoções encerrando', 'Dois dias antes do fim da vigência', false],
            ['Cobrança e faturas', 'Fatura emitida, paga ou vencida', true],
          ].map(([t, d, on], i, arr) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{d}</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--fg-muted)' }}>
                <input type="checkbox" defaultChecked={on} /> por email
              </label>
            </div>
          ))}
        </FormCard>
      </Page>
    </StoreShell>
  );
}

// === /search — global search results ===
