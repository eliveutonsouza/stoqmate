"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { MovementNav } from '@/features/stock/movement-nav';
import { I } from '@/components/icons';
import { ProductThumb } from '@/components/ui/product-thumb';
import { CategoryBadge } from '@/components/ui/category-badge';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { TextInput } from '@/components/ui/text-input';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { SelectInput } from '@/components/ui/select-input';
import { TextareaInput } from '@/components/ui/textarea-input';
import { SummaryRow } from '@/components/ui/summary-row';

export function TransferReceive() {
  const navigate = useNavigate();
  const [lines, setLines] = React.useState([
    { sku: 'CAS-TOAL-BE-ALG', cat: 'casa', name: 'Jogo de Toalhas', attrs: { cor: 'Bege', material: 'Algodão' }, sent: 24, got: 24 },
    { sku: 'CAS-VASO-VE-CER', cat: 'casa', name: 'Vaso Decorativo', attrs: { cor: 'Verde', material: 'Cerâmica' }, sent: 12, got: 11 },
    { sku: 'ELE-CARR-PR-65W', cat: 'eletronicos', name: 'Carregador GaN 65W', attrs: { cor: 'Preto' }, sent: 18, got: 18 },
    { sku: 'VES-MOLE-CZ-G', cat: 'vestuario', name: 'Moletom Flanelado', attrs: { cor: 'Cinza', tamanho: 'G' }, sent: 30, got: 30 },
  ]);
  const setGot = (i, v) => setLines(ls => ls.map((l, j) => (j === i ? { ...l, got: v } : l)));

  const totalSent = lines.reduce((s, l) => s + l.sent, 0);
  const totalGot = lines.reduce((s, l) => s + l.got, 0);
  const diverging = lines.filter(l => l.got !== l.sent);
  const hasDivergence = diverging.length > 0;

  return (
    <StoreShell route="/stock/transfer/receive" breadcrumb={['Estoque', 'Receber transferência']} navigate={navigate}>
      <PageHeader
        title="Receber transferência"
        sub="TRF-124 · enviada por Loja Centro em 18/09 · 4 SKUs · 84 itens"
        actions={<button onClick={() => navigate('/stock/history')} className="btn btn-ghost btn-sm">Conferir depois</button>}
      />
      <Page>
        <MovementNav route="/stock/transfer" navigate={navigate} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 14px', background: 'var(--accent-soft)',
          border: '1px solid var(--accent)', borderRadius: 8, fontSize: 12,
        }}>
          <span style={{ color: 'var(--accent-text)', flexShrink: 0 }}><I.Swap size={15} /></span>
          <span style={{ color: 'var(--fg)', flex: 1, lineHeight: 1.5 }}>
            O saldo só entra em <strong>Loja Campinas</strong> depois desta conferência. Enquanto estiver pendente,
            os itens aparecem como <strong>em trânsito</strong> e não podem ser vendidos em nenhuma unidade.
          </span>
          <span className="badge badge-accent">Pendente há 6 h</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Conferência item a item</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Informe o que efetivamente chegou. Divergências ficam registradas nas duas unidades.</p>
                </div>
                <button onClick={() => setLines(ls => ls.map(l => ({ ...l, got: l.sent })))} className="btn btn-outline btn-sm">
                  <I.Check size={12} /> Conferir tudo como enviado
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Produto</th><th>Categoria</th><th>Variação</th>
                    <th className="num">Enviado</th><th style={{ width: 120 }}>Recebido</th><th className="num">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => {
                    const diff = l.got - l.sent;
                    return (
                      <tr key={l.sku}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <ProductThumb cat={l.cat} attrs={l.attrs} size={26} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</div>
                              <div style={{ fontSize: 10, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{l.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td><CategoryBadge cat={l.cat} /></td>
                        <td><AttrChip value={variantLabel(l.attrs)} /></td>
                        <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{l.sent}</td>
                        <td>
                          <TextInput mono type="number" value={l.got} onChange={(e) => setGot(i, +e.target.value || 0)} style={{ height: 28 }} />
                        </td>
                        <td className="num">
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: diff ? 600 : 400,
                            color: diff === 0 ? 'var(--success)' : diff < 0 ? 'var(--danger)' : 'var(--warning)',
                          }}>{diff === 0 ? 'OK' : (diff > 0 ? '+' : '') + diff}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasDivergence && (
              <FormCard title="Justificativa da divergência" desc="Obrigatória — abre uma ocorrência para a unidade de origem." cols={1}>
                <Field label="Motivo" required>
                  <SelectInput value="Item não localizado na caixa" onChange={() => {}}
                    options={['Item não localizado na caixa', 'Item danificado no transporte', 'Volume chegou aberto', 'Divergência na nota de envio', 'Item extra não listado']} />
                </Field>
                <Field label="Detalhamento" required hint="Descreva o estado do volume e o que foi conferido.">
                  <TextareaInput defaultValue="Caixa 2 de 3 chegou com fita rompida. Faltou 1 Vaso Decorativo Verde; demais itens conferidos e íntegros." style={{ minHeight: 72 }} />
                </Field>
                <Field label="Anexar foto do volume" hint="Ajuda na tratativa com a transportadora.">
                  <div style={{
                    border: '1.5px dashed var(--line-strong)', borderRadius: 8,
                    padding: '18px 16px', textAlign: 'center', background: 'var(--bg-sunken)', cursor: 'pointer',
                  }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>Arraste fotos aqui</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 3 }}>JPG ou PNG · até 5 por ocorrência</div>
                  </div>
                </Field>
              </FormCard>
            )}
          </div>

          <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', marginBottom: 10 }}>Resumo da conferência</div>
              <SummaryRow label="SKUs na remessa" value={`${lines.length}`} />
              <SummaryRow label="Itens enviados" value={`${totalSent}`} />
              <SummaryRow label="Itens recebidos" value={`${totalGot}`} />
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 8, paddingTop: 8 }}>
                <SummaryRow
                  label={hasDivergence ? `Divergência em ${diverging.length} SKU(s)` : 'Sem divergência'}
                  value={totalGot === totalSent ? 'OK' : (totalGot - totalSent > 0 ? '+' : '') + (totalGot - totalSent)}
                  strong tone={totalGot === totalSent ? 'success' : 'danger'}
                />
              </div>
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 6 }}>Loja Campinas (destino)</div>
                <SummaryRow label="Entra no saldo" value={`${totalGot} itens`} tone="success" />
                {hasDivergence && <SummaryRow label="Fica em aberto" value={`${totalSent - totalGot} itens`} tone="danger" />}
              </div>
            </div>

            <button onClick={() => navigate('/stock/history')} className="btn btn-primary btn-lg" style={{ justifyContent: 'center', width: '100%' }}>
              {hasDivergence ? 'Confirmar com divergência' : 'Confirmar recebimento'}
            </button>
            <button onClick={() => navigate('/stock')} className="btn btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>Cancelar</button>

            {hasDivergence && (
              <div style={{ padding: '11px 13px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 8, display: 'flex', gap: 10 }}>
                <span style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }}><I.Alert size={14} /></span>
                <div style={{ fontSize: 11, color: 'var(--fg)', lineHeight: 1.5 }}>
                  A origem recebe a ocorrência e precisa resolver os <strong>{totalSent - totalGot} itens</strong> em aberto —
                  por ajuste de inventário ou reenvio.
                </div>
              </div>
            )}
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /stock/count — batch inventory session ===
