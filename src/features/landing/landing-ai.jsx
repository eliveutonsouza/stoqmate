"use client";

import { SECTION } from '@/features/landing/section';
import { Eyebrow } from '@/features/landing/eyebrow';
import { H2 } from '@/features/landing/h2';
import { Lead } from '@/features/landing/lead';
import { I } from '@/components/icons';
import { ShowcaseFrame } from '@/components/ui/showcase-frame';
import { AIQueue } from '@/features/ai-flows/ai-queue';

export function LandingAI({ navigate }) {
  const feats = [
    { icon: 'Truck', t: 'Leitura de nota por foto', d: 'Fotografe a nota do fornecedor. Os itens vêm casados aos seus SKUs pelo código de barras.', save: '6 min por nota' },
    { icon: 'Layers', t: 'Classificação no cadastro', d: 'Descreva o produto como veio do fornecedor. Categoria, atributos e unidade vêm preenchidos.', save: '40 s por SKU' },
    { icon: 'Chart', t: 'Previsão de demanda', d: 'Reposição com sazonalidade, tendência e calendário — não média simples de 30 dias.', save: 'menos ruptura' },
    { icon: 'Alert', t: 'Detecção de anomalia', d: 'Acha estoque fantasma: saldo certo no sistema, prateleira vazia na loja.', save: 'acha o invisível' },
    { icon: 'Search', t: 'Pergunta em português', d: '“Quais produtos estão abaixo do mínimo?” A IA monta o filtro, o sistema faz a conta.', save: 'sem relatório' },
    { icon: 'Credit', t: 'Preço por elasticidade', d: 'Preço sugerido a partir do seu próprio histórico de venda, não de tabela genérica.', save: 'margem real' },
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
              <AIQueue navigate={() => {}} />
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
