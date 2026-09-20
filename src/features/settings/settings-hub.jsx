"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { HubCard } from '@/components/domain/hub-card';
import { I } from '@/components/icons';

export function SettingsHub() {
  const navigate = useNavigate();
  return (
    <StoreShell route="/settings" breadcrumb={['Configurações']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, unidades, equipe e assinatura." />
      <Page gap={20}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <HubCard icon={<I.Sparkle size={15} />} accent title="Branding" onClick={() => navigate('/settings/branding')}
            desc="Logo e cor principal da rede. Os tons secundários para tema claro e escuro são gerados automaticamente." />
          <HubCard icon={<I.Store size={15} />} accent title="Dados da empresa" onClick={() => navigate('/settings/store-data')}
            desc="Razão social, CNPJ, endereço e preferências de operação usadas nos relatórios e notas." />
          <HubCard icon={<I.Swap size={15} />} accent title="Unidades da rede" onClick={() => navigate('/settings/units')}
            desc="Lojas e centros de distribuição. Cada unidade tem saldo isolado e locais de estoque próprios."
            meta={[['Unidades', '4'], ['Limite', '5']]} />
          <HubCard icon={<I.Users size={15} />} accent title="Usuários e perfis" onClick={() => navigate('/settings/users')}
            desc="Equipe da rede e o que cada perfil pode ver e fazer, de vendedor a proprietário."
            meta={[['Usuários', '6'], ['Limite', '10']]} />
          <HubCard icon={<I.Credit size={15} />} accent title="Plano e assinatura" onClick={() => navigate('/settings/subscription')}
            desc="Plano atual, uso dos limites, forma de pagamento e histórico de faturas."
            meta={[['Plano', 'Controle'], ['Mensal', 'R$ 89']]} />
          <HubCard icon={<I.Sliders size={15} />} accent title="Categorias e atributos" onClick={() => navigate('/categories')}
            desc="O esquema de cada categoria: atributos do SKU, valores permitidos e unidade de medida."
            meta={[['Categorias', '6'], ['Atributos', '12']]} />
        </div>

        <div>
          <div className="section-h"><h3>Sua conta</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <HubCard icon={<I.Shield size={15} />} title="Meu perfil" onClick={() => navigate('/profile')}
              desc="Seus dados de acesso, senha, verificação em duas etapas e sessões ativas." />
            <HubCard icon={<I.Bell size={15} />} title="Notificações" onClick={() => navigate('/notifications')}
              desc="Alertas de ruptura, transferências pendentes e avisos de cobrança." />
            <HubCard icon={<I.Download size={15} />} title="Importar catálogo" onClick={() => navigate('/products/import')}
              desc="Traga sua planilha de produtos com mapeamento de colunas assistido." />
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
