"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { I } from '@/components/icons';
import { EmptyState } from '@/components/ui/empty-state';

export function FirstRun({ status }) {
  const navigate = useNavigate();
  const steps = [
    { done: true, t: 'Loja criada', d: 'Sua rede já está configurada', r: '/settings/store-data' },
    { done: status.hasCategories, t: 'Categorias escolhidas', d: 'Esquema de atributos por linha de produto', r: '/categories' },
    { done: status.hasProducts, t: 'Cadastrar os produtos', d: 'Importe sua planilha ou cadastre um a um', r: '/products/import', primary: !status.hasProducts },
    { done: status.hasSuppliers, t: 'Cadastrar fornecedores', d: 'Para vincular às entradas de compra', r: '/suppliers/new' },
    { done: status.hasLocations, t: 'Criar os locais de estoque', d: 'Prateleiras, gôndolas, depósito', r: '/shelves/new' },
    { done: status.hasTeam, t: 'Convidar a equipe', d: 'Vendedores registram venda sem ver relatórios', r: '/settings/users' },
    { done: status.hasCashSession, t: 'Abrir o caixa', d: 'Primeiro turno no balcão', r: '/cash' },
  ];
  const done = steps.filter((s) => s.done).length;

  return (
    <StoreShell route="/first-run" breadcrumb={['Primeiros passos']} navigate={navigate}>
      <PageHeader
        title="Vamos colocar sua loja de pé"
        sub="Alguns passos ainda não foram concluídos. O app fica assim até o catálogo entrar — nada aqui é erro."
        actions={<button onClick={() => navigate('/help')} className="btn btn-outline btn-sm">Central de ajuda</button>}
      />
      <Page gap={20} width={1060}>
        <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{done} de {steps.length} passos concluídos</div>
              <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3 }}>Dá para parar no meio e voltar depois.</div>
            </div>
            <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{Math.round((done / steps.length) * 100)}%</span>
          </div>
          <div style={{ height: 5, background: 'var(--bg-sunken)', borderRadius: 3, marginBottom: 18 }}>
            <div style={{ width: `${(done / steps.length) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 3 }}></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {steps.map((s, i) => (
              <button key={s.t} onClick={() => navigate(s.r)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                padding: '11px 13px',
                border: '1px solid ' + (s.primary ? 'var(--accent)' : 'var(--line)'),
                background: s.primary ? 'var(--accent-soft)' : 'var(--bg-elev)',
                borderRadius: 8, opacity: s.done ? 0.68 : 1,
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: s.done ? 'var(--accent-strong)' : 'transparent',
                  border: '1px solid ' + (s.done ? 'transparent' : 'var(--line-strong)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: s.done ? '#fff' : 'var(--fg-muted)',
                  fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
                }}>{s.done ? <I.Check size={11} stroke={3} /> : i + 1}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.t}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{s.d}</span>
                </span>
                {s.primary && <span className="badge badge-accent">comece aqui</span>}
                <I.ChevronRight size={14} style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="section-h"><h3>Como as telas ficam sem dados</h3></div>
          <div className="g3" style={{ gap: 12 }}>
            {[
              { i: <I.Box size={18} />, t: 'Catálogo vazio', d: 'Nenhum produto cadastrado. Importe uma planilha ou cadastre o primeiro à mão.', a: 'Importar planilha', r: '/products/import' },
              { i: <I.Activity size={18} />, t: 'Sem movimentações', d: 'O histórico começa na primeira entrada de compra ou venda registrada.', a: 'Registrar entrada', r: '/stock/entry' },
              { i: <I.Chart size={18} />, t: 'Relatórios sem base', d: 'Os relatórios precisam de pelo menos 7 dias de vendas para ter o que comparar.', a: 'Ver relatórios', r: '/reports' },
            ].map(e => (
              <div key={e.t} className="card" style={{ overflow: 'hidden' }}>
                <EmptyState icon={e.i} title={e.t} desc={e.d}
                  action={<button onClick={() => navigate(e.r)} className="btn btn-outline btn-sm">{e.a}</button>} />
              </div>
            ))}
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
