"use client";

import { SECTION } from '@/features/landing/section';
import { Eyebrow } from '@/features/landing/eyebrow';
import { H2 } from '@/features/landing/h2';
import { FeatureRow } from '@/features/landing/feature-row';
import { ShowcaseFrame } from '@/components/ui/showcase-frame';
import { NetworkDashboard } from '@/features/analysis/network-dashboard';
import { TabletPOS } from '@/features/pos/tablet-pos';
import { ReportABC } from '@/features/analysis/report-abc';

export function LandingFeatures({ navigate }) {
  return (
    <section style={{ ...SECTION, paddingBottom: 72 }}>
      <Eyebrow>Como funciona na prática</Eyebrow>
      <H2>Telas de verdade. Estas são as que você vai usar amanhã.</H2>

      <div style={{ marginTop: 28 }}>
        <FeatureRow
          navigate={navigate}
          eyebrow="Multi-loja"
          title="Falta numa loja, sobra na outra — e agora você vê isso"
          body="A visão da rede compara todas as unidades por receita, meta, margem e ruptura. E aponta o SKU que está em falta aqui e parado no depósito."
          bullets={[
            'Saldo isolado por unidade, consolidado da rede numa tela',
            'Transferência com conferência cega no recebimento',
            'Vendedor consulta o estoque das outras lojas sem sair do balcão',
          ]}
          cta={{ l: 'Ver a visão da rede', r: '/network' }}
        >
          <ShowcaseFrame order={1} url="stoqmate.com.br/network" width={1380} height={900} scale={0.44}>
            <NetworkDashboard navigate={() => {}} />
          </ShowcaseFrame>
        </FeatureRow>

        <FeatureRow
          flip
          navigate={navigate}
          eyebrow="Balcão"
          title="O caixa fecha o dia sem calculadora"
          body="PDV de toque para tablet, com carrinho de vários itens, desconto por linha e no total, e fechamento de caixa com contagem cega por cédula."
          bullets={[
            'Alvos de toque de 56 px — feito para dedo, não para mouse',
            'Contagem cega: o esperado só aparece depois que você conta',
            'Diferença no caixa exige justificativa e avisa o gestor',
          ]}
          cta={{ l: 'Abrir o PDV de balcão', r: '/pos' }}
        >
          <ShowcaseFrame order={2} url="stoqmate.com.br/pos" width={1380} height={900} scale={0.44} chrome={false} radius={14}>
            <TabletPOS navigate={() => {}} />
          </ShowcaseFrame>
        </FeatureRow>

        <FeatureRow
          navigate={navigate}
          eyebrow="Decisão de compra"
          title="Onde está o seu dinheiro parado"
          body="A curva ABC separa os produtos que pagam a operação dos que só ocupam prateleira, com giro anual e recomendação por item."
          bullets={[
            'Classe A, B e C calculadas sobre a sua receita real',
            'Cobertura em dias no ritmo de venda de cada unidade',
            'Reposição sugerida por prazo de fornecedor, não por chute',
          ]}
          cta={{ l: 'Ver a curva ABC', r: '/reports/abc' }}
        >
          <ShowcaseFrame order={3} url="stoqmate.com.br/reports/abc" width={1380} height={900} scale={0.44}>
            <ReportABC navigate={() => {}} />
          </ShowcaseFrame>
        </FeatureRow>
      </div>
    </section>
  );
}

// === 6 · AI (the differentiator) ===
