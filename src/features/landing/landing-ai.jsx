"use client";

import { SECTION } from '@/features/landing/section';
import { Eyebrow } from '@/features/landing/eyebrow';
import { H2 } from '@/features/landing/h2';
import { Lead } from '@/features/landing/lead';
import { I } from '@/components/icons';
import { ShowcaseFrame } from '@/components/ui/showcase-frame';
import dynamic from 'next/dynamic';

// Vitrine montada pelo ShowcaseFrame após o paint — fora do bundle inicial.
const AIQueue = dynamic(() => import('@/features/ai-flows/ai-queue').then((m) => m.AIQueue), { ssr: false });

export function LandingAI({ navigate }) {
  // `save` mostra o custo em créditos (tabela de planos) — sem estimativa de
  // tempo economizado, que não medimos.
  const feats = [
    { icon: 'Truck', t: 'Leitura de nota por foto', d: 'Fotografe a nota do fornecedor. Os itens vêm casados aos seus SKUs para você conferir antes de dar entrada.', save: '5 créditos por nota' },
    { icon: 'Layers', t: 'Classificação no cadastro', d: 'Descreva o produto como veio do fornecedor. Categoria e atributos vêm sugeridos.', save: '1 crédito' },
    { icon: 'Chart', t: 'Previsão de demanda', d: 'Ajusta a reposição com sazonalidade, tendência e calendário comercial — não só a média de 30 dias.', save: '2 créditos por SKU' },
    { icon: 'Layers', t: 'Enriquecimento de catálogo', d: 'Completa atributos em branco e sugere uma descrição curta, a partir do nome do produto, em lote.', save: '1 crédito por SKU' },
    { icon: 'Search', t: 'Pergunta em português', d: '“Quais produtos estão abaixo do mínimo?” A IA monta o filtro, o sistema faz a conta.', save: '1 crédito' },
  ];
  return (
    <section style={{ background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '76px 0' }}>
      <div style={SECTION}>
        <div className="lp-split" data-fit-root>
          <div style={{ minWidth: 0 }}>
            <Eyebrow>Inteligência artificial</Eyebrow>
            <H2 max={520}>A IA digita por você. Quem decide é você.</H2>
            <Lead max={480}>
              Nada entra no seu estoque sem uma pessoa aprovar. Cada sugestão mostra a confiança e
              o motivo — e você aceita, edita ou descarta.
            </Lead>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 11, marginTop: 24,
              padding: '13px 15px', background: 'var(--bg-elev)',
              border: '1px solid var(--line)', borderRadius: 9, maxWidth: 480,
            }}>
              <span style={{ color: 'var(--accent-text)', flexShrink: 0 }}><I.Shield size={15} /></span>
              <span style={{ fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.5 }}>
                Seus dados não treinam modelo nenhum. Cada chamada envia só o necessário para a tarefa.
              </span>
            </div>
            <button onClick={() => navigate('/ai')} className="btn btn-outline" style={{ marginTop: 22 }}>
              Ver a central de IA <I.ArrowRight size={13} />
            </button>
          </div>

          <div className="lp-shot">
            <ShowcaseFrame order={4} url="stoqmate.com.br/ai/queue" width={1380} height={880} scale={0.42}>
              <AIQueue enrichCount={14} forecastCount={9} anomalyCount={3} />
            </ShowcaseFrame>
          </div>
        </div>

        <div className="lp-g3" style={{ gap: 12, marginTop: 44 }}>
          {feats.map(f => {
            const Ico = I[f.icon] || I.Sparkle;
            return (
              <div key={f.t} style={{ padding: 18, background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: 'var(--accent-soft)', color: 'var(--accent-text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}><Ico size={14} /></span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.012em' }}>{f.t}</span>
                </div>
                <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>{f.d}</p>
                <div style={{ fontSize: 11, color: 'var(--accent-text)', marginTop: 10, fontWeight: 500 }}>{f.save}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// === 7 · ROI CALCULATOR (self-persuasion) ===
