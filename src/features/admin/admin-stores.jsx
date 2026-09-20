"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { MOCK } from '@/lib/mock';
import { layoutStyles } from '@/components/layout/layout-styles';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { PageHeader } from '@/components/layout/page-header';
import { PLATFORM } from '@/lib/plans';
import { I } from '@/components/icons';
import { FilterChip } from '@/components/ui/filter-chip';
import { StoreAvatar } from '@/components/domain/store-avatar';
import { PlanBadge } from '@/components/domain/plan-badge';
import { StatusBadge } from '@/components/domain/status-badge';

export function AdminStores() {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState('all');
  const stores = filter === 'all' ? MOCK.stores : MOCK.stores.filter(s => s.status === filter);
  return (
    <div style={layoutStyles.appShell}>
      <AdminSidebar route="/admin/stores" navigate={navigate} />
      <div style={layoutStyles.main}>
        <AppHeader breadcrumb={['Console', 'Lojas']} navigate={navigate} contextSwitch="admin" />
        <div style={layoutStyles.content}>
          <PageHeader
            title="Lojas"
            sub={`Todas as redes assinantes · ${PLATFORM.units} lojas no total`}
            actions={(
              <>
                <button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar CSV</button>
                <button onClick={() => navigate('/admin/stores/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Adicionar rede</button>
              </>
            )}
            tabs={[
              { id: 'all', label: `Todas · ${MOCK.stores.length}` },
              { id: 'active', label: `Ativas · ${MOCK.stores.filter(s=>s.status==='active').length}` },
              { id: 'trial', label: `Trial · ${MOCK.stores.filter(s=>s.status==='trial').length}` },
              { id: 'past_due', label: `Inadimplentes · ${MOCK.stores.filter(s=>s.status==='past_due').length}` },
            ]}
            activeTab={filter}
            onTab={setFilter}
          />

          <div style={{ padding: '20px 28px 40px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
              padding: '8px 10px', background: 'var(--bg-elev)',
              border: '1px solid var(--line)', borderRadius: 8,
            }}>
              <div style={{ position: 'relative', width: 280 }}>
                <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-soft)' }}>
                  <I.Search size={13} />
                </span>
                <input className="input" placeholder="Buscar rede, segmento, cidade ou CNPJ…" style={{ paddingLeft: 30 }} />
              </div>
              <FilterChip label="Plano" value="Todos" />
              <FilterChip label="UF" value="Todas" />
              <FilterChip label="Cadastrada" value="Sempre" />
              <div style={{ flex: 1 }}></div>
              <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{stores.length} redes</span>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Rede</th>
                    <th>Segmento</th>
                    <th>Cidade</th>
                    <th>Plano</th>
                    <th>Status</th>
                    <th className="num">MRR</th>
                    <th className="num">Lojas</th>
                    <th className="num">SKUs</th>
                    <th style={{ width: 90 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((s, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <StoreAvatar name={s.name} />
                          <div>
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/stores/detail'); }} style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</a>
                            <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{s.name.toLowerCase().replace(/[^a-z]/g,'').substring(0,12)}.stoqmate.com.br</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.segment}</td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{s.city}</td>
                      <td><PlanBadge plan={s.plan} /></td>
                      <td><StatusBadge status={s.status} /></td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.mrr}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{s.units}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{s.skus.toLocaleString('pt-BR')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button className="btn btn-ghost btn-sm" title="Entrar como rede" style={{ padding: '0 6px' }}>
                            <I.Logout size={12} style={{ transform: 'scaleX(-1)' }} />
                          </button>
                          <button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// === AI Monitoring ===
