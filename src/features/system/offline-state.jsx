"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { SystemState } from '@/features/system/system-state';
import { I } from '@/components/icons';

export function OfflineState() {
  const navigate = useNavigate();
  const pending = [
    ['Venda #4821', 'R$ 268,90 · 3 itens', 'há 2 min'],
    ['Venda #4822', 'R$ 47,00 · 1 item', 'há 1 min'],
    ['Ajuste de estoque', 'Fone ANC · −2 un', 'agora'],
  ];
  return (
    <SystemState
      navigate={navigate} tone="warning" icon={<I.Alert size={22} />}
      title="Sem internet — o balcão continua vendendo"
      body="As vendas ficam guardadas no aparelho e sobem sozinhas quando a conexão voltar. Você não precisa fazer nada."
      extra={(
        <div className="card" style={{ marginTop: 20, textAlign: 'left', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line)', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--warning)' }}></span>
            3 operações aguardando envio
          </div>
          {pending.map(([t, d, w], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < pending.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{t}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{d}</div>
              </div>
              <span style={{ fontSize: 11, color: 'var(--fg-faint)', fontFamily: 'var(--font-mono)' }}>{w}</span>
            </div>
          ))}
        </div>
      )}
      primary={<button onClick={() => navigate('/pos')} className="btn btn-primary">Voltar ao balcão</button>}
      secondary={<button className="btn btn-outline">Tentar reconectar</button>}
    />
  );
}

// === Sessão expirada ===
