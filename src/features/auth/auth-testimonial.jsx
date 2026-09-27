"use client";


// Lateral das telas de acesso. Só o que o produto faz de verdade — nada de
// depoimento, cliente ou número inventado.
const POINTS = [
  ['Um catálogo, várias lojas', 'Cada produto é cadastrado uma vez; o saldo é controlado por unidade.'],
  ['Transferência com conferência', 'O que sai de uma loja só entra na outra depois de conferido, com a diferença registrada.'],
  ['Venda que baixa o estoque', 'Cada venda registra a forma de pagamento e tira o item do saldo na hora.'],
  ['Permissão por perfil', 'Vendedor, estoque, financeiro e proprietário veem só o que o perfil alcança.'],
];

export function AuthTestimonial() {
  return (
    <div style={{ maxWidth: 400 }}>
      <div style={{ fontSize: 19, lineHeight: 1.45, letterSpacing: '-0.015em', fontWeight: 500 }}>
        Estoque de todas as lojas da rede, num lugar só.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
        {POINTS.map(([t, d]) => (
          <div key={t}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 3, lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
