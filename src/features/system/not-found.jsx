"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { SystemState } from '@/features/system/system-state';
import { I } from '@/components/icons';

export function NotFound() {
  const navigate = useNavigate();
  return (
    <SystemState
      navigate={navigate} code="ERRO 404" icon={<I.Search size={22} />}
      title="Esta página não existe"
      body="O endereço pode ter mudado ou o registro foi excluído. Nada no seu estoque foi afetado."
      primary={<button onClick={() => navigate('/dashboard')} className="btn btn-primary">Ir para o dashboard</button>}
      secondary={<button onClick={() => navigate('/search')} className="btn btn-outline">Buscar um produto</button>}
    />
  );
}

// === 500 ===
