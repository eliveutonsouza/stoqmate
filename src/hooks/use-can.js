"use client";

import { useShell } from '@/components/layout/shell-context';
import { can } from '@/lib/permissions';

// Botão que leva a uma tela que o perfil não alcança só gera "acesso negado".
// `canGo(rota)` responde com a mesma regra do menu e do gate de rota; sem
// sessão (story, showcase) deixa tudo visível.
export function useCan() {
  const roleId = useShell()?.user?.roleId;
  return (route) => !roleId || can(roleId, route.split('?')[0]);
}
