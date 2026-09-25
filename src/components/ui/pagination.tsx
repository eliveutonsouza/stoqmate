"use client";

import { I } from "@/components/icons";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  pending?: boolean;
  noun?: string;
};

// Rodapé de lista paginada no servidor: "Mostrando 51–100 de 312" +
// Anterior/Próxima. Fica dentro do card da tabela (fora do scroller).
export function Pagination({ page, pageSize, total, onPage, pending = false, noun }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  return (
    <nav
      aria-label="Paginação"
      style={{
        padding: "10px 14px", borderTop: "1px solid var(--line)",
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        background: "var(--bg-sunken)",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--fg-muted)" }} aria-live="polite">
        {total === 0
          ? "Nenhum resultado"
          : `Mostrando ${first.toLocaleString("pt-BR")}–${last.toLocaleString("pt-BR")} de ${total.toLocaleString("pt-BR")}${noun ? ` ${noun}` : ""}`}
        {pending && " · carregando…"}
      </span>
      <div style={{ flex: 1 }}></div>
      {pages > 1 && (
        <span style={{ fontSize: 12, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
          {page}/{pages}
        </span>
      )}
      <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1 || pending} onClick={() => onPage(page - 1)}>
        <I.ChevronLeft size={12} /> Anterior
      </button>
      <button type="button" className="btn btn-ghost btn-sm" disabled={page >= pages || pending} onClick={() => onPage(page + 1)}>
        Próxima <I.ChevronRight size={12} />
      </button>
    </nav>
  );
}
