"use client";

import * as React from 'react';

// Dados reais do chrome (empresa, unidade ativa, usuário, contadores),
// carregados no layout do grupo de rotas. Fora do provider (Storybook, telas
// públicas) o valor é null e o chrome mostra só o que não depende de sessão.
const ShellContext = React.createContext(null);

export function ShellProvider({ value, children }) {
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
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
