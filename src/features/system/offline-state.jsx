"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { SystemState } from '@/features/system/system-state';
import { I } from '@/components/icons';

// Não existe fila offline no app: toda venda/movimentação é gravada no
// servidor na hora. A tela não promete sincronização que não acontece.
export function OfflineState() {
  const navigate = useNavigate();
  return (
    <SystemState
      navigate={navigate} tone="warning" icon={<I.Alert size={22} />}
      title="Sem conexão com a internet"
      body="O Stoqmate grava vendas e movimentações direto no servidor, então precisa de internet para confirmar operações. O que já foi confirmado está salvo — nada se perde. Anote as vendas feitas enquanto isso e lance quando a conexão voltar."
      primary={<button onClick={() => window.location.reload()} className="btn btn-primary">Tentar reconectar</button>}
      secondary={<button onClick={() => navigate('/pos')} className="btn btn-outline">Voltar ao balcão</button>}
    />
  );
}

// === Sessão expirada ===
