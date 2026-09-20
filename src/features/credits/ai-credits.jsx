"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { CREDIT_STATE } from '@/features/credits/credit-state';
import { AI_OPS, CREDIT_PACKS } from '@/lib/plans';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { subPlan } from '@/features/billing/billing-state';
import { I } from '@/components/icons';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { CreditMeter } from '@/components/domain/credit-meter';
import { brl } from '@/lib/format';
import { Modal } from '@/components/ui/modal';

export function AICredits() {
  const navigate = useNavigate();
  const [packOpen, setPackOpen] = React.useState(false);
  const [pack, setPack] = React.useState(1);
  const c = CREDIT_STATE;
  const left = c.quota - c.usedQuota + (c.pack - c.usedPack);
  const pace = Math.round((c.usedQuota / c.day) * c.days);
  const consumption = [
    { op: 'ocr', n: 62 }, { op: 'anomaly', n: 18 }, { op: 'forecast', n: 74 },
    { op: 'enrich', n: 120 }, { op: 'ask', n: 96 }, { op: 'classify', n: 88 },
  ].map(x => { const o = AI_OPS.find(a => a.id === x.op); return { ...o, runs: x.n, spent: o.credits * x.n }; })
   .sort((a, b) => b.spent - a.spent);
  const maxSpent = Math.max(...consumption.map(x => x.spent));

  return (
    <StoreShell route="/settings/credits" breadcrumb={['Configurações', 'Créditos de IA']} navigate={navigate}>
      <PageHeader
        title="Créditos de IA"
        sub={`Plano ${subPlan().name} · a cota renova em 01 de outubro`}
        actions={<><button onClick={() => navigate('/ai')} className="btn btn-outline btn-sm">Central de IA</button><button onClick={() => setPackOpen(true)} className="btn btn-primary btn-sm"><I.Plus size={13} /> Comprar créditos</button></>}
      />
      <SettingsLayout route="/settings/credits" navigate={navigate}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>Disponível neste ciclo</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.035em' }}>{left}</span>
                <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>de {(c.quota + c.pack).toLocaleString('pt-BR')} créditos</span>
              </div>
            </div>
            <span className="badge badge-warning">Ritmo projeta {pace} de {c.quota} na cota</span>
          </div>
          <CreditMeter used={c.usedQuota + c.usedPack} total={c.quota + c.pack} height={10} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            {[
              ['Cota do plano', `${c.usedQuota} / ${c.quota}`, 'zera em 01 out'],
              ['Pacote adicional', `${c.pack - c.usedPack} / ${c.pack}`, 'não expira'],
              ['Custo evitado', brl(3280), 'ruptura e retrabalho no mês'],
            ].map(([l, v, s]) => (
              <div key={l}>
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>{l}</div>
                <div style={{ fontSize: 17, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', marginTop: 3 }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-soft)', marginTop: 2 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Onde os créditos foram</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Setembro até o dia {c.day}. Cada operação pesa o que custa.</p>
          </div>
          <div style={{ padding: '6px 18px 14px' }}>
            {consumption.map((x, i) => (
              <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: i < consumption.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                <div style={{ width: 210, flexShrink: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{x.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 1 }}>{x.runs} usos × {x.credits} {x.credits === 1 ? 'crédito' : 'créditos'}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}><CreditMeter used={x.spent} total={maxSpent} height={6} /></div>
                <div style={{ width: 62, textAlign: 'right', fontSize: 12.5, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{x.spent}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '11px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
            A leitura de nota fiscal é o maior consumo. Notas em XML não gastam crédito nenhum — se o fornecedor mandar o arquivo, importe por lá.
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Limites de segurança</div>
          <p style={{ margin: '4px 0 14px', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>Impede que um lote grande consuma o mês inteiro sem você perceber.</p>
          {[
            ['Avisar em 80% da cota', 'Notificação no app e email para o dono da conta.', true],
            ['Pausar IA ao acabar a cota', 'Nunca cobramos excedente automático. Desligado, usa o pacote adicional.', true],
            ['Teto por operação em lote', 'Enriquecimento e previsão param em 200 créditos por execução.', true],
            ['Exigir confirmação acima de 50 créditos', 'Pede um segundo clique antes de rodar.', false],
          ].map(([t, d, on], i, arr) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{t}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2, lineHeight: 1.45 }}>{d}</div>
              </div>
              <span style={{ width: 34, height: 19, borderRadius: 10, background: on ? 'var(--accent-strong)' : 'var(--bg-sunken)', border: '1px solid ' + (on ? 'var(--accent-strong)' : 'var(--line-strong)'), position: 'relative', flexShrink: 0 }}>
                <span style={{ position: 'absolute', top: 2, left: on ? 17 : 2, width: 13, height: 13, borderRadius: '50%', background: on ? '#fff' : 'var(--fg-soft)' }}></span>
              </span>
            </div>
          ))}
        </div>
      </SettingsLayout>

      <Modal open={packOpen} onClose={() => setPackOpen(false)} title="Comprar créditos avulsos" desc="Créditos de pacote não expiram e só são usados depois que a cota do mês acaba." width={520}
        footer={<><button onClick={() => setPackOpen(false)} className="btn btn-ghost">Cancelar</button><button onClick={() => setPackOpen(false)} className="btn btn-primary">Comprar · {brl(CREDIT_PACKS[pack].price)}</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CREDIT_PACKS.map((p, i) => (
            <button key={i} onClick={() => setPack(i)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, width: '100%', textAlign: 'left',
              border: '1px solid ' + (pack === i ? 'var(--accent)' : 'var(--line)'),
              background: pack === i ? 'var(--accent-soft)' : 'var(--bg-elev)',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--fg)' }}>{p.credits.toLocaleString('pt-BR')} créditos</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2 }}>
                  ≈ {Math.floor(p.credits / 5)} notas fiscais ou {p.credits} perguntas em linguagem natural
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{brl(p.price)}</div>
                <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{brl(p.price / p.credits).replace('R$ ', 'R$ ')}/crédito</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
          Usa pacote todo mês? Subir para o <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>Rede</strong> sai mais barato que dois pacotes de 500.{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); setPackOpen(false); navigate('/settings/subscription/change'); }}>Comparar</a>.
        </div>
      </Modal>
    </StoreShell>
  );
}

// === /ai/credits-empty — a IA pausou, o sistema não ===
