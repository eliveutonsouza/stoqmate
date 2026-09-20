"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { SUB, subPlan, subTotal } from '@/features/billing/billing-state';
import { CREDIT_STATE } from '@/features/credits/credit-state';
import { ANNUAL, PLANS, annualSavings } from '@/lib/plans';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { brl } from '@/lib/format';
import { I } from '@/components/icons';
import { CreditMeter } from '@/components/domain/credit-meter';

export function SettingsSubscription() {
  const navigate = useNavigate();
  const p = subPlan();
  const total = subTotal();
  const c = CREDIT_STATE;
  const invoices = [
    { date: '01 set 2026', plan: `${p.name} · mensal · ${SUB.units} lojas`, value: total + 49, status: 'paid', nf: 'NFS-e 4821' },
    { date: '01 ago 2026', plan: `${p.name} · mensal · ${SUB.units} lojas`, value: total, status: 'paid', nf: 'NFS-e 4612' },
    { date: '01 jul 2026', plan: `${p.name} · mensal · 2 lojas`, value: p.monthly * 2, status: 'paid', nf: 'NFS-e 4398' },
    { date: '01 jun 2026', plan: `${p.name} · mensal · 2 lojas`, value: p.monthly * 2, status: 'paid', nf: 'NFS-e 4187' },
    { date: '01 mai 2026', plan: 'Balcão · mensal · 1 loja', value: PLANS[0].monthly, status: 'paid', nf: 'NFS-e 3964' },
  ];
  const usage = [
    { l: 'SKUs cadastrados', used: 1688, limit: p.limits.skus },
    { l: 'Usuários', used: 6, limit: p.limits.users },
    { l: 'Lojas ativas', used: SUB.units, limit: p.limits.stores },
    { l: 'Histórico guardado', used: 24, limit: 24, suffix: 'meses' },
  ];

  return (
    <StoreShell route="/settings/subscription" breadcrumb={['Configurações', 'Assinatura']} navigate={navigate}>
      <PageHeader title="Plano e assinatura" sub="O que você paga, o que já usou e como sair quando quiser." />
      <SettingsLayout route="/settings/subscription" navigate={navigate}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>Plano {p.name}</span>
                <span className="badge badge-success"><span className="badge-dot"></span> Ativa</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>
                {brl(p.monthly)} por loja × {SUB.units} lojas = <strong style={{ color: 'var(--fg)', fontWeight: 600 }}>{brl(total)}</strong> por mês ·
                próxima em {SUB.nextCharge} · {SUB.card}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/settings/billing')} className="btn btn-outline btn-sm">Cobrança</button>
              <button onClick={() => navigate('/settings/subscription/change')} className="btn btn-primary btn-sm">Trocar de plano</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            {usage.map(u => {
              const pct = u.limit ? (u.used / u.limit) * 100 : null;
              return (
                <div key={u.l}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{u.l}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{u.used}</span>
                    <span style={{ fontSize: 12, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)' }}>/ {u.limit ?? '∞'} {u.suffix || ''}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-sunken)', borderRadius: 2, marginTop: 7 }}>
                    <div style={{
                      width: pct !== null ? `${Math.min(pct, 100)}%` : '100%', height: '100%',
                      background: pct !== null && pct >= 100 ? 'var(--warning)' : 'var(--accent)',
                      borderRadius: 2, opacity: pct === null ? 0.3 : 1,
                    }}></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--fg-muted)' }}>
            Você está no teto de lojas do {p.name}. Uma quarta unidade exige o plano Rede.{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/limit-reached'); }}>Ver o que muda</a>.
          </div>
        </div>

        <div className="card" style={{ padding: 18, borderColor: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Mude para o anual e economize {brl(annualSavings(p, SUB.units).save)} por ano</span>
              <span className="badge badge-accent">{ANNUAL.freeMonths} meses grátis</span>
            </div>
            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
              {brl(annualSavings(p, SUB.units).yearly)} por ano em vez de {brl(annualSavings(p, SUB.units).monthly)} · preço travado por 12 meses · créditos de IA acumulam entre os meses.
            </p>
          </div>
          <button onClick={() => navigate('/settings/subscription/annual')} className="btn btn-primary btn-sm">Ver economia</button>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--accent-text)', display: 'flex' }}><I.Sparkle size={15} /></span>
                <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Créditos de IA</span>
              </div>
              <p style={{ margin: '5px 0 0', fontSize: 12.5, color: 'var(--fg-muted)' }}>
                {c.usedQuota} de {c.quota} da cota usados · {c.pack - c.usedPack} de pacote adicional · renova em 01 de outubro.
              </p>
            </div>
            <button onClick={() => navigate('/settings/credits')} className="btn btn-outline btn-sm">Ver consumo</button>
          </div>
          <div style={{ marginTop: 12 }}><CreditMeter used={c.usedQuota} total={c.quota} /></div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Histórico de faturas</h3>
            <button className="btn btn-outline btn-sm"><I.Download size={12} /> Baixar todas</button>
          </div>
          <table className="table">
            <thead>
              <tr><th>Data</th><th>Descrição</th><th>Nota fiscal</th><th className="num">Valor</th><th>Status</th><th style={{ width: 80 }}></th></tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={i} onClick={() => navigate('/settings/subscription/invoice')} style={{ cursor: 'pointer' }}>
                  <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{inv.date}</td>
                  <td style={{ fontSize: 13 }}>{inv.plan}</td>
                  <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{inv.nf}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(inv.value)}</td>
                  <td><span className="badge badge-success">Pago</span></td>
                  <td><button className="btn btn-ghost btn-sm">Abrir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Cancelar assinatura</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3 }}>
              Sem multa e sem ligação. O acesso continua até {SUB.nextCharge} e os dados ficam exportáveis por 90 dias.
            </div>
          </div>
          <button onClick={() => navigate('/settings/subscription/cancel')} className="btn btn-outline btn-sm">Cancelar assinatura</button>
        </div>
      </SettingsLayout>
    </StoreShell>
  );
}
