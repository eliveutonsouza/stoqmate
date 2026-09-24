"use client";

import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { MovementNav } from '@/features/stock/movement-nav';

export function MovementPage({ route, navigate, title, sub, children, aside, submitLabel, onSubmit, submitDisabled }) {
  return (
    <StoreShell route={route} breadcrumb={['Estoque', title]} navigate={navigate}>
      <PageHeader title={title} sub={sub} />
      <Page>
        <MovementNav route={route} navigate={navigate} />
        <div className="split-aside" style={{ '--aside': '320px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>{children}</div>
          <div data-sticky style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {aside}
            <button
              className="btn btn-primary btn-lg" style={{ justifyContent: 'center', width: '100%', opacity: submitDisabled ? 0.5 : 1 }}
              disabled={submitDisabled}
              onClick={onSubmit ?? (() => navigate('/stock/history'))}
            >
              {submitLabel}
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }} onClick={() => navigate('/stock')}>Cancelar</button>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === Entry ===
