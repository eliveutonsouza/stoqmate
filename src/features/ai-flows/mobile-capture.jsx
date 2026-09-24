"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { PhoneFrame } from '@/features/mobile/phone-frame';
import { createProductAction, uploadProductPhotoAction } from '@/features/products/actions';

const slug = (s, n) => (s || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]/g, '').substring(0, n);

function emptyForm(categories) {
  return { categoryId: categories[0]?.id ?? '', brand: '', name: '', salePrice: '', costPrice: '', photoFile: null, photoPreview: null };
}

export function MobileCapture({ categories }) {
  const navigate = useNavigate();
  const [form, setForm] = React.useState(() => emptyForm(categories));
  const [done, setDone] = React.useState([]);
  const [error, setError] = React.useState('');
  const [pending, startTransition] = React.useTransition();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    set('photoFile', file);
    set('photoPreview', URL.createObjectURL(file));
  };

  const canSave = form.categoryId && form.name.trim() && form.brand.trim() && parseFloat(form.salePrice) > 0;

  const submit = () => {
    setError('');
    if (!canSave) { setError('Preencha marca, nome, categoria e preço de venda.'); return; }
    startTransition(async () => {
      let photoUrl = null;
      if (form.photoFile) {
        const formData = new FormData();
        formData.append('file', form.photoFile);
        const uploadResult = await uploadProductPhotoAction(formData);
        if (uploadResult?.error) { setError(uploadResult.error); return; }
        photoUrl = uploadResult.url;
      }
      const cat = categories.find((c) => c.id === form.categoryId);
      const sku = [cat?.code || 'SKU', slug(form.name, 6)].filter(Boolean).join('-');
      const result = await createProductAction({
        categoryId: form.categoryId, brand: form.brand, name: form.name, sku, barcode: '',
        attrs: {}, costPrice: parseFloat(form.costPrice) || 0, salePrice: parseFloat(form.salePrice),
        minStock: 0, supplierId: null, defaultLocationId: null, notes: '', photoUrl,
      });
      if (result?.error) { setError(result.error); return; }
      setDone((d) => [{ name: form.name, sku }, ...d]);
      setForm(emptyForm(categories));
    });
  };

  return (
    <StoreShell route="/mobile/capture" breadcrumb={['Catálogo', 'Cadastro rápido']} navigate={navigate}>
      <div className="hide-mobile">
        <PageHeader
          title="Cadastro rápido pelo celular"
          sub="Tire a foto do produto e preencha o essencial — bom pra cadastrar em pé, no depósito."
        />
      </div>
      <Page>
        <div className="phone-bleed" style={{ display: 'flex', gap: 26, flexWrap: 'wrap', justifyContent: 'center', padding: '8px 0 20px' }}>
          <div className="phone-bleed-item">
            <PhoneFrame>
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0B0A08', paddingTop: 'var(--phone-top, 54px)', paddingBottom: 26, boxSizing: 'border-box', color: '#fff' }}>
                <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => navigate('/products')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', padding: 0 }}><I.ChevronLeft size={20} /></button>
                  <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>Novo produto</span>
                  {done.length > 0 && <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>{done.length} cadastrados</span>}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{
                    height: 140, borderRadius: 14, background: form.photoPreview ? 'transparent' : 'rgba(255,255,255,0.06)',
                    border: '1px dashed rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                  }}>
                    <input type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: 'none' }} />
                    {form.photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                        <I.Camera size={22} />
                        <div style={{ fontSize: 11.5, marginTop: 6 }}>Tocar para fotografar</div>
                      </div>
                    )}
                  </label>

                  {[
                    ['Categoria', 'category'], ['Marca', 'brand'], ['Nome do produto', 'name'],
                  ].map(([label, key]) => (
                    <div key={key}>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{label}</div>
                      {key === 'category' ? (
                        <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} style={{ width: '100%', height: 40, borderRadius: 9, background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff', padding: '0 10px', fontSize: 13.5 }}>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <input value={form[key]} onChange={(e) => set(key, e.target.value)} style={{ width: '100%', height: 40, borderRadius: 9, background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff', padding: '0 12px', fontSize: 13.5, boxSizing: 'border-box' }} />
                      )}
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Preço de custo</div>
                      <input type="number" value={form.costPrice} onChange={(e) => set('costPrice', e.target.value)} style={{ width: '100%', height: 40, borderRadius: 9, background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff', padding: '0 12px', fontSize: 13.5, boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Preço de venda</div>
                      <input type="number" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} style={{ width: '100%', height: 40, borderRadius: 9, background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff', padding: '0 12px', fontSize: 13.5, boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  {error && <div style={{ fontSize: 11.5, color: '#FF8A8A' }}>{error}</div>}
                </div>

                <div style={{ padding: '12px 18px 6px' }}>
                  <button onClick={submit} disabled={pending} style={{ width: '100%', height: 50, borderRadius: 12, background: 'var(--accent-strong)', color: '#fff', border: 'none', fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit', opacity: pending ? 0.6 : 1 }}>
                    {pending ? 'Salvando…' : 'Cadastrar e fotografar próximo'}
                  </button>
                </div>
              </div>
            </PhoneFrame>
          </div>

          {done.length > 0 && (
            <div className="card phone-bleed-item" style={{ padding: 18, width: 280, maxWidth: '100%', alignSelf: 'flex-start' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600 }}>Cadastrados nesta sessão</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {done.map((d, i) => (
                  <div key={i} style={{ fontSize: 12.5, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <I.Check size={13} style={{ color: 'var(--success)' }} />
                    <span>{d.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-muted)' }}>{d.sku}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/products')} className="btn btn-outline btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>Ver no catálogo</button>
            </div>
          )}
        </div>
      </Page>
    </StoreShell>
  );
}
