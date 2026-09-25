// CSV pro Excel em pt-BR: separador `;`, decimal com vírgula, BOM UTF-8
// (sem o BOM o Excel abre acentos quebrados) e quebra de linha CRLF.

export type CsvCell = string | number | null | undefined;

export function csvCell(v: CsvCell): string {
  if (v == null) return "";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "";
    return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ",");
  }
  // Célula de texto começando com =, +, -, @, tab ou CR vira fórmula no
  // Excel/Sheets (CSV formula injection) — nome de produto/cliente é texto
  // livre, então prefixa com aspa simples.
  const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  return [headers, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
}

// Só no browser (Client Component).
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function csvFilename(base: string, date = new Date()) {
  return `${base}-${date.toISOString().slice(0, 10)}.csv`;
}
