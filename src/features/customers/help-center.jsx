"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { I } from '@/components/icons';
import { HubCard } from '@/components/domain/hub-card';

const SUPPORT_EMAIL = 'suporte@stoqmate.com.br';

const FAQ = [
  ['Como conto estoque sem parar a loja?', 'Abra uma contagem por local e conte pelo celular enquanto atende. A sessão fica aberta e você fecha quando terminar.', '/stock/count'],
  ['Meu fornecedor aumentou o preço. Como repasso?', 'Use o reajuste em lote por fornecedor, categoria ou marca — ele simula a margem de cada SKU antes de aplicar.', '/products/pricing'],
  ['Falta produto numa loja e sobra na outra. O que faço?', 'A visão da rede aponta os SKUs desbalanceados e sugere a transferência.', '/network'],
  ['Como sei quais produtos valem a pena?', 'A curva ABC mostra quais SKUs fazem a maior parte da receita e onde o capital está parado.', '/reports/abc'],
  ['Cliente quer trocar sem o cupom. Consigo?', 'Sim, se a venda estiver vinculada a um cliente cadastrado — o histórico serve de comprovante.', '/customers'],
  ['O caixa não fechou. E agora?', 'O fechamento exige justificativa da diferença. O turno seguinte não herda o erro.', '/cash'],
];

const TOPICS = [
  { i: 'Sliders', t: 'Categorias e atributos', d: 'Como montar o esquema do seu ramo e por que o SKU depende dele.' },
  { i: 'Box', t: 'Cadastro e importação', d: 'Trazer catálogo de planilha, mapear colunas e corrigir erros.' },
  { i: 'Activity', t: 'Movimentações', d: 'Entrada, venda, troca, devolução, transferência e ajuste.' },
  { i: 'Swap', t: 'Multi-loja', d: 'Saldo por unidade, transferências e visão consolidada da rede.' },
  { i: 'Credit', t: 'Caixa e balcão', d: 'Formas de pagamento, crédito do cliente e, se ligado, abertura, sangria e fechamento de turno.' },
  { i: 'Chart', t: 'Relatórios', d: 'Vendas, lucratividade, curva ABC e exportações.' },
  { i: 'Users', t: 'Equipe e permissões', d: 'Perfis, o que cada um vê e limites de desconto.' },
  { i: 'Shield', t: 'Conta e assinatura', d: 'Planos, limites, faturas e dados da empresa.' },
];

export function HelpCenter() {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const term = query.trim().toLowerCase();
  const faq = term ? FAQ.filter(([q, a]) => `${q} ${a}`.toLowerCase().includes(term)) : FAQ;

  return (
    <StoreShell route="/help" breadcrumb={['Ajuda']} navigate={navigate}>
      <PageHeader
        title="Central de ajuda"
        sub="Perguntas frequentes e caminhos rápidos pelas telas do sistema."
        actions={(
          <>
            <button onClick={() => navigate('/first-run')} className="btn btn-outline btn-sm">Primeiros passos</button>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-primary btn-sm">Falar com o suporte</a>
          </>
        )}
      />
      <Page gap={20} width={1060}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
            <I.Search size={16} />
          </span>
          <input className="input" placeholder="Como faço para…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 42, height: 46, fontSize: 15 }} />
        </div>

        <div>
          <div className="section-h"><h3>Perguntas mais frequentes</h3></div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {faq.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>Nenhum resultado para &ldquo;{query}&rdquo;.</div>
            ) : faq.map(([q, a, r], i, arr) => (
              <button key={q} onClick={() => navigate(r)} style={{
                display: 'flex', gap: 13, alignItems: 'flex-start', width: '100%', textAlign: 'left',
                padding: '14px 18px', background: 'transparent', border: 'none',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: 2 }}><I.Sparkle size={14} /></span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: 'var(--fg)', letterSpacing: '-0.008em' }}>{q}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 3, lineHeight: 1.5 }}>{a}</span>
                </span>
                <I.ChevronRight size={14} style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 3 }} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="section-h"><h3>Por assunto</h3></div>
          <div className="g4" style={{ gap: 12 }}>
            {TOPICS.map(t => {
              const Ico = I[t.i] || I.Box;
              return (
                <a
                  key={t.t}
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Dúvida: ${t.t}`)}`}
                  title={`Enviar dúvida sobre "${t.t}" ao suporte`}
                  className="card"
                  style={{ padding: 16, display: 'block', color: 'inherit', textDecoration: 'none' }}
                >
                  <span style={{ color: 'var(--fg-muted)', display: 'flex' }}><Ico size={17} /></span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 11, letterSpacing: '-0.01em' }}>{t.t}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4, lineHeight: 1.5 }}>{t.d}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--accent-text)', marginTop: 8 }}>Perguntar ao suporte →</div>
                </a>
              );
            })}
          </div>
        </div>

        <div className="g2" style={{ gap: 12 }}>
          <HubCard icon={<I.Users size={15} />} title="Falar por email" desc={`Escreva pra ${SUPPORT_EMAIL} com sua dúvida.`} accent onClick={() => window.location.assign(`mailto:${SUPPORT_EMAIL}`)} />
          <HubCard icon={<I.Sparkle size={15} />} title="Migração assistida" desc="Peça ajuda por email pra importar seu catálogo." accent onClick={() => window.location.assign(`mailto:${SUPPORT_EMAIL}?subject=Migra%C3%A7%C3%A3o%20assistida`)} />
        </div>
      </Page>
    </StoreShell>
  );
}
