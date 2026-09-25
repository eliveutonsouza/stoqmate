"use client";

import * as React from "react";

type RedirectResult = { url?: string | null; error?: string | null } | undefined;

const FALLBACK_ERROR = "Não foi possível concluir agora. Tente de novo em instantes.";

// Botão que chama uma Server Action de cobrança (Checkout/Portal do Stripe)
// e sai do app pra URL devolvida. `pending` guarda qual botão disparou e
// continua ligado durante o redirect (a página vai embora, não há o que
// reabilitar); erro devolvido pela action vira texto na tela.
export function useRedirectAction() {
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const run = React.useCallback((key: string, action: () => Promise<RedirectResult>) => {
    setError("");
    setPending(key);
    action().then(
      (result) => {
        if (result?.url) {
          window.location.href = result.url;
          return;
        }
        setPending(null);
        setError(result?.error || FALLBACK_ERROR);
      },
      () => {
        setPending(null);
        setError(FALLBACK_ERROR);
      },
    );
  }, []);

  return { pending, error, run };
}
