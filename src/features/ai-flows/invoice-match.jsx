"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { brl } from '@/lib/format';
import { MATCH_ROWS } from '@/features/ai-flows/match-rows';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';

export function InvoiceMatch() {
  const navigate = useNavigate();
  function diagnose(r) {
    if (r.ordered === 0) return { k: 'extra', tone: 'warning', l: 'Não pedido', d: 'Veio na nota sem constar no pedido.' };
    if (r.nfPrice > r.poPrice + 0.001) return { k: 'price', tone: 'danger', l: 'Preço acima', d: `Pedido a ${brl(r.poPrice)}, cobrado a ${brl(r.nfPrice)}.` };
    if (r.received < r.invoiced) return { k: 'short', tone: 'danger', l: 'Faltou', d: `Nota cobra ${r.invoiced}, chegaram ${r.received}.` };
    if (r.invoiced > r.ordered) return { k: 'over', tone: 'warning', l: 'A mais', d: `Pedido ${r.ordered}, nota ${r.invoiced}.` };
    return { k: 'ok', tone: 'success', l: 'Confere', d: 'Quantidade e preço batem com o pedido.' };
  }
  const rowImpact = (r) => {
    const d = diagnose(r);
    if (d.k === 'price') return (r.nfPrice - r.poPrice) * r.invoiced;
    if (d.k === 'short') return (r.invoiced - r.received) * r.nfPrice;
    if (d.k === 'over') return (r.invoiced - r.ordered) * r.nfPrice;
    if (d.k === 'extra') return r.invoiced * r.nfPrice;
    return 0;
  };

  const [decisions, setDecisions] = React.useState({});
  const rows = MATCH_ROWS;
  const problems = rows.filter(r => diagnose(r).k !== 'ok');
  const exposure = problems.reduce((s, r) => s + rowImpact(r), 0);
  const nfTotal = rows.reduce((s, r) => s + r.invoiced * r.nfPrice, 0);
  const correctTotal = rows.reduce((s, r) => {
    const d = diagnose(r);
    if (d.k === 'extra') return s;
    const price = r.poPrice != null ? Math.min(r.nfPrice, r.poPrice) : r.nfPrice;
    return s + Math.min(r.received, r.invoiced) * price;
  }, 0);
  const decided = Object.keys(decisions).length;
  const set = (sku, v) => setDecisions(d => ({ ...d, [sku]: v }));

  return (
    <StoreShell route="/stock/receive/match" breadcrumb={['Estoque', 'Recebimento', 'Conferência da nota']} navigate={navigate}>
      <PageHeader
        title="Conferência da nota · NF 8420"
        sub="TechDistrib · pedido PC-0219 · 6 itens · recebido por Ana Ribeiro em 19 set 2026"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Download size={12} /> Ver nota</button>
            <button onClick={() => navigate('/purchase-orders')} className="btn btn-outline btn-sm">Abrir pedido</button>
          </>
        )}
      />
      <Page>
        <div className="card" style={{ padding: 18, borderColor: exposure > 0 ? 'var(--danger)' : 'var(--line)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--danger)', display: 'flex', marginTop: 2 }}><I.Alert size={18} /></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.015em' }}>
                {problems.length} de {rows.length} itens não batem com o pedido
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.6, maxWidth: 680 }}>
                A diferença a seu favor é de <strong style={{ color: 'var(--danger)', fontWeight: 600 }}>{brl(exposure)}</strong> nesta
                nota — {((exposure / nfTotal) * 100).toFixed(1)}% do valor total. A nota cobra {brl(nfTotal)};
                pelo pedido e pelo que chegou, o correto seria {brl(correctTotal)}.
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Diferença</div>
              <div style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.03em', color: 'var(--danger)' }}>{brl(exposure)}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-accent"><I.Sparkle size={10} /> 2 créditos usados</span>
            <span style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>
              A IA leu a nota e comparou com o pedido PC-0219. Os valores abaixo são do documento, não estimados.
            </span>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Item a item</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                Pedido × nota × conferência física. Decida cada divergência antes de dar entrada.
              </p>
            </div>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{decided}/{problems.length} resolvidos</span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Produto</th>
                <th className="num">Pedido</th><th className="num">Nota</th><th className="num">Chegou</th>
                <th className="num">Preço pedido</th><th className="num">Preço nota</th>
                <th className="num">Impacto</th><th>Situação</th><th style={{ width: 210 }}>Decisão</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const d = diagnose(r);
                const imp = rowImpact(r);
                const dec = decisions[r.sku];
                return (
                  <tr key={r.sku} style={{ background: d.k !== 'ok' && !dec ? 'var(--danger-soft)' : undefined }}>
                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.sku}</div>
                    </td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.ordered || '—'}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.invoiced}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: r.received !== r.invoiced ? 600 : 400, color: r.received !== r.invoiced ? 'var(--danger)' : 'var(--fg)' }}>{r.received}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.poPrice != null ? brl(r.poPrice) : '—'}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: d.k === 'price' ? 600 : 400, color: d.k === 'price' ? 'var(--danger)' : 'var(--fg)' }}>{brl(r.nfPrice)}</td>
                    <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: imp > 0 ? 'var(--danger)' : 'var(--fg-soft)' }}>{imp > 0 ? brl(imp) : '—'}</td>
                    <td>
                      <div title={d.d}>
                        <span className={'badge badge-' + (d.tone === 'success' ? 'success' : d.tone === 'danger' ? 'danger' : 'warning')}>{d.l}</span>
                      </div>
                    </td>
                    <td>
                      {d.k === 'ok' ? (
                        <span style={{ fontSize: 11.5, color: 'var(--fg-faint)' }}>Entrada automática</span>
                      ) : dec ? (
                        <span style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <I.Check size={12} stroke={2.4} /> {dec}
                          <button onClick={() => setDecisions(x => { const y = { ...x }; delete y[r.sku]; return y; })} className="btn btn-ghost btn-sm">Desfazer</button>
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => set(r.sku, 'Contestado')} className="btn btn-outline btn-sm">Contestar</button>
                          <button onClick={() => set(r.sku, 'Aceito como está')} className="btn btn-ghost btn-sm">Aceitar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '12px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)', flex: 1, lineHeight: 1.5 }}>
              O que for contestado entra no estoque pelo preço do pedido e gera uma pendência com o fornecedor.
              O que for aceito vira o novo preço de custo.
            </span>
            <button className="btn btn-outline btn-sm">Salvar rascunho</button>
            <button onClick={() => navigate('/stock/history')} className="btn btn-primary btn-sm"
              disabled={decided < problems.length}
              style={{ opacity: decided < problems.length ? 0.5 : 1 }}>
              Dar entrada · {brl(correctTotal)}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 18 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Histórico com a TechDistrib</h4>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
              Terceira nota em 12 meses com preço acima do pedido no Carregador GaN. Nas duas anteriores a diferença
              foi aceita sem contestação, num total de {brl(1284)}.
            </p>
            <button onClick={() => navigate('/suppliers/detail')} className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>Ver fornecedor</button>
          </div>
          <div className="card" style={{ padding: 18 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Conferência sempre ligada</h4>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
              Toda nota lida por foto ou XML passa por esta comparação automaticamente quando existe pedido vinculado.
              Custa 2 créditos por nota.
            </p>
            <button onClick={() => navigate('/settings/notifications')} className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>Configurar avisos</button>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// ============================================================================
// 2 · /mobile/capture — cadastro por foto, em lote
//
// O problema real não é cadastrar UM produto: é cadastrar oitocentos. Por isso a
// interface é uma esteira — fotografa vários seguidos sem esperar resposta, a IA
// processa em segundo plano e a revisão acontece depois, em fila.
// ============================================================================
