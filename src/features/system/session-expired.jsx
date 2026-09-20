"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { SystemState } from '@/features/system/system-state';
import { I } from '@/components/icons';

export function SessionExpired() {
  const navigate = useNavigate();
  return (
    <SystemState
      navigate={navigate} tone="info" icon={<I.Shield size={22} />}
      title="Sua sessão expirou"
      body="Por segurança, desconectamos depois de 12 horas sem uso. O que você estava preenchendo foi guardado como rascunho."
      primary={<button onClick={() => navigate('/login')} className="btn btn-primary">Entrar de novo</button>}
    />
  );
}

// === Acesso negado — o perfil existe, a permissão não ===
