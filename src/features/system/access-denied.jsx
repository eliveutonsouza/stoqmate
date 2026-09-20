"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNavigate } from '@/hooks/use-navigate';
import { SystemState } from '@/features/system/system-state';
import { I } from '@/components/icons';
import { areaFor, rolesThatCan, whoCanReach } from '@/lib/permissions';

// O texto sai da tabela de permissões, nunca de uma frase escrita à mão: se o
// corte mudar em src/lib/permissions.js, esta tela muda junto.
function AccessDeniedInner() {
  const navigate = useNavigate();
  const params = useSearchParams();
  const route = params.get('route') || '/reports/profit';
  const area = areaFor(route);
  const allowed = rolesThatCan(route, 'view');

  return (
    <SystemState
      tone="warning" icon={<I.Lock size={22} />}
      title="Seu perfil não tem acesso a esta tela"
      body={area
        ? `A área ${area.name} é restrita. ${area.why} Você está como Vendedor.`
        : 'Esta tela ainda não foi liberada para nenhum perfil.'}
      extra={(
        <div style={{ marginTop: 18, padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, color: 'var(--fg-muted)', textAlign: 'left', lineHeight: 1.55 }}>
          {whoCanReach(route)}
          {allowed.length > 0 && <> Peça a quem tem um desses perfis na sua loja.</>}
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)' }}>{route}</div>
        </div>
      )}
      primary={<button onClick={() => navigate('/dashboard')} className="btn btn-primary">Voltar ao dashboard</button>}
      secondary={<button className="btn btn-outline">Pedir acesso</button>}
    />
  );
}

export function AccessDenied() {
  return (
    <Suspense fallback={null}>
      <AccessDeniedInner />
    </Suspense>
  );
}
