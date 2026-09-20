"use client";

import { I } from '@/components/icons';

export function OnboardingComplete({ navigate, data }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--fg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40,
    }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{
          width: 52, height: 52, borderRadius: 13, margin: '0 auto 24px',
          background: data.color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><I.Check size={26} stroke={2.4} /></div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          {data.name || 'Sua loja'} está pronta
        </h1>
        <p style={{ margin: '14px 0 0', fontSize: 15, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
          Populamos o catálogo com dados de exemplo nas suas categorias. Seu período de teste vai até 2 de outubro de 2026.
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-lg">
            Ir para o dashboard <I.ArrowRight size={14} />
          </button>
          <button onClick={() => navigate('/categories')} className="btn btn-outline btn-lg">
            Revisar categorias
          </button>
        </div>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--line)', textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-soft)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Próximos passos sugeridos
          </div>
          {[
            ['Importar seu catálogo', 'Mapeamento assistido de XLSX e CSV'],
            ['Adicionar suas outras unidades', 'Estoque isolado por loja, visão consolidada da rede'],
            ['Convidar a equipe do balcão', 'Vendedores registram venda sem ver relatórios'],
          ].map(([t, d], i) => (
            <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--line-soft)' : 'none' }}>
              <span style={{
                width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                background: 'var(--bg-sunken)', border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-muted)',
              }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{d}</div>
              </div>
              <I.ChevronRight size={13} style={{ color: 'var(--fg-faint)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
