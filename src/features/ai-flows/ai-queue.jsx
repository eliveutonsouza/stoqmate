"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { I } from '@/components/icons';
import { HubCard } from '@/components/domain/hub-card';
import { EmptyState } from '@/components/ui/empty-state';

export function AIQueue({ enrichCount, forecastCount, anomalyCount }) {
  const navigate = useNavigate();
  const total = enrichCount + forecastCount + anomalyCount;

  const cards = [
    { count: enrichCount, icon: <I.Sliders size={16} />, title: 'Atributos faltando', desc: 'Produtos com atributo do esquema da categoria em branco.', route: '/ai/enrich' },
    { count: forecastCount, icon: <I.Chart size={16} />, title: 'Sugestão de reposição', desc: 'Itens com saldo baixo pro ritmo de venda, prontos pra virar pedido.', route: '/ai/forecast' },
    { count: anomalyCount, icon: <I.Alert size={16} />, title: 'Anomalias de estoque', desc: 'Rupturas com venda recente e estoque parado sem giro.', route: '/ai/anomalies' },
  ].filter((c) => c.count > 0);

  return (
    <StoreShell route="/ai/queue" breadcrumb={['IA', 'Fila de revisão']} navigate={navigate}>
      <PageHeader title="Fila de revisão" sub={`${total} pendência${total === 1 ? '' : 's'} nas ferramentas de IA e análise.`} />
      <Page width={1040}>
        {cards.length === 0 ? (
          <EmptyState icon={<I.Check size={18} />} title="Nada pendente" desc="Catálogo completo, reposição em dia e sem anomalias abertas." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {cards.map((c) => (
              <HubCard key={c.route} icon={c.icon} title={c.title} desc={c.desc} accent onClick={() => navigate(c.route)} meta={[['Pendentes', `${c.count}`]]} />
            ))}
          </div>
        )}
      </Page>
    </StoreShell>
  );
}
