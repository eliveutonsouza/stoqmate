"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { SystemState } from '@/features/system/system-state';
import { I } from '@/components/icons';

export function AccessDenied() {
  const navigate = useNavigate();
  return (
    <SystemState
      navigate={navigate} tone="warning" icon={<I.Lock size={22} />}
      title="Seu perfil não tem acesso a esta tela"
      body="Relatórios de lucratividade e custo são restritos a Gestores e Administradores. Você está como Vendedor."
      extra={(
        <div style={{ marginTop: 18, padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, color: 'var(--fg-muted)', textAlign: 'left', lineHeight: 1.55 }}>
          Quem pode liberar: <strong style={{ color: 'var(--fg)' }}>Ana Ribeiro</strong> (Gestora de Estoque) ou qualquer Administrador da rede.
        </div>
      )}
      primary={<button onClick={() => navigate('/dashboard')} className="btn btn-primary">Voltar ao dashboard</button>}
      secondary={<button className="btn btn-outline">Pedir acesso</button>}
    />
  );
}
