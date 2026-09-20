"use client";

import { catById } from '@/lib/mock';
import { OnbTitle } from '@/features/onboarding/onb-title';
import { I } from '@/components/icons';

const FISCAL_CHOICE = {
  now: 'NFC-e pelo Stoqmate · certificado A1 pendente',
  own: 'Emitido por outro sistema',
  later: 'Configurar depois',
};

export function OnbStep5({ data, goTo }) {
  const rows = [
    { step: 1, label: 'Nome da loja', value: data.name || '—' },
    { step: 2, label: 'Logo', value: data.logo ? 'logo-bonsucesso.svg' : 'Iniciais automáticas' },
    { step: 3, label: 'Cor principal', value: data.color.toUpperCase(), swatch: data.color },
    { step: 4, label: 'Categorias', value: data.cats.length ? data.cats.map(id => catById(id).name).join(', ') : 'Nenhuma' },
    { step: 4, label: 'Atributos', value: data.cats.length ? `${data.cats.reduce((s, id) => s + catById(id).attributes.length, 0)} configurados` : '—' },
    { step: 4, label: 'Unidades de medida', value: data.cats.length ? [...new Set(data.cats.map(id => catById(id).unit))].join(', ') : '—' },
    { step: 5, label: 'Emissão fiscal', value: FISCAL_CHOICE[data.fiscal || 'later'] },
  ];
  return (
    <>
      <OnbTitle title="Tudo certo?" desc="Confira antes de finalizar. Ao concluir, geramos um catálogo de exemplo nas categorias escolhidas — pode apagar quando quiser." />
      <div className="card" style={{ overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: i < rows.length - 1 ? '1px solid var(--line-soft)' : 'none',
          }}>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 130, flexShrink: 0 }}>{r.label}</span>
            {r.swatch && <span style={{ width: 14, height: 14, borderRadius: 4, background: r.swatch, border: '1px solid var(--line-strong)' }}></span>}
            <span style={{ fontSize: 13, flex: 1, fontFamily: r.swatch ? 'var(--font-mono)' : undefined, color: r.value === '—' || r.value === 'Nenhuma' ? 'var(--fg-muted)' : 'var(--fg)' }}>{r.value}</span>
            <button onClick={() => goTo(r.step)} className="btn btn-ghost btn-sm">Editar</button>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 16, padding: '13px 15px',
        background: 'var(--accent-soft)', borderRadius: 8,
        display: 'flex', gap: 11, alignItems: 'flex-start',
      }}>
        <span style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: 1 }}><I.Sparkle size={15} /></span>
        <div style={{ fontSize: 12, color: 'var(--fg)', lineHeight: 1.55 }}>
          <strong style={{ fontWeight: 600 }}>Catálogo de exemplo será criado:</strong> SKUs nas categorias escolhidas, 6 fornecedores,
          10 locais de estoque e 30 dias de histórico de vendas. Use para testar relatórios e apague em Configurações › Dados da loja.
        </div>
      </div>
    </>
  );
}
