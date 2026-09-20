"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { SystemState } from '@/features/system/system-state';
import { I } from '@/components/icons';

export function ServerError() {
  const navigate = useNavigate();
  return (
    <SystemState
      navigate={navigate} code="ERRO 500 · ref 8f2a91c4" tone="danger" icon={<I.Alert size={22} />}
      title="Algo quebrou do nosso lado"
      body="A falha foi registrada e a equipe já foi avisada. O que você tinha salvo continua salvo — nada foi perdido."
      extra={(
        <div style={{ marginTop: 18, padding: '11px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, color: 'var(--fg-muted)', textAlign: 'left', lineHeight: 1.55 }}>
          Se estiver no meio de uma venda, o balcão continua funcionando offline.
          Informe a referência <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>8f2a91c4</strong> ao suporte.
        </div>
      )}
      primary={<button onClick={() => navigate('/dashboard')} className="btn btn-primary">Tentar de novo</button>}
      secondary={<button onClick={() => navigate('/help')} className="btn btn-outline">Falar com o suporte</button>}
    />
  );
}

// === Offline — o caso mais real do varejo brasileiro ===
