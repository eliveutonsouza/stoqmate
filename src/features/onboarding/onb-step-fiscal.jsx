"use client";

// A decisão fiscal aparece no onboarding porque o certificado digital é a
// única coisa que a loja precisa buscar fora do Stoqmate. Quem descobre isso
// no primeiro dia de uso desiste; quem descobre aqui, resolve com a
// contabilidade antes de precisar vender.

export function OnbStepFiscal({ data, set }) {
  const mode = data.fiscal || 'later';
  return (
    <div>
      <h2 style={{ margin: 0, fontSize: 25, fontWeight: 600, letterSpacing: '-0.028em' }}>Você vai emitir nota pelo Stoqmate?</h2>
      <p style={{ margin: '9px 0 24px', fontSize: 14.5, color: 'var(--fg-muted)', lineHeight: 1.6, maxWidth: 560 }}>
        O Stoqmate integra com um emissor homologado — não emitimos por conta própria. Você pode começar sem isso
        e ligar depois; o estoque funciona igual nos dois casos.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          ['now', 'Sim, quero emitir NFC-e no balcão', 'Precisa do certificado digital A1 (.pfx) da sua contabilidade. Custa R$ 0,09 por nota, cobrado à parte da mensalidade.'],
          ['own', 'Já emito por outro sistema', 'O Stoqmate cuida do estoque e da venda; a nota continua saindo onde sai hoje.'],
          ['later', 'Depois — quero organizar o estoque primeiro', 'A venda é registrada e o estoque baixa normalmente. Você liga a emissão quando quiser, em Configurações.'],
        ].map(([k, title, desc]) => (
          <button key={k} onClick={() => set('fiscal', k)} style={{
            display: 'flex', alignItems: 'flex-start', gap: 13, textAlign: 'left', width: '100%',
            padding: '15px 17px', borderRadius: 10,
            background: mode === k ? 'var(--accent-soft)' : 'var(--bg-elev)',
            border: '1px solid ' + (mode === k ? 'var(--accent)' : 'var(--line)'),
          }}>
            <span style={{
              width: 17, height: 17, borderRadius: '50%', flexShrink: 0, marginTop: 2,
              border: '2px solid ' + (mode === k ? 'var(--accent)' : 'var(--line-strong)'),
              background: mode === k ? 'var(--accent)' : 'transparent',
              boxShadow: mode === k ? 'inset 0 0 0 3px var(--bg-elev)' : 'none',
            }} />
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 500 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>
      {mode === 'now' && (
        <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--bg-sunken)', border: '1px dashed var(--line-strong)', borderRadius: 10 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 4 }}>Enviaremos um e-mail com o passo a passo</div>
          <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            É um arquivo só, que a sua contabilidade emite em minutos. Você não precisa dele agora — só antes da primeira venda com nota.
          </div>
        </div>
      )}
    </div>
  );
}
