"use client";

import * as React from 'react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useNavigate } from '@/hooks/use-navigate';
import { SystemState } from '@/features/system/system-state';
import { I } from '@/components/icons';
import { ROLES, areaFor, rolesThatCan, whoCanReach } from '@/lib/permissions';
import { requestAccessAction } from '@/features/system/actions';

// O texto sai da tabela de permissões, nunca de uma frase escrita à mão: se o
// corte mudar em src/lib/permissions.js, esta tela muda junto.
function AccessDeniedInner({ role }) {
  const navigate = useNavigate();
  const params = useSearchParams();
  const route = params.get('route');
  const area = route ? areaFor(route) : null;
  const allowed = route ? rolesThatCan(route, 'view') : [];
  const roleName = ROLES.find((r) => r.id === role)?.name;
  const [feedback, setFeedback] = React.useState(null);
  const [pending, startTransition] = React.useTransition();

  const requestAccess = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await requestAccessAction(route);
      setFeedback(result?.error
        ? { tone: 'danger', text: result.error }
        : { tone: 'success', text: 'Pedido enviado. Quem administra a rede vê nas notificações.' });
    });
  };

  return (
    <SystemState
      tone="warning" icon={<I.Lock size={22} />}
      title="Seu perfil não tem acesso a esta tela"
      body={area
        ? `A área ${area.name} é restrita. ${area.why}${roleName ? ` Você está como ${roleName}.` : ''}`
        : route
          ? 'Esta tela ainda não foi liberada para nenhum perfil.'
          : 'A tela que você tentou abrir não está liberada para o seu perfil.'}
      extra={(
        <>
          {route && (
            <div style={{ marginTop: 18, padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, color: 'var(--fg-muted)', textAlign: 'left', lineHeight: 1.55 }}>
              {whoCanReach(route)}
              {allowed.length > 0 && <> Peça a quem tem um desses perfis na sua loja.</>}
              <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-faint)' }}>{route}</div>
            </div>
          )}
          {feedback && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: `var(--${feedback.tone}-soft)`, border: `1px solid var(--${feedback.tone})`, borderRadius: 7, fontSize: 12, textAlign: 'left' }}>
              {feedback.text}
            </div>
          )}
        </>
      )}
      primary={<button onClick={() => navigate('/dashboard')} className="btn btn-primary">Voltar ao dashboard</button>}
      secondary={(
        route && <button onClick={requestAccess} disabled={pending || feedback?.tone === 'success'} className="btn btn-outline">
          {pending ? 'Enviando…' : feedback?.tone === 'success' ? 'Pedido enviado' : 'Pedir acesso'}
        </button>
      )}
    />
  );
}

export function AccessDenied({ role }) {
  return (
    <Suspense fallback={null}>
      <AccessDeniedInner role={role} />
    </Suspense>
  );
}
