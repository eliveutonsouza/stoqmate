"use client";

import { useShell } from '@/components/layout/shell-context';
import { can } from '@/lib/permissions';

// Telas que a própria rede pode desligar (Configurações). O perfil até
// alcança, mas a ferramenta não está em uso — some do menu e dos atalhos.
const TENANT_TOGGLES = {
  '/cash': (tenant) => tenant?.cash_control !== false,
};

// Botão que leva a uma tela que o perfil não alcança só gera "acesso negado".
// `canGo(rota)` responde com a mesma regra do menu e do gate de rota, mais as
// ferramentas desligadas pela rede; sem sessão (story, showcase) deixa tudo
// visível.
export function useCan() {
  const shell = useShell();
  const roleId = shell?.user?.roleId;
  return (route) => {
    const path = route.split('?')[0];
    const toggle = TENANT_TOGGLES[path];
    if (shell && toggle && !toggle(shell.tenant)) return false;
    return !roleId || can(roleId, path);
  };
}
