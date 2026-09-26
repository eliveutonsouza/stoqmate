import * as React from 'react';
import { useRouter } from 'next/navigation';

// Actions de IA devolvem { data } ou { error } (texto já pronto pro
// usuário). Aqui vira exceção de novo pra useAITask mostrar o erro.
export function unwrap(result) {
  if (!result || result.error) throw new Error(result?.error || 'Não foi possível concluir agora. Tente de novo em instantes.');
  return result.data;
}

// Hook that owns the three states every AI surface needs.

export function useAITask() {
  const [state, setState] = React.useState('idle');
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const router = useRouter();
  const run = async (fn) => {
    setState('running'); setError(null);
    // Toda chamada que deu certo gastou crédito: refresh traz a cota nova
    // (cards de cota e badge vêm do servidor).
    try { setData(await fn()); setState('done'); router.refresh(); }
    catch (e) { setError(String(e && e.message ? e.message : e)); setState('error'); }
  };
  const reset = () => { setState('idle'); setData(null); setError(null); };
  return { state, data, error, run, reset, setData };
}

// === Shared visual language for anything the model produced ===
