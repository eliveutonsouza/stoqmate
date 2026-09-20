"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function useNavigate() {
  const router = useRouter();

  return useCallback(
    (path: string) => {
      router.push(path);
      setTimeout(() => {
        document.querySelectorAll<HTMLElement>("[data-content-area]").forEach((el) => {
          el.scrollTop = 0;
        });
        window.scrollTo(0, 0);
      }, 10);
    },
    [router],
  );
}
