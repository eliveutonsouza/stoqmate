"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { SystemState } from '@/features/system/system-state';
import { I } from '@/components/icons';

// Usada pela rota /error e pelo error boundary (src/app/error.tsx). `digest`
// é o id que o Next grava no log do servidor para este erro.
/** @param {{ digest?: string, onRetry?: () => void }} props */
export function ServerError({ digest, onRetry } = {}) {
  const navigate = useNavigate();
  return (
    <SystemState
      navigate={navigate} code={digest ? `ERRO · ref ${digest}` : 'ERRO'} tone="danger" icon={<I.Alert size={22} />}
      title="Algo quebrou do nosso lado"
      body="Não conseguimos carregar esta tela agora. O que já estava salvo continua salvo."
      extra={digest ? (
        <div style={{ marginTop: 18, padding: '11px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, color: 'var(--fg-muted)', textAlign: 'left', lineHeight: 1.55 }}>
          Se o problema continuar, informe a referência <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}>{digest}</strong> ao suporte.
        </div>
      ) : null}
      primary={<button onClick={() => (onRetry ? onRetry() : navigate('/dashboard'))} className="btn btn-primary">Tentar de novo</button>}
      secondary={<button onClick={() => navigate('/help')} className="btn btn-outline">Falar com o suporte</button>}
    />
  );
}

// === Offline — o caso mais real do varejo brasileiro ===
