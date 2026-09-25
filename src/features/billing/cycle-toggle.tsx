"use client";

type Cycle = "monthly" | "yearly";

const OPTIONS: { k: Cycle; l: string }[] = [
  { k: "monthly", l: "Mensal" },
  { k: "yearly", l: "Anual" },
];

// Seletor de ciclo de cobrança usado nas telas que escolhem plano.
export function CycleToggle({ value, onChange }: { value: Cycle; onChange: (c: Cycle) => void }) {
  return (
    <div role="radiogroup" aria-label="Ciclo de cobrança" style={{ display: "inline-flex", gap: 2, padding: 3, background: "var(--bg-sunken)", border: "1px solid var(--line)", borderRadius: 7 }}>
      {OPTIONS.map((o) => (
        <button
          key={o.k}
          type="button"
          role="radio"
          aria-checked={value === o.k}
          onClick={() => onChange(o.k)}
          style={{
            background: value === o.k ? "var(--bg-elev)" : "transparent",
            border: "1px solid " + (value === o.k ? "var(--line)" : "transparent"),
            borderRadius: 5, padding: "5px 14px", fontSize: 12.5, fontWeight: 500,
            color: value === o.k ? "var(--fg)" : "var(--fg-muted)",
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
