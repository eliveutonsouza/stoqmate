"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { I } from '@/components/icons';

export function ProductNotFound() {
  const navigate = useNavigate();
  return (
    <StoreShell route="/products" breadcrumb={['Catálogo', 'Produto']} navigate={navigate}>
      <PageHeader title="Produto" />
      <Page>
        <EmptyState icon={<I.Alert size={18} />} title="Produto não encontrado" desc="O link é inválido ou o produto não existe mais."
          action={<button onClick={() => navigate('/products')} className="btn btn-primary btn-sm">Voltar ao catálogo</button>} />
      </Page>
    </StoreShell>
  );
}
