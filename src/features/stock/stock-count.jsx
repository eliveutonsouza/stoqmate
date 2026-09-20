"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { MovementNav } from '@/features/stock/movement-nav';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { MOCK } from '@/lib/mock';
import { ProductThumb } from '@/components/ui/product-thumb';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { TextInput } from '@/components/ui/text-input';
import { brl } from '@/lib/format';
import { TextareaInput } from '@/components/ui/textarea-input';
import { SummaryRow } from '@/components/ui/summary-row';

export function StockCount() {
  const navigate = useNavigate();
  const [rows, setRows] = React.useState([
    { sku: 'ELE-FONE-PR-128', cat: 'eletronicos', name: 'Fone Bluetooth ANC', attrs: { cor: 'Preto', capacidade: '128 GB' }, system: 42, real: 40, cost: 158 },
    { sku: 'ELE-FONE-BR-128', cat: 'eletronicos', name: 'Fone Bluetooth ANC', attrs: { cor: 'Branco', capacidade: '128 GB' }, system: 28, real: 28, cost: 158 },
    { sku: 'ELE-CARR-PR-65W', cat: 'eletronicos', name: 'Carregador GaN 65W', attrs: { cor: 'Preto' }, system: 64, real: 66, cost: 92 },
    { sku: 'ELE-FONE-PR-256', cat: 'eletronicos', name: 'Fone Bluetooth ANC', attrs: { cor: 'Preto', capacidade: '256 GB' }, system: 26, real: null, cost: 198 },
    { sku: 'ELE-FONE-PR-64', cat: 'eletronicos', name: 'Fone Bluetooth ANC', attrs: { cor: 'Preto', capacidade: '64 GB' }, system: 18, real: null, cost: 128 },
  ]);
  const setReal = (i, v) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, real: v } : r)));

  const counted = rows.filter(r => r.real !== null);
  const diverging = counted.filter(r => r.real !== r.system);
  const netValue = diverging.reduce((s, r) => s + (r.real - r.system) * r.cost, 0);
  const progress = (counted.length / rows.length) * 100;

  return (
    <StoreShell route="/stock/count" breadcrumb={['Estoque', 'Contagem de inventário']} navigate={navigate}>
      <PageHeader
        title="Contagem de inventário"
        sub="INV-07 · local A-04 · aberta por Ana Ribeiro em 18/09 14:20"
        actions={(
          <>
            <button className="btn btn-outline btn-sm"><I.Download size={13} /> Exportar folha de contagem</button>
            <button className="btn btn-outline btn-sm">Salvar e pausar</button>
          </>
        )}
      />
      <Page>
        <MovementNav route="/stock/adjustment" navigate={navigate} />

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <FormCard title="Escopo da contagem" desc="Contar por local é mais rápido que por categoria — a equipe percorre a prateleira uma vez." cols={3}>
              <Field label="Local" span={1}>
                <SelectInput value="A-04" onChange={() => {}} options={['A-04', 'A-05', 'B-12', 'C-01', 'D-02', 'Todos os locais']} />
              </Field>
              <Field label="Categoria" span={1} hint="Opcional, para fatiar a contagem.">
                <SelectInput value="Eletrônicos" onChange={() => {}} options={['Todas', ...MOCK.categories.map(c => c.name)]} />
              </Field>
              <Field label="Responsável" span={1}>
                <SelectInput value="Ana Ribeiro" onChange={() => {}} options={['Ana Ribeiro', 'Mariana Souza', 'Roberto Lima', 'Lucas Prado']} />
              </Field>
            </FormCard>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Folha de contagem</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                      {counted.length} de {rows.length} SKUs contados. Deixe em branco o que ainda não foi conferido.
                    </p>
                  </div>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)' }}>{progress.toFixed(0)}%</span>
                </div>
                <div style={{ height: 5, background: 'var(--bg-sunken)', borderRadius: 3 }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: 3, transition: 'width 120ms ease' }}></div>
                </div>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Produto</th><th>Variação</th>
                    <th className="num">Sistema</th><th style={{ width: 110 }}>Contagem</th>
                    <th className="num">Diferença</th><th className="num">Impacto</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const done = r.real !== null;
                    const diff = done ? r.real - r.system : 0;
                    return (
                      <tr key={r.sku} style={{ opacity: done ? 1 : 0.65 }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ProductThumb cat={r.cat} attrs={r.attrs} size={26} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{r.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td><AttrChip value={variantLabel(r.attrs)} /></td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.system}</td>
                        <td>
                          <TextInput mono type="number" value={r.real ?? ''} placeholder="—"
                            onChange={(e) => setReal(i, e.target.value === '' ? null : +e.target.value)} style={{ height: 28 }} />
                        </td>
                        <td className="num">
                          {!done ? <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>—</span> : (
                            <span style={{
                              fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: diff ? 600 : 400,
                              color: diff === 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--warning)',
                            }}>{diff === 0 ? 'OK' : (diff > 0 ? '+' : '') + diff}</span>
                          )}
                        </td>
                        <td className="num" style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12,
                          color: !done || diff === 0 ? 'var(--fg-muted)' : diff < 0 ? 'var(--danger)' : 'var(--fg)',
                        }}>{!done || diff === 0 ? '—' : (diff < 0 ? '−' : '+') + brl(Math.abs(diff * r.cost)).replace('R$ ', 'R$ ')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--fg-muted)', flex: 1 }}>62 SKUs no local A-04 · mostrando os 5 primeiros</span>
                <button className="btn btn-ghost btn-sm">Carregar mais</button>
              </div>
            </div>

            {diverging.length > 0 && (
              <FormCard title="Justificativa" desc="Uma justificativa cobre toda a sessão. Divergências individuais podem receber nota própria." cols={1}>
                <Field label="Motivo predominante" required>
                  <SelectInput value="Erro de lançamento anterior" onChange={() => {}}
                    options={['Erro de lançamento anterior', 'Furto / extravio', 'Item danificado descartado', 'Venda não registrada', 'Transferência não confirmada']} />
                </Field>
                <Field label="Detalhamento" required>
                  <TextareaInput defaultValue="Contagem completa da prateleira A-04 com dois conferentes. Duas unidades de 128 GB não localizadas; duas unidades de carregador encontradas fora da posição, provavelmente não baixadas de uma transferência." style={{ minHeight: 72 }} />
                </Field>
              </FormCard>
            )}
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resultado da sessão</div>
              <SummaryRow label="SKUs no escopo" value={`${rows.length}`} />
              <SummaryRow label="Contados" value={`${counted.length}`} />
              <SummaryRow label="Pendentes" value={`${rows.length - counted.length}`} tone={rows.length - counted.length ? 'warning' : undefined} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow label="Com divergência" value={`${diverging.length}`} tone={diverging.length ? 'danger' : 'success'} />
              </div>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                <SummaryRow
                  label={netValue < 0 ? 'Perda líquida' : netValue > 0 ? 'Sobra líquida' : 'Impacto financeiro'}
                  value={brl(Math.abs(netValue))} strong
                  tone={netValue < 0 ? 'danger' : netValue > 0 ? 'warning' : 'success'}
                />
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 6, lineHeight: 1.5 }}>
                  Calculado pelo preço de compra de cada SKU.
                </div>
              </div>
            </div>

            <button onClick={() => navigate('/stock/history')} className="btn btn-primary btn-lg"
              disabled={counted.length === 0} style={{ justifyContent: 'center', width: '100%', opacity: counted.length ? 1 : 0.45 }}>
              Fechar contagem e ajustar
            </button>
            <button onClick={() => navigate('/stock')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Cancelar sessão</button>

            <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', gap: 10 }}>
              <span style={{ color: 'var(--fg-muted)', flexShrink: 0, marginTop: 1 }}><I.QR size={14} /></span>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Contando com leitor? Bipe o código de barras e a linha correspondente recebe foco — a contagem sobe de 1 em 1.
              </div>
            </div>
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /stock/movement — movement detail ===
