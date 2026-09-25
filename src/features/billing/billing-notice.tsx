"use client";

import type { ReactNode } from "react";

const TONES = {
  danger: { bg: "var(--danger-soft)", line: "var(--danger)" },
  warning: { bg: "var(--warning-soft)", line: "var(--warning)" },
  success: { bg: "var(--success-soft)", line: "var(--success)" },
  neutral: { bg: "var(--bg-sunken)", line: "var(--line)" },
} as const;

// Aviso em linha das telas de cobrança: erro devolvido por action, falha de
// leitura do Stripe, perfil sem permissão.
export function BillingNotice({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <div role={tone === "danger" ? "alert" : undefined} style={{ padding: "10px 12px", background: t.bg, border: `1px solid ${t.line}`, borderRadius: 7, fontSize: 12.5, lineHeight: 1.5, color: "var(--fg)" }}>
      {children}
    </div>
  );
}
