"use client";

import { ServerError } from "@/features/system/server-error";

// Boundary de qualquer tela: query que falha (must()) cai aqui em vez de
// virar lista vazia. retry() busca os dados de novo.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ServerError digest={error.digest} onRetry={retry} />;
}
