"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { layoutStyles } from '@/components/layout/layout-styles';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { StoreAvatar } from '@/components/domain/store-avatar';
import { PlanBadge } from '@/components/domain/plan-badge';

const PLAN_NAMES = { balcao: 'Balcão', controle: 'Controle', rede: 'Rede' };

export function AdminStores({ tenants }) {
  const navigate = useNavigate();
  return (
    <div style={layoutStyles.appShell}>
      <AdminSidebar route="/admin/stores" navigate={navigate} />
      <div style={layoutStyles.main}>
        <AppHeader breadcrumb={['Console', 'Lojas']} navigate={navigate} contextSwitch="admin" />
        <div style={layoutStyles.content}>
          <PageHeader title="Lojas" sub={`Todas as redes assinantes · ${tenants.length} redes`} />

          <div style={{ padding: '20px 28px 40px' }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              {tenants.length === 0 ? (
                <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>Nenhuma rede cadastrada ainda.</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rede</th>
                      <th>Plano</th>
                      <th className="num">Lojas</th>
                      <th className="num">SKUs</th>
                      <th>Cadastrada em</th>
                      <th style={{ width: 90 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <StoreAvatar name={t.name} />
                            <div>
                              <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/admin/stores/detail?id=${t.id}`); }} style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</a>
                              <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{t.cnpj || 'sem CNPJ'}</div>
                            </div>
                          </div>
                        </td>
                        <td><PlanBadge plan={PLAN_NAMES[t.plan_id] ?? t.plan_id} /></td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{t.storeCount}</td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{t.skuCount}</td>
                        <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <button onClick={() => navigate(`/admin/stores/detail?id=${t.id}`)} className="btn btn-ghost btn-sm">Ver <I.ChevronRight size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--fg-muted)' }}>
              MRR e status de assinatura chegam quando a cobrança (Stripe) estiver configurada.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
