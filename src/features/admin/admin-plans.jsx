"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { INSTALLED_BASE, PLANS, PLATFORM } from '@/lib/plans';
import { AdminShell } from '@/components/ui/admin-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { PlanBadge } from '@/components/domain/plan-badge';
import { brl } from '@/lib/format';
import { Modal } from '@/components/ui/modal';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { TextareaInput } from '@/components/ui/textarea-input';

export function AdminPlans() {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = React.useState(false);
  // Preço, ciclo anual, cota e limites vêm de plans.js — esta tela mostra o
  // catálogo, nunca uma segunda tabela de preço. Só a base instalada é daqui.
  const base = Object.fromEntries(INSTALLED_BASE.map(b => [b.id, b]));
  const plans = PLANS.map(p => ({
    name: p.name, badge: p.name, monthly: p.monthly, yearly: p.yearly, credits: p.credits,
    skus: p.limits.skus, users: p.limits.users, stores: p.limits.stores, cats: p.limits.cats,
    nets: base[p.id].nets, units: base[p.id].units, mrr: base[p.id].units * p.monthly, active: true,
  })).concat([{
    name: 'Starter legado (2024)', badge: 'Balcão', monthly: 29, yearly: null, credits: 0,
    skus: 100, users: 2, stores: 1, cats: 1, nets: 0, units: 0, mrr: 0, active: false,
  }]);
  return (
    <AdminShell route="/admin/plans" breadcrumb={['Planos']} navigate={navigate}>
      <PageHeader
        title="Planos"
        sub={`3 planos ativos · 1 descontinuado · ${PLATFORM.nets} redes · ${PLATFORM.units} lojas · ${PLATFORM.fmt(PLATFORM.mrr)} de MRR`}
        actions={<button onClick={() => navigate('/admin/plans/new')} className="btn btn-primary btn-sm"><I.Plus size={13} /> Criar plano</button>}
      />
      <Page>
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Plano</th>
                <th className="num">Mensal/loja</th><th className="num">Anual/loja</th><th className="num">Créditos</th>
                <th className="num">SKUs</th><th className="num">Usuários</th><th className="num">Lojas</th><th className="num">Categorias</th>
                <th className="num">Redes</th><th className="num">Lojas cobradas</th><th className="num">MRR</th>
                <th>Status</th><th style={{ width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p, i) => (
                <tr key={i} style={{ opacity: p.active ? 1 : 0.55 }}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><PlanBadge plan={p.badge} /><a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/plans/edit'); }} style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</a></div></td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(p.monthly)}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{p.yearly ? brl(p.yearly) : '—'}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.credits ? p.credits.toLocaleString('pt-BR') : '—'}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.skus ?? '∞'}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.users ?? '∞'}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.stores ?? '∞'}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.cats ?? '∞'}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 }}>{p.nets}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.units}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>R$ {p.mrr.toLocaleString('pt-BR')}</td>
                  <td>{p.active ? <span className="badge badge-success"><span className="badge-dot"></span> Ativo</span> : <span className="badge">Descontinuado</span>}</td>
                  <td><button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>MRR por plano</h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: 'var(--fg-muted)' }}>O Controle sustenta metade da receita recorrente.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {plans.filter(p => p.active).map((p, i) => (
                <div key={p.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>R$ {p.mrr.toLocaleString('pt-BR')} · {((p.mrr / 111030) * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                    <div style={{ width: `${(p.mrr / 60520) * 100}%`, height: '100%', background: i === 1 ? 'var(--accent)' : 'var(--fg-faint)', borderRadius: 3 }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--density-card-pad)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Movimentação entre planos · 90 dias</h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: 'var(--fg-muted)' }}>Upgrades superam downgrades em 4 para 1.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Balcão → Controle', 18, 'up'], ['Controle → Rede', 6, 'up'],
                ['Balcão → Rede', 2, 'up'], ['Controle → Balcão', 4, 'down'],
                ['Rede → Controle', 2, 'down'], ['Cancelamentos', 7, 'down'],
              ].map(([l, n, dir]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ color: dir === 'up' ? 'var(--success)' : 'var(--danger)', display: 'flex' }}>
                    {dir === 'up' ? <I.ArrowUp size={13} /> : <I.ArrowDown size={13} />}
                  </span>
                  <span style={{ fontSize: 12, flex: 1 }}>{l}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 500, color: dir === 'up' ? 'var(--success)' : 'var(--danger)' }}>
                    {dir === 'up' ? '+' : '−'}{n}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Page>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Criar plano" desc="Limites em branco significam ilimitado." width={520}
        footer={<><button onClick={() => setEditOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={() => setEditOpen(false)} className="btn btn-primary">Criar plano</button></>}>
        <Field label="Nome do plano" required><TextInput placeholder="Enterprise" /></Field>
        <Field label="Descrição"><TextareaInput placeholder="Para redes com mais de 20 lojas e necessidade de SLA." /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Preço mensal" required><TextInput mono prefix="R$" placeholder="299,00" /></Field>
          <Field label="Preço anual" hint="Deixe vazio para não oferecer."><TextInput mono prefix="R$" placeholder="2.990,00" /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Máx. SKUs" hint="Vazio = ilimitado"><TextInput mono placeholder="∞" /></Field>
          <Field label="Máx. usuários" required><TextInput mono placeholder="25" /></Field>
          <Field label="Máx. lojas" hint="Vazio = ilimitado"><TextInput mono placeholder="∞" /></Field>
          <Field label="Máx. categorias" hint="Vazio = ilimitado"><TextInput mono placeholder="∞" /></Field>
        </div>
        <Field label="Recursos inclusos">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {['Relatórios financeiros', 'Transferência entre lojas', 'Previsão de demanda por IA', 'API de integração', 'CSM dedicado', 'SLA de 4 h'].map((f, i) => (
              <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                <input type="checkbox" defaultChecked={i < 4} /> {f}
              </label>
            ))}
          </div>
        </Field>
      </Modal>
    </AdminShell>
  );
}

// === Subscriptions ===
