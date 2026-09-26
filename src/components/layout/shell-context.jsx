"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Dados reais do chrome (empresa, unidade ativa, usuário, contadores),
// carregados no layout do grupo de rotas. Fora do provider (Storybook, telas
// públicas) o valor é null e o chrome mostra só o que não depende de sessão.
const ShellContext = React.createContext(null);

// Sessão que cai no meio do uso (refresh token expirado/revogado, logout em
// outro aparelho) dispara SIGNED_OUT no client do Supabase. Sem isto a tela
// seguia aberta e a próxima ação falhava com erro genérico. Logout pelo menu
// passa por `actions.signOut`, que marca a saída como voluntária.
export function ShellProvider({ value, children }) {
  const router = useRouter();
  const leavingRef = React.useRef(false);
  const hasSession = Boolean(value);

  React.useEffect(() => {
    if (!hasSession) return;
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && !leavingRef.current) router.replace('/session-expired');
    });
    return () => data.subscription.unsubscribe();
  }, [hasSession, router]);

  const signOut = value?.actions?.signOut;
  const wrapped = React.useMemo(() => {
    if (!value || !signOut) return value;
    return {
      ...value,
      actions: {
        ...value.actions,
        signOut: (...args) => { leavingRef.current = true; return signOut(...args); },
      },
    };
  }, [value, signOut]);

  return <ShellContext.Provider value={wrapped}>{children}</ShellContext.Provider>;
}

export function useShell() {
  return React.useContext(ShellContext);
}

// Contador de sidebar: 0 some (badge vazio não informa nada).
export function countBadge(n) {
  if (!n) return undefined;
  return n.toLocaleString('pt-BR');
}

// Unidade padrão dos seletores de loja: a escolhida na sidebar, se estiver
// na lista da tela; senão a primeira.
export function useDefaultStoreId(stores) {
  const active = useShell()?.activeStore?.id;
  return (stores.some((s) => s.id === active) ? active : stores[0]?.id) ?? '';
}
