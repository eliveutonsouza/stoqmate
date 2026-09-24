"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Page } from '@/components/ui/page-container';
import { I } from '@/components/icons';
import { FormCard } from '@/components/ui/form-card';
import { SelectInput } from '@/components/ui/select-input';
import { Field } from '@/components/ui/field';
import { parseCsv, buildTemplateCsv, IMPORT_TEMPLATE_HEADERS } from '@/features/import/csv';
import { checkExistingSkusAction, bulkImportProductsAction } from '@/features/import/actions';

function downloadTemplate() {
  const blob = new Blob([buildTemplateCsv()], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'modelo-importacao-stoqmate.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function validateRow(r, categoryCodes, seenSkus) {
  if (!r.sku) return 'SKU em branco';
  if (seenSkus.has(r.sku)) return 'SKU duplicado dentro do próprio arquivo';
  if (!r.category_code || !categoryCodes.has(r.category_code.toUpperCase())) return `categoria "${r.category_code}" não encontrada`;
  if (!r.name) return 'Nome em branco';
  if (!r.sale_price || isNaN(parseFloat(r.sale_price)) || parseFloat(r.sale_price) <= 0) return 'Preço de venda inválido';
  return null;
}

export function ImportWizard({ stores, categories }) {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [storeId, setStoreId] = React.useState(stores[0]?.id ?? '');
  const [file, setFile] = React.useState(null);
  const [records, setRecords] = React.useState([]);
  const [existingSkus, setExistingSkus] = React.useState(new Set());
  const [onDuplicate, setOnDuplicate] = React.useState('update');
  const [error, setError] = React.useState('');
  const [checking, setChecking] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState(null);

  const categoryCodes = React.useMemo(() => new Set(categories.map((c) => c.code.toUpperCase())), [categories]);

  const onFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError('');
    const text = await f.text();
    const { headers, records: parsed } = parseCsv(text);
    const missing = IMPORT_TEMPLATE_HEADERS.filter((h) => !['barcode', 'min_stock', 'initial_qty'].includes(h) && !headers.includes(h));
    if (missing.length) { setError(`Colunas faltando no arquivo: ${missing.join(', ')}.`); return; }
    if (parsed.length === 0) { setError('Arquivo sem linhas de dados.'); return; }
    setFile(f);
    setRecords(parsed);

    setChecking(true);
    const skus = parsed.map((r) => r.sku).filter(Boolean);
    const chunks = [];
    for (let i = 0; i < skus.length; i += 200) chunks.push(skus.slice(i, i + 200));
    const found = new Set();
    for (const chunk of chunks) {
      const res = await checkExistingSkusAction(chunk);
      (res.existing ?? []).forEach((s) => found.add(s));
    }
    setExistingSkus(found);
    setChecking(false);
  };

  const seenSkus = new Set();
  const validated = records.map((r) => {
    const err = validateRow(r, categoryCodes, seenSkus);
    if (r.sku) seenSkus.add(r.sku);
    return { ...r, error: err, isUpdate: !err && existingSkus.has(r.sku) };
  });
  const validRows = validated.filter((r) => !r.error);
  const errorRows = validated.filter((r) => r.error);
  const newCount = validRows.filter((r) => !r.isUpdate).length;
  const updateCount = validRows.filter((r) => r.isUpdate).length;

  const steps = [{ n: 1, label: 'Arquivo' }, { n: 2, label: 'Revisar' }, { n: 3, label: 'Resultado' }];
  const canAdvance = step === 1 ? !!file && !checking : true;

  const confirm = () => {
    setError('');
    startTransition(async () => {
      const res = await bulkImportProductsAction({
        storeId, onDuplicate,
        items: validRows.map((r) => ({
          sku: r.sku, barcode: r.barcode || '', categoryCode: r.category_code.toUpperCase(), brand: r.brand || '', name: r.name,
          costPrice: parseFloat(r.cost_price) || 0, salePrice: parseFloat(r.sale_price), minStock: parseInt(r.min_stock, 10) || 0,
          initialQty: parseInt(r.initial_qty, 10) || 0,
        })),
      });
      if (res?.error) { setError(res.error); return; }
      setResult(res);
      setStep(3);
    });
  };

  return (
    <StoreShell route="/products/import" breadcrumb={['Catálogo', 'Importar']} navigate={navigate}>
      <PageHeader
        title="Importar catálogo"
        sub="Traga produtos de um CSV com colunas fixas. Nada é gravado até a confirmação final."
        actions={<button onClick={() => navigate('/products')} className="btn btn-ghost btn-sm">Sair do assistente</button>}
      />
      <Page width={960}>
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
                    boxShadow: state === 'current' ? '0 0 0 3px var(--accent-soft)' : 'none', flexShrink: 0,
                  }}>{state === 'done' ? <I.Check size={11} stroke={3} /> : s.n}</div>
                  <span style={{ fontSize: 12.5, fontWeight: state === 'current' ? 500 : 400, color: state === 'todo' ? 'var(--fg-muted)' : 'var(--fg)', whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: s.n < step ? 'var(--accent)' : 'var(--line)', margin: '0 14px' }}></div>}
              </React.Fragment>
            );
          })}
        </div>

        {error && (
          <div style={{ padding: '10px 13px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12.5, color: 'var(--fg)' }}>{error}</div>
        )}

        {step === 1 && (
          <>
            <FormCard title="Arquivo de origem" desc={`CSV separado por vírgula, até alguns milhares de linhas. Colunas esperadas: ${IMPORT_TEMPLATE_HEADERS.join(', ')}.`} cols={1}>
              <Field label="Unidade de destino" required span={1}>
                <SelectInput value={storeId} onChange={setStoreId} options={stores.map((s) => ({ value: s.id, label: s.name }))} />
              </Field>
              {!file ? (
                <label style={{ display: 'block', border: '1.5px dashed var(--line-strong)', borderRadius: 10, padding: '40px 24px', textAlign: 'center', background: 'var(--bg-sunken)', cursor: 'pointer' }}>
                  <input type="file" accept=".csv,text/csv" onChange={onFileChange} style={{ display: 'none' }} />
                  <div style={{ width: 40, height: 40, borderRadius: 9, margin: '0 auto 14px', background: 'var(--bg-elev)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-muted)' }}>
                    <I.Download size={18} style={{ transform: 'rotate(180deg)' }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Escolha o arquivo CSV</div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 14, fontFamily: 'var(--font-mono)' }}>CSV · separado por vírgula</div>
                </label>
              ) : (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 14, border: '1px solid var(--line)', borderRadius: 9, background: 'var(--bg-elev)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, background: 'var(--success-soft)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <I.Check size={19} stroke={2.4} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{file.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                      {checking ? 'Conferindo SKUs existentes…' : `${records.length.toLocaleString('pt-BR')} linhas`}
                    </div>
                  </div>
                  <button onClick={() => { setFile(null); setRecords([]); }} className="btn btn-outline btn-sm">Trocar arquivo</button>
                </div>
              )}
            </FormCard>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>Não tem um arquivo pronto?</div>
              <p style={{ margin: '6px 0 12px', fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Baixe o modelo CSV com as colunas exatas que o sistema espera, com um exemplo preenchido.
              </p>
              <button onClick={downloadTemplate} className="btn btn-outline btn-sm"><I.Download size={12} /> Baixar modelo CSV</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="g4 kpi-strip">
              {[
                { l: 'Linhas no arquivo', v: `${records.length}` },
                { l: 'Produtos novos', v: `${newCount}`, tone: 'success' },
                { l: 'SKUs já existentes', v: `${updateCount}`, s: onDuplicate === 'update' ? 'serão atualizados' : 'serão ignorados' },
                { l: 'Linhas com erro', v: `${errorRows.length}`, tone: errorRows.length ? 'danger' : undefined, s: 'serão ignoradas' },
              ].map((m, i) => (
                <div key={i} style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{m.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4, color: m.tone === 'success' ? 'var(--success)' : m.tone === 'danger' ? 'var(--danger)' : 'var(--fg)' }}>{m.v}</div>
                  {m.s && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{m.s}</div>}
                </div>
              ))}
            </div>

            <FormCard title="Regra pra SKU já existente" cols={1}>
              <Field label="Quando o SKU já existir">
                <SelectInput value={onDuplicate} onChange={setOnDuplicate} options={[
                  { value: 'update', label: 'Atualizar preços e dados' },
                  { value: 'skip', label: 'Ignorar a linha' },
                ]} />
              </Field>
            </FormCard>

            {errorRows.length > 0 && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Linhas com erro</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Corrija no arquivo e reimporte, ou siga sem elas.</p>
                </div>
                <div className="table-scroll"><table className="table">
                  <thead><tr><th>SKU</th><th>Nome</th><th>Problema</th></tr></thead>
                  <tbody>
                    {errorRows.slice(0, 10).map((r, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{r.sku || '(vazio)'}</td>
                        <td style={{ fontSize: 13 }}>{r.name || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--danger)' }}>{r.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
                {errorRows.length > 10 && (
                  <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--fg-muted)' }}>
                    +{errorRows.length - 10} outras linhas com erro
                  </div>
                )}
              </div>
            )}

            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Pré-visualização</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Primeiras linhas válidas que serão gravadas.</p>
              </div>
              <div className="table-scroll"><table className="table">
                <thead><tr><th>SKU</th><th>Produto</th><th>Categoria</th><th className="num">Custo</th><th className="num">Venda</th><th className="num">Saldo inicial</th><th></th></tr></thead>
                <tbody>
                  {validRows.slice(0, 8).map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{r.sku}</td>
                      <td style={{ fontSize: 13 }}>{r.brand ? `${r.brand} · ` : ''}{r.name}</td>
                      <td style={{ fontSize: 12 }}>{r.category_code.toUpperCase()}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{r.cost_price || '0'}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.sale_price}</td>
                      <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.initial_qty || '0'}</td>
                      <td>{r.isUpdate && <span className="badge badge-info">atualiza</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </>
        )}

        {step === 3 && result && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 0 8px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 20, background: 'var(--success-soft)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.Check size={24} stroke={2.4} />
            </div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em' }}>{result.created + result.updated} produtos processados</h2>
            <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--fg-muted)', maxWidth: 460, lineHeight: 1.55 }}>
              {result.created} novos e {result.updated} atualizados. {result.errors.length > 0 ? `${result.errors.length} linhas rejeitadas pelo servidor.` : ''}
            </p>
            <div className="g3" style={{ gap: 12, marginTop: 28, width: '100%', maxWidth: 620 }}>
              {[['Produtos novos', result.created], ['Atualizados', result.updated], ['Ignorados', result.skipped]].map(([k, v]) => (
                <div key={k} className="card" style={{ padding: 14 }}>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{k}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', marginTop: 4 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
              <button onClick={() => navigate('/products')} className="btn btn-primary btn-lg">Ver catálogo <I.ArrowRight size={14} /></button>
            </div>
          </div>
        )}

        {step < 3 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
            <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/products')} className="btn btn-ghost">
              <I.ChevronLeft size={13} /> Voltar
            </button>
            <div style={{ flex: 1 }}></div>
            {step === 2 && <span style={{ fontSize: 12, color: 'var(--fg-muted)', marginRight: 4 }}>{validRows.length} linhas serão gravadas</span>}
            <button
              onClick={() => step === 2 ? confirm() : canAdvance && setStep(step + 1)}
              className="btn btn-primary btn-lg" disabled={!canAdvance || (step === 2 && (validRows.length === 0 || pending))}
              style={{ opacity: (!canAdvance || (step === 2 && validRows.length === 0)) ? 0.45 : 1 }}
            >
              {step === 2 ? (pending ? 'Importando…' : 'Confirmar importação') : 'Continuar'} <I.ArrowRight size={13} />
            </button>
          </div>
        )}
      </Page>
    </StoreShell>
  );
}
