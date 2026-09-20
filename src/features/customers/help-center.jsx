"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { I } from '@/components/icons';
import { HubCard } from '@/components/domain/hub-card';

export function HelpCenter() {
  const navigate = useNavigate();
  const topics = [
    { i: 'Sliders', t: 'Categorias e atributos', d: 'Como montar o esquema do seu ramo e por que o SKU depende dele.', n: 8 },
    { i: 'Box', t: 'Cadastro e importação', d: 'Trazer catálogo de planilha, mapear colunas e corrigir erros.', n: 12 },
    { i: 'Activity', t: 'Movimentações', d: 'Entrada, venda, troca, devolução, transferência e ajuste.', n: 14 },
    { i: 'Swap', t: 'Multi-loja', d: 'Saldo por unidade, transferências e visão consolidada da rede.', n: 9 },
    { i: 'Credit', t: 'Caixa e balcão', d: 'Abertura, sangria, suprimento e fechamento de turno.', n: 7 },
    { i: 'Chart', t: 'Relatórios', d: 'Vendas, lucratividade, curva ABC e exportações.', n: 11 },
    { i: 'Users', t: 'Equipe e permissões', d: 'Perfis, o que cada um vê e limites de desconto.', n: 6 },
    { i: 'Shield', t: 'Conta e assinatura', d: 'Planos, limites, faturas e dados da empresa.', n: 5 },
  ];

  return (
    <StoreShell route="/help" breadcrumb={['Ajuda']} navigate={navigate}>
      <PageHeader
        title="Central de ajuda"
        sub="82 artigos · tempo médio de resposta do suporte: 14 min"
        actions={(
          <>
            <button onClick={() => navigate('/first-run')} className="btn btn-outline btn-sm">Primeiros passos</button>
            <button className="btn btn-primary btn-sm">Falar com o suporte</button>
          </>
        )}
      />
      <Page gap={20} width={1060}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)' }}>
            <I.Search size={16} />
          </span>
          <input className="input" placeholder="Como faço para…" style={{ paddingLeft: 42, height: 46, fontSize: 15 }} />
        </div>

        <div>
          <div className="section-h"><h3>Perguntas mais frequentes</h3></div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {[
              ['Como conto estoque sem parar a loja?', 'Abra uma contagem por local e conte pelo celular enquanto atende. A sessão fica aberta e você fecha quando terminar.', '/stock/count'],
              ['Meu fornecedor aumentou 8%. Como repasso?', 'Use o reajuste em lote por fornecedor — ele simula a margem de cada SKU antes de aplicar.', '/products/pricing'],
              ['Falta produto numa loja e sobra na outra. O que faço?', 'A visão da rede aponta os SKUs desbalanceados e sugere a transferência.', '/network'],
              ['Como sei quais produtos valem a pena?', 'A curva ABC mostra quais SKUs fazem 70% da receita e onde o capital está parado.', '/reports/abc'],
              ['Cliente quer trocar sem o cupom. Consigo?', 'Sim, se a venda estiver vinculada a um cliente cadastrado — o histórico serve de comprovante.', '/customers'],
              ['O caixa não fechou. E agora?', 'O fechamento exige justificativa da diferença e notifica o gestor. O turno seguinte não herda o erro.', '/cash'],
            ].map(([q, a, r], i, arr) => (
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {topics.map(t => {
              const Ico = I[t.i] || I.Box;
              return (
                <div key={t.t} className="card" style={{ padding: 16 }}>
                  <span style={{ color: 'var(--fg-muted)', display: 'flex' }}><Ico size={17} /></span>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 11, letterSpacing: '-0.01em' }}>{t.t}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4, lineHeight: 1.5 }}>{t.d}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', marginTop: 10, fontFamily: 'var(--font-mono)' }}>{t.n} artigos</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { i: <I.Users size={15} />, t: 'Chat com o suporte', d: 'Seg a sáb, 8h às 20h. Resposta média em 14 min.', a: 'Abrir chat' },
            { i: <I.Sparkle size={15} />, t: 'Migração assistida', d: 'Nossa equipe importa seu catálogo junto com você, por videochamada.', a: 'Agendar' },
            { i: <I.Activity size={15} />, t: 'Status da plataforma', d: 'Todos os serviços operando normalmente.', a: 'Ver status' },
          ].map(c => (
            <HubCard key={c.t} icon={c.i} title={c.t} desc={c.d} accent onClick={() => {}} />
          ))}
        </div>
      </Page>
    </StoreShell>
  );
}
