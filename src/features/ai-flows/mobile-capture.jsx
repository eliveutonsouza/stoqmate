"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { CAPTURE_QUEUE } from '@/features/ai-flows/capture-queue';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { PhoneFrame } from '@/features/mobile/phone-frame';
import { CaptureCard } from '@/features/ai-flows/capture-card';

export function MobileCapture() {
  const navigate = useNavigate();
  const [shots, setShots] = React.useState(5);
  const queue = CAPTURE_QUEUE;
  const ready = queue.filter(q => q.state === 'done').length;
  const review = queue.filter(q => q.state === 'review').length;

  return (
    <StoreShell route="/mobile/capture" breadcrumb={['Catálogo', 'Cadastro por foto']} navigate={navigate}>
      <PageHeader
        title="Cadastro por foto"
        sub="A tela usada com a caixa na mão. Fotografa em série, a IA lê em segundo plano, você revisa depois."
        actions={<span className="badge badge-accent"><I.Sparkle size={10} /> 4 créditos por produto</span>}
      />
      <Page>
        <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', justifyContent: 'center', padding: '8px 0 20px' }}>

          {/* Esteira de captura */}
          <div>
            <PhoneFrame>
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0B0A08', paddingTop: 54, paddingBottom: 26, boxSizing: 'border-box' }}>
                <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => navigate('/products')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', padding: 0 }}><I.ChevronLeft size={20} /></button>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', flex: 1 }}>Fotografar</span>
                  <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>{shots} fotos</span>
                </div>

                {/* visor */}
                <div style={{ flex: 1, margin: '4px 14px 0', borderRadius: 18, background: 'linear-gradient(160deg, #1C1A16, #0F0E0B)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 28, border: '2px dashed rgba(255,255,255,0.22)', borderRadius: 14 }}></div>
                  <div style={{ position: 'absolute', top: 14, left: 0, right: 0, textAlign: 'center', fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>
                    Enquadre a embalagem
                  </div>
                  <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14, padding: '9px 12px', background: 'rgba(0,0,0,0.5)', borderRadius: 10, fontSize: 11.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.45 }}>
                    Pode fotografar o próximo sem esperar. Nada trava.
                  </div>
                </div>

                {/* controles */}
                <div style={{ padding: '16px 18px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(255,255,255,0.10)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <I.QR size={19} />
                  </button>
                  <button onClick={() => setShots(s => s + 1)} style={{
                    width: 72, height: 72, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.3)',
                    background: 'var(--accent-strong)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <I.Camera size={26} />
                  </button>
                  <button style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(255,255,255,0.10)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <I.Grid size={19} />
                  </button>
                </div>
                <div style={{ textAlign: 'center', paddingBottom: 4, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                  Código de barras · foto · galeria
                </div>
              </div>
            </PhoneFrame>
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--fg-muted)' }}>1 · Esteira de captura</div>
          </div>

          {/* Fila de leitura */}
          <div>
            <PhoneFrame>
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0B0A08', paddingTop: 54, paddingBottom: 26, boxSizing: 'border-box' }}>
                <div style={{ padding: '10px 18px 6px' }}>
                  <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }}>Fila de cadastro</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                    {ready} prontos · {review} precisam de você · 1 processando
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'hidden', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {queue.map(item => <CaptureCard key={item.id} item={item} onFix={() => {}} />)}
                </div>
                <div style={{ padding: '12px 14px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button style={{ height: 48, borderRadius: 12, background: 'var(--accent-strong)', color: '#fff', border: 'none', fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit' }}>
                    Cadastrar {ready} prontos
                  </button>
                  <button style={{ height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.10)', color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit' }}>
                    Revisar os {review} duvidosos
                  </button>
                </div>
              </div>
            </PhoneFrame>
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--fg-muted)' }}>2 · Fila em segundo plano</div>
          </div>

          {/* Revisão de um item */}
          <div>
            <PhoneFrame>
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0B0A08', paddingTop: 54, paddingBottom: 26, boxSizing: 'border-box' }}>
                <div style={{ padding: '10px 18px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', flex: 1 }}>Revisar · 3 de 4</span>
                  <span style={{ fontSize: 11, color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>71%</span>
                </div>
                <div style={{ margin: '0 14px', height: 120, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                  <I.Pkg size={30} />
                </div>
                <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {[
                    ['Nome', 'Cabo USB-C 2m', true],
                    ['Marca', 'Voltek', false],
                    ['Categoria', 'Eletrônicos', true],
                    ['Cor', 'Cinza', false],
                    ['Preço de venda', 'R$ 39,90', false],
                  ].map(([l, v, ok]) => (
                    <div key={l}>
                      <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)', marginBottom: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                        {l}
                        {!ok && <span style={{ color: 'var(--warning)', fontSize: 10 }}>confirme</span>}
                      </div>
                      <div style={{
                        height: 40, borderRadius: 9, background: 'rgba(255,255,255,0.07)',
                        border: '1px solid ' + (ok ? 'transparent' : 'rgba(224,160,40,0.45)'),
                        display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13.5, color: '#fff',
                      }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px 14px 6px', display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.10)', color: '#fff', border: 'none', fontSize: 13.5, fontWeight: 500, fontFamily: 'inherit' }}>Descartar</button>
                  <button style={{ flex: 2, height: 48, borderRadius: 12, background: 'var(--accent-strong)', color: '#fff', border: 'none', fontSize: 14.5, fontWeight: 600, fontFamily: 'inherit' }}>Confirmar e próximo</button>
                </div>
              </div>
            </PhoneFrame>
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--fg-muted)' }}>3 · Revisão em fila</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            ['Fotografar não espera a IA', 'A câmera nunca trava aguardando resposta. O lojista fotografa a prateleira inteira e só depois senta para revisar — é assim que 800 produtos entram num sábado.'],
            ['Só o duvidoso pede atenção', 'Acima de 85% de confiança entra direto na fila de prontos. Abaixo disso, o campo incerto vem destacado e o resto já preenchido — confirmar é mais rápido que digitar.'],
            ['O custo aparece antes', '4 créditos por produto, mostrado no cabeçalho. Fotografar 50 itens consome 200 créditos, e o medidor avisa antes de estourar a cota.'],
          ].map(([t, d]) => (
            <div key={t} className="card" style={{ padding: 18 }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600 }}>{t}</h4>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.6 }}>{d}</p>
            </div>
          ))}
        </div>
      </Page>
    </StoreShell>
  );
}

// ============================================================================
// 3 · Busca por significado — camada semântica sobre a busca literal
//
// pgvector já vem incluso no Supabase. O embedding custa fração de centavo, então
// esta é a única função de IA do sistema que não gasta crédito do lojista.
// ============================================================================
