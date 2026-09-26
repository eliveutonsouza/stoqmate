"use client";

import { SECTION } from '@/features/landing/section';
import { Eyebrow } from '@/features/landing/eyebrow';
import { H2 } from '@/features/landing/h2';
import { FeatureRow } from '@/features/landing/feature-row';
import { ShowcaseFrame } from '@/components/ui/showcase-frame';
import { NetworkDashboard } from '@/features/analysis/network-dashboard';
import { TabletPOS } from '@/features/pos/tablet-pos';
import { ReportABC } from '@/features/analysis/report-abc';
import { resolveReportRange, todayInSaoPaulo } from '@/lib/report-range';

// Vitrine da curva ABC: o relatório real exige filtros (período + loja)
// desde que o cabeçalho passou a ler a URL — sem isso a landing quebrava.
const ABC_SHOWCASE_FILTERS = { range: resolveReportRange({ period: '30d' }, todayInSaoPaulo()), storeId: null };

// Vitrine da landing — não é dado de tenant nenhum, só um exemplo ilustrativo
// pro print da curva ABC (mesma forma que a tela real recebe via props).
const ABC_SHOWCASE_ROWS = [
  { product_id: '1', sku: 'ELE-FONE-PRT', name: 'Fone Bluetooth ANC', revenue: 42800, units: 148, stock_qty: 22, stock_value: 3476, category_name: 'Eletrônicos', category_code: 'ELE', category_icon: 'Zap', category_color: '#1D4FD7' },
  { product_id: '2', sku: 'CAL-TEN-BRC', name: 'Tênis Corrida Branco', revenue: 31200, units: 96, stock_qty: 34, stock_value: 6120, category_name: 'Calçados', category_code: 'CAL', category_icon: 'Footprint', category_color: '#B45309' },
  { product_id: '3', sku: 'VES-CAM-AZL', name: 'Camisa Social Azul', revenue: 18400, units: 122, stock_qty: 58, stock_value: 4060, category_name: 'Vestuário', category_code: 'VES', category_icon: 'Shirt', category_color: '#0D9488' },
  { product_id: '4', sku: 'ELE-CARR-65W', name: 'Carregador GaN 65W', revenue: 9600, units: 210, stock_qty: 140, stock_value: 6300, category_name: 'Eletrônicos', category_code: 'ELE', category_icon: 'Zap', category_color: '#1D4FD7' },
  { product_id: '5', sku: 'CAS-DEC-VAS', name: 'Vaso Decorativo M', revenue: 2100, units: 30, stock_qty: 65, stock_value: 3900, category_name: 'Casa e Decoração', category_code: 'CAS', category_icon: 'Home', category_color: '#7C3AED' },
];

const CAT_ELE = { id: 'ele', name: 'Eletrônicos', code: 'ELE', icon: 'Zap', color: '#1D4FD7' };
const CAT_CAL = { id: 'cal', name: 'Calçados', code: 'CAL', icon: 'Footprint', color: '#B45309' };
const CAT_VES = { id: 'ves', name: 'Vestuário', code: 'VES', icon: 'Shirt', color: '#0D9488' };

// Mesma regra do ABC acima: estas telas agora recebem dado real via props
// e quebram sem elas — a vitrine passa um exemplo fixo no mesmo formato.
const NETWORK_SHOWCASE = {
  revenue: 184300, margin: 38.4, totalQty: 6420, ruptureCount: 7,
  stores: [
    { id: 's1', name: 'Loja Centro', type: 'loja', revenue: 82400, skuCount: 412, qty: 2380 },
    { id: 's2', name: 'Loja Shopping Norte', type: 'loja', revenue: 61900, skuCount: 388, qty: 1910 },
    { id: 's3', name: 'Loja Bairro Sul', type: 'loja', revenue: 40000, skuCount: 301, qty: 1260 },
    { id: 's4', name: 'CD Guarulhos', type: 'cd', revenue: 0, skuCount: 455, qty: 870 },
  ],
  imbalance: [
    { productId: 'p1', product: { name: 'Fone Bluetooth ANC', brand: 'Sonora', attrs: { cor: 'Preto' }, category: CAT_ELE }, min: { qty: 0 }, max: { qty: 38 } },
    { productId: 'p2', product: { name: 'Tênis Corrida', brand: 'Passo', attrs: { cor: 'Branco', tamanho: '41' }, category: CAT_CAL }, min: { qty: 1 }, max: { qty: 24 } },
    { productId: 'p3', product: { name: 'Camisa Social', brand: 'Alfaiate', attrs: { cor: 'Azul', tamanho: 'M' }, category: CAT_VES }, min: { qty: 2 }, max: { qty: 19 } },
  ],
};

const posProduct = (id, sku, brand, name, price, category, attrs, qty) => ({
  id, sku, brand, name, sale_price: price, category, attrs, stock_balances: [{ store_id: 's1', qty }],
});
const POS_SHOWCASE = {
  stores: [{ id: 's1', name: 'Loja Centro' }],
  categories: [CAT_ELE, CAT_CAL, CAT_VES],
  products: [
    posProduct('p1', 'ELE-FONE-PRT', 'Sonora', 'Fone Bluetooth ANC', 289.9, CAT_ELE, { cor: 'Preto' }, 22),
    posProduct('p2', 'ELE-CARR-65W', 'Volt', 'Carregador GaN 65W', 149.9, CAT_ELE, {}, 140),
    posProduct('p3', 'CAL-TEN-BRC', 'Passo', 'Tênis Corrida', 349.9, CAT_CAL, { cor: 'Branco', tamanho: '41' }, 34),
    posProduct('p4', 'VES-CAM-AZL', 'Alfaiate', 'Camisa Social', 159.9, CAT_VES, { cor: 'Azul', tamanho: 'M' }, 58),
    posProduct('p5', 'VES-CAM-BRC', 'Alfaiate', 'Camisa Social', 159.9, CAT_VES, { cor: 'Branco', tamanho: 'G' }, 41),
    posProduct('p6', 'CAL-SAN-MAR', 'Passo', 'Sandália Couro', 199.9, CAT_CAL, { cor: 'Marrom', tamanho: '38' }, 17),
  ],
  cashSessionByStore: {},
  operatorName: 'Mariana',
};

export function LandingFeatures({ navigate }) {
  return (
    <section id="recursos" style={{ ...SECTION, paddingBottom: 72, scrollMarginTop: 72 }}>
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
            <NetworkDashboard {...NETWORK_SHOWCASE} />
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
            <TabletPOS {...POS_SHOWCASE} />
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
            <ReportABC rows={ABC_SHOWCASE_ROWS} periodDays={30} filters={ABC_SHOWCASE_FILTERS} stores={[]} />
          </ShowcaseFrame>
        </FeatureRow>
      </div>
    </section>
  );
}

// === 6 · AI (the differentiator) ===
