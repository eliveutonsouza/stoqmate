"use client";

import { useCallback, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type QueryChanges = Record<string, string | number | null | undefined>;

// Mescla `changes` nos searchParams atuais e troca a URL (replace, sem
// rolar a página). null/"" remove o parâmetro. Qualquer mudança que não
// seja a própria página volta pra página 1 — filtro novo com ?page=7
// antigo mostraria uma página vazia.
export function buildQueryString(current: string, changes: QueryChanges) {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (value == null || value === "") next.delete(key);
    else next.set(key, String(value));
  }
  if (!("page" in changes)) next.delete("page");
  if (next.get("page") === "1") next.delete("page");
  return next.toString();
}

export function useQueryUpdate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (changes: QueryChanges) => {
      const qs = buildQueryString(searchParams?.toString() ?? "", changes);
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [router, pathname, searchParams],
  );

  return { update, pending };
}
