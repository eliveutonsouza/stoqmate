// Período dos relatórios, vindo da URL (?period=30d | ?period=custom&from=…&to=…).
// Datas são dias de calendário (YYYY-MM-DD) no fuso de São Paulo — o
// Brasil não tem horário de verão desde 2019, então o offset é fixo -03:00.
// Resolvido no servidor (page.tsx) e passado pronto pra tela, pra o
// "hoje" do servidor e do browser nunca divergirem na hidratação.

export type ReportPeriod = "7d" | "30d" | "90d" | "month" | "last-month" | "custom";

export const REPORT_PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: "7d", label: "Últimos 7 dias" },
  { id: "30d", label: "Últimos 30 dias" },
  { id: "90d", label: "Últimos 90 dias" },
  { id: "month", label: "Este mês" },
  { id: "last-month", label: "Mês passado" },
  { id: "custom", label: "Personalizado" },
];

export const DEFAULT_REPORT_PERIOD: ReportPeriod = "30d";
const MAX_CUSTOM_DAYS = 731;
const TZ_OFFSET = "-03:00";
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export type ReportRange = {
  period: ReportPeriod;
  from: string; // YYYY-MM-DD, inclusivo
  to: string; // YYYY-MM-DD, inclusivo
  startIso: string; // início do dia `from` em São Paulo
  endIso: string; // início do dia seguinte a `to` (fim exclusivo, como as RPCs usam)
  days: number;
  label: string; // "19 ago – 18 set"
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDay(s: string): Date | null {
  if (!DATE_RE.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}

function fmtDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(s: string, n: number) {
  const d = parseDay(s)!;
  d.setUTCDate(d.getUTCDate() + n);
  return fmtDay(d);
}

function diffDays(from: string, to: string) {
  return Math.round((parseDay(to)!.getTime() - parseDay(from)!.getTime()) / 86400000);
}

export function todayInSaoPaulo(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

export function isReportPeriod(v: unknown): v is ReportPeriod {
  return typeof v === "string" && REPORT_PERIODS.some((p) => p.id === v);
}

export function formatRangeLabel(from: string, to: string, today: string) {
  const f = parseDay(from)!;
  const t = parseDay(to)!;
  const currentYear = today.slice(0, 4);
  const part = (d: Date, withYear: boolean) =>
    `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ""}`;
  const sameYear = f.getUTCFullYear() === t.getUTCFullYear();
  const showYear = !sameYear || String(t.getUTCFullYear()) !== currentYear;
  if (from === to) return part(f, showYear);
  return `${part(f, showYear && !sameYear)} – ${part(t, showYear)}`;
}

export function resolveReportRange(
  input: { period?: string | null; from?: string | null; to?: string | null },
  today: string,
): ReportRange {
  let period: ReportPeriod = isReportPeriod(input.period) ? input.period : DEFAULT_REPORT_PERIOD;
  let from: string;
  let to = today;

  if (period === "custom") {
    const a = input.from && parseDay(input.from) ? input.from : null;
    const b = input.to && parseDay(input.to) ? input.to : null;
    if (!a || !b) {
      period = DEFAULT_REPORT_PERIOD;
    } else {
      [from, to] = a <= b ? [a, b] : [b, a];
      if (diffDays(from, to) + 1 > MAX_CUSTOM_DAYS) from = addDays(to, -(MAX_CUSTOM_DAYS - 1));
      return build(period, from, to, today);
    }
  }

  switch (period) {
    case "7d": from = addDays(today, -6); break;
    case "90d": from = addDays(today, -89); break;
    case "month": from = `${today.slice(0, 7)}-01`; break;
    case "last-month": {
      const firstThis = `${today.slice(0, 7)}-01`;
      to = addDays(firstThis, -1);
      from = `${to.slice(0, 7)}-01`;
      break;
    }
    default: from = addDays(today, -29);
  }
  return build(period, from, to, today);
}

function build(period: ReportPeriod, from: string, to: string, today: string): ReportRange {
  return {
    period, from, to,
    startIso: `${from}T00:00:00${TZ_OFFSET}`,
    endIso: `${addDays(to, 1)}T00:00:00${TZ_OFFSET}`,
    days: diffDays(from, to) + 1,
    label: formatRangeLabel(from, to, today),
  };
}
