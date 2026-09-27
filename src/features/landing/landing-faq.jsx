"use client";

import * as React from 'react';
import { SECTION } from '@/features/landing/section';
import { Eyebrow } from '@/features/landing/eyebrow';
import { I } from '@/components/icons';

export function LandingFAQ() {
  const [open, setOpen] = React.useState(0);
  const qs = [
    ['Serve para o meu ramo?',
     'Provavelmente sim. Você define as categorias e os atributos que fazem sentido no seu negócio — de autopeças a farmácia, de vestuário a alimentos. Existem modelos prontos para os ramos mais comuns, e você pode criar o seu do zero.'],
    ['Vou perder tempo migrando da planilha?',
     'Uma tarde, no pior caso. O assistente importa planilha em CSV (no Excel: Salvar como › CSV) com mapeamento de colunas automático, mostra as linhas com erro antes de gravar e deixa você corrigir.'],
    ['O que conta como um SKU?',
     'Cada combinação de atributos da categoria. Se Vestuário tem Cor e Tamanho, uma camiseta em 6 tamanhos e 2 cores ocupa 12 SKUs. No Controle e na Rede os SKUs são ilimitados.'],
    ['E se eu acabar os créditos de IA?',
     'Os recursos de IA pausam até a cota renovar, e o resto do sistema continua funcionando normalmente. O saldo de créditos aparece na central de IA. Você pode comprar um pacote adicional ou subir de plano — nunca há cobrança automática sem você pedir.'],
    ['A IA pode errar e estragar meu estoque?',
     'Não, porque ela não escreve no estoque. Toda sugestão passa por uma fila de revisão com a confiança e o motivo à mostra, e só entra depois que uma pessoa aprova. Você define quem tem permissão para aprovar.'],
    ['Meus dados ficam seguros?',
     'Cada rede só enxerga os próprios dados, o acesso é por perfil e as alterações importantes entram no log de auditoria. Seus dados não treinam modelos de IA. Você pode exportar catálogo, estoque e movimentações em CSV a qualquer momento — inclusive no dia em que decidir sair.'],
  ];
  return (
    <section style={{ ...SECTION, paddingBottom: 80 }}>
      <div className="lp-faq">
        <div>
          <Eyebrow>Dúvidas</Eyebrow>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: '-0.028em', lineHeight: 1.15 }}>
            As três perguntas que todo lojista faz
          </h2>
          <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
            Não achou a sua? A central de ajuda, dentro do app, explica cada tela.
          </p>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {qs.map(([q, a], i) => (
            <div key={q} style={{ borderBottom: i < qs.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                padding: '15px 18px', background: 'transparent', border: 'none',
              }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: 'var(--fg)', letterSpacing: '-0.01em' }}>{q}</span>
                <span style={{ color: 'var(--fg-muted)', flexShrink: 0, transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 120ms ease' }}>
                  <I.ChevronDown size={15} />
                </span>
              </button>
              {open === i && (
                <div style={{ padding: '0 18px 16px', fontSize: 13.5, color: 'var(--fg-muted)', lineHeight: 1.62, maxWidth: 640 }}>{a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// === 12 · FINAL CTA ===
