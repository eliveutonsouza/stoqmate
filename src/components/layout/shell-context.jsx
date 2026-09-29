"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';

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

  // Client do Supabase (~250 KB) entra por import dinâmico: só esta escuta
  // precisa dele, e importá-lo no topo o colocava no bundle inicial de toda
  // rota que monta o chrome — landing inclusive.
  React.useEffect(() => {
    if (!hasSession) return;
    let unsubscribe = null;
    let cancelled = false;
    import('@/lib/supabase/client').then(({ createClient }) => {
      if (cancelled) return;
      const { data } = createClient().auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT' && !leavingRef.current) router.replace('/session-expired');
      });
      unsubscribe = () => data.subscription.unsubscribe();
    });
    return () => { cancelled = true; unsubscribe?.(); };
  }, [hasSession, router]);

  // `counts` chega do layout como promise (não bloqueia a navegação); até
  // resolver, o chrome renderiza sem badges. Storybook passa o objeto pronto.
  const countsSource = value?.counts;
  const [resolved, setResolved] = React.useState(null);
  React.useEffect(() => {
    if (!countsSource || typeof countsSource.then !== 'function') return;
    let cancelled = false;
    countsSource.then(
      (c) => { if (!cancelled) setResolved({ source: countsSource, counts: c }); },
      () => {},
    );
    return () => { cancelled = true; };
  }, [countsSource]);
  const counts = countsSource && typeof countsSource.then === 'function'
    ? (resolved?.source === countsSource ? resolved.counts : null)
    : countsSource ?? null;

  const signOut = value?.actions?.signOut;
  const wrapped = React.useMemo(() => {
    if (!value) return value;
    return {
      ...value,
      counts,
      actions: signOut ? {
        ...value.actions,
        signOut: (...args) => { leavingRef.current = true; return signOut(...args); },
      } : value.actions,
    };
  }, [value, signOut, counts]);

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
