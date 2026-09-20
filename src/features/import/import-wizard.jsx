"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { IMPORT_COLUMNS } from '@/features/import/import-columns';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { I } from '@/components/icons';
import { FormCard } from '@/components/ui/form-card';
import { SelectInput } from '@/components/ui/select-input';
import { TARGET_OPTIONS } from '@/features/import/target-options';
import { Field } from '@/components/ui/field';
import { MOCK } from '@/lib/mock';
import { CATALOG } from '@/lib/catalog';
import { ProductThumb } from '@/components/ui/product-thumb';
import { CategoryBadge } from '@/components/ui/category-badge';
import { AttrChip } from '@/components/ui/attr-chip';
import { variantLabel } from '@/lib/attr-colors';
import { brl } from '@/lib/format';

export function ImportWizard() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [file, setFile] = React.useState(null);
  const [cols, setCols] = React.useState(IMPORT_COLUMNS);
  const [onDup, setOnDup] = React.useState('update');

  const setTarget = (i, v) => setCols(cs => cs.map((c, j) => (j === i ? { ...c, target: v } : c)));
  const mapped = cols.filter(c => c.target !== 'ignore').length;
  const missingRequired = ['name', 'brand', 'category', 'purchase', 'sale']
    .filter(t => !cols.some(c => c.target === t));

  const steps = [
    { n: 1, label: 'Arquivo' },
    { n: 2, label: 'Mapear colunas' },
    { n: 3, label: 'Revisar' },
    { n: 4, label: 'Resultado' },
  ];

  const canAdvance = step === 1 ? !!file : step === 2 ? missingRequired.length === 0 : true;

  return (
    <StoreShell route="/products/import" breadcrumb={['Catálogo', 'Importar']} navigate={navigate}>
      <PageHeader
        title="Importar catálogo"
        sub="Traga seus produtos de uma planilha. Nada é gravado até a confirmação final."
        actions={<button onClick={() => navigate('/products')} className="btn btn-ghost btn-sm">Sair do assistente</button>}
      />
      <Page width={960}>
        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '2px 0 6px' }}>
          {steps.map((s, i) => {
            const state = s.n < step ? 'done' : s.n === step ? 'current' : 'todo';
            return (
              <React.Fragment key={s.n}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                    background: state === 'done' ? 'var(--accent-strong)' : state === 'current' ? 'var(--bg-elev)' : 'transparent',
                    color: state === 'done' ? '#fff' : state === 'current' ? 'var(--fg)' : 'var(--fg-muted)',
                    border: '1px solid ' + (state === 'todo' ? 'var(--line-strong)' : 'var(--accent)'),
                    boxShadow: state === 'current' ? '0 0 0 3px var(--accent-soft)' : 'none',
                    flexShrink: 0,
                  }}>{state === 'done' ? <I.Check size={11} stroke={3} /> : s.n}</div>
                  <span style={{
                    fontSize: 12.5, fontWeight: state === 'current' ? 500 : 400,
                    color: state === 'todo' ? 'var(--fg-muted)' : 'var(--fg)', whiteSpace: 'nowrap',
                  }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: s.n < step ? 'var(--accent)' : 'var(--line)', margin: '0 14px' }}></div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {step === 1 && (
          <>
            <FormCard title="Arquivo de origem" desc="XLSX, XLS ou CSV até 10 MB. A primeira linha deve conter os nomes das colunas." cols={1}>
              {!file ? (
                <div onClick={() => setFile({ name: 'catalogo-bonsucesso.xlsx', rows: 1284, cols: 11, size: '412 KB' })} style={{
                  border: '1.5px dashed var(--line-strong)', borderRadius: 10,
                  padding: '40px 24px', textAlign: 'center', background: 'var(--bg-sunken)', cursor: 'pointer',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 9, margin: '0 auto 14px',
                    background: 'var(--bg-elev)', border: '1px solid var(--line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)',
                  }}><I.Download size={18} style={{ transform: 'rotate(180deg)' }} /></div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Arraste a planilha aqui</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 5 }}>
                    ou <span style={{ color: 'var(--accent-text)', fontWeight: 500 }}>escolha do computador</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 14, fontFamily: 'var(--font-mono)' }}>
                    XLSX · XLS · CSV · até 10 MB
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 14, border: '1px solid var(--line)', borderRadius: 9, background: 'var(--bg-elev)' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                    background: 'var(--success-soft)', color: 'var(--success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><I.Check size={19} stroke={2.4} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{file.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                      {file.rows.toLocaleString('pt-BR')} linhas · {file.cols} colunas · {file.size}
                    </div>
                  </div>
                  <button onClick={() => setFile(null)} className="btn btn-outline btn-sm">Trocar arquivo</button>
                </div>
              )}
            </FormCard>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>Não tem uma planilha pronta?</div>
                <p style={{ margin: '6px 0 12px', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                  Baixe o modelo com as colunas na ordem que o sistema espera, já com exemplos nas suas categorias.
                </p>
                <button className="btn btn-outline btn-sm"><I.Download size={12} /> Baixar modelo XLSX</button>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>Vindo de outro sistema?</div>
                <p style={{ margin: '6px 0 12px', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                  Temos mapeamentos prontos para exportações de Bling, Tiny e Omie — as colunas já vêm reconhecidas.
                </p>
                <SelectInput value="Detectar automaticamente" onChange={() => {}} options={['Detectar automaticamente', 'Bling', 'Tiny ERP', 'Omie', 'Planilha própria']} />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {missingRequired.length > 0 && (
              <div style={{
                display: 'flex', gap: 11, alignItems: 'center',
                padding: '11px 14px', background: 'var(--warning-soft)',
                border: '1px solid var(--warning)', borderRadius: 8,
              }}>
                <span style={{ color: 'var(--warning)', flexShrink: 0 }}><I.Alert size={15} /></span>
                <div style={{ fontSize: 12, color: 'var(--fg)', flex: 1, lineHeight: 1.5 }}>
                  Faltam campos obrigatórios: <strong>{missingRequired.join(', ')}</strong>. Aponte uma coluna do arquivo para cada um.
                </div>
              </div>
            )}

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Mapear colunas</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                    {mapped} de {cols.length} colunas serão importadas. As de atributo devem casar com o esquema da categoria.
                  </p>
                </div>
                <span className="badge badge-success"><I.Sparkle size={10} /> 9 reconhecidas automaticamente</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Coluna no arquivo</th>
                    <th style={{ width: '24%' }}>Exemplo da 1ª linha</th>
                    <th style={{ width: 40 }}></th>
                    <th>Campo no Stoqmate</th>
                  </tr>
                </thead>
                <tbody>
                  {cols.map((c, i) => (
                    <tr key={c.src} style={{ opacity: c.target === 'ignore' ? 0.55 : 1 }}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{c.src}</td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{c.sample}</td>
                      <td style={{ color: 'var(--fg-muted)' }}><I.ArrowRight size={13} /></td>
                      <td>
                        <SelectInput value={c.target} onChange={(v) => setTarget(i, v)} options={TARGET_OPTIONS} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <FormCard title="Regras da importação" cols={2}>
              <Field label="Quando o SKU já existir" span={1} hint="Comparado pelo SKU ou pelo código de barras.">
                <SelectInput value={onDup} onChange={setOnDup} options={[
                  { value: 'update', label: 'Atualizar preços e dados' },
                  { value: 'skip', label: 'Ignorar a linha' },
                  { value: 'fail', label: 'Interromper a importação' },
                ]} />
              </Field>
              <Field label="Categoria não cadastrada" span={1} hint="Categorias novas entram com esquema vazio.">
                <SelectInput value="create" onChange={() => {}} options={[
                  { value: 'create', label: 'Criar a categoria automaticamente' },
                  { value: 'skip', label: 'Ignorar linhas com categoria nova' },
                ]} />
              </Field>
              <Field label="Saldo inicial" span={1} hint="Gera uma movimentação de entrada rastreável.">
                <SelectInput value="entry" onChange={() => {}} options={[
                  { value: 'entry', label: 'Lançar como entrada de inventário' },
                  { value: 'raw', label: 'Gravar saldo sem movimentação' },
                  { value: 'zero', label: 'Importar com saldo zero' },
                ]} />
              </Field>
              <Field label="Unidade de destino" span={1}>
                <SelectInput value="Loja Centro" onChange={() => {}} options={MOCK.store.siblings.map(s => s.name)} />
              </Field>
            </FormCard>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
              {[
                { l: 'Linhas no arquivo', v: '1.284' },
                { l: 'Produtos novos', v: '1.196', tone: 'success' },
                { l: 'SKUs já existentes', v: '74', s: 'serão atualizados' },
                { l: 'Linhas com erro', v: '14', tone: 'danger', s: 'serão ignoradas' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '16px 18px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{
                    fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4,
                    color: m.tone === 'success' ? 'var(--success)' : m.tone === 'danger' ? 'var(--danger)' : 'var(--fg)',
                  }}>{m.v}</div>
                  {m.s && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>}
                </div>
              ))}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Linhas com erro</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>
                  Corrija na planilha e reimporte só essas linhas, ou siga sem elas.
                </p>
              </div>
              <table className="table">
                <thead>
                  <tr><th style={{ width: 60 }}>Linha</th><th>Produto</th><th>Problema</th><th>Campo</th></tr>
                </thead>
                <tbody>
                  {[
                    [18, 'Carregador GaN 65W', 'Preço de venda menor que o de compra', 'preco_venda'],
                    [42, 'Camiseta Algodão Pima', 'Tamanho "XXG" não existe no esquema de Vestuário', 'cor_produto'],
                    [107, '(vazio)', 'Nome do produto em branco', 'descricao'],
                    [233, 'Vaso Decorativo', 'Categoria "Utilidades" não cadastrada', 'linha'],
                    [418, 'Café em Grãos', 'Custo não numérico: "a combinar"', 'custo'],
                    [902, 'Fone Bluetooth ANC', 'SKU duplicado dentro do próprio arquivo', 'codigo'],
                  ].map(([ln, name, issue, field]) => (
                    <tr key={ln}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{ln}</td>
                      <td style={{ fontSize: 13 }}>{name}</td>
                      <td style={{ fontSize: 12, color: 'var(--danger)' }}>{issue}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{field}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>+8 outras linhas com erro</span>
                <button className="btn btn-outline btn-sm"><I.Download size={12} /> Baixar relatório de erros</button>
              </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Pré-visualização</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Primeiras linhas como ficarão no catálogo, com o SKU já gerado.</p>
              </div>
              <table className="table">
                <thead>
                  <tr><th>SKU</th><th>Produto</th><th>Categoria</th><th>Variação</th><th className="num">Compra</th><th className="num">Venda</th><th className="num">Saldo</th></tr>
                </thead>
                <tbody>
                  {CATALOG.slice(0, 6).map(p => (
                    <tr key={p.sku}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{p.sku}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ProductThumb cat={p.cat} brand={p.brand} attrs={p.attrs} size={24} />
                          <span style={{ fontSize: 13 }}>{p.name}</span>
                        </div>
                      </td>
                      <td><CategoryBadge cat={p.cat} /></td>
                      <td><AttrChip value={variantLabel(p.attrs)} /></td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{brl(p.sale * 0.55)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{brl(p.sale)}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 0 8px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, marginBottom: 20,
              background: 'var(--success-soft)', color: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><I.Check size={24} stroke={2.4} /></div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em' }}>1.270 produtos importados</h2>
            <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--fg-muted)', maxWidth: 460, lineHeight: 1.55 }}>
              1.196 produtos novos e 74 atualizados em Loja Centro. As 14 linhas com erro foram ignoradas e estão no relatório.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 28, width: '100%', maxWidth: 620 }}>
              {[['Produtos novos', '1.196'], ['Atualizados', '74'], ['Categorias criadas', '2']].map(([k, v]) => (
                <div key={k} className="card" style={{ padding: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{k}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
              <button onClick={() => navigate('/products')} className="btn btn-primary btn-lg">
                Ver catálogo <I.ArrowRight size={14} />
              </button>
              <button onClick={() => navigate('/categories')} className="btn btn-outline btn-lg">Revisar categorias criadas</button>
              <button className="btn btn-ghost btn-lg"><I.Download size={13} /> Relatório de erros</button>
            </div>
          </div>
        )}

        {/* Wizard nav */}
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
            <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/products')} className="btn btn-ghost">
              <I.ChevronLeft size={13} /> Voltar
            </button>
            <div style={{ flex: 1 }}></div>
            {step === 3 && <span style={{ fontSize: 12, color: 'var(--fg-muted)', marginRight: 4 }}>1.270 linhas serão gravadas</span>}
            <button onClick={() => canAdvance && setStep(step + 1)} className="btn btn-primary btn-lg" disabled={!canAdvance}
              style={{ opacity: canAdvance ? 1 : 0.45, cursor: canAdvance ? 'pointer' : 'not-allowed' }}>
              {step === 3 ? 'Confirmar importação' : 'Continuar'} <I.ArrowRight size={13} />
            </button>
          </div>
        )}
      </Page>
    </StoreShell>
  );
}
