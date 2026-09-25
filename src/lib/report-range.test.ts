import { describe, it, expect } from "vitest";
import { formatRangeLabel, resolveReportRange, todayInSaoPaulo } from "./report-range";

const TODAY = "2026-09-18";

describe("resolveReportRange", () => {
  it("padrão é últimos 30 dias, incluindo hoje", () => {
    const r = resolveReportRange({}, TODAY);
    expect(r.period).toBe("30d");
    expect(r.from).toBe("2026-08-20");
    expect(r.to).toBe(TODAY);
    expect(r.days).toBe(30);
  });

  it("fim exclusivo no dia seguinte, no fuso de São Paulo", () => {
    const r = resolveReportRange({ period: "7d" }, TODAY);
    expect(r.startIso).toBe("2026-09-12T00:00:00-03:00");
    expect(r.endIso).toBe("2026-09-19T00:00:00-03:00");
    expect(r.days).toBe(7);
  });

  it("este mês começa no dia 1", () => {
    const r = resolveReportRange({ period: "month" }, TODAY);
    expect([r.from, r.to]).toEqual(["2026-09-01", TODAY]);
  });

  it("mês passado cobre o mês inteiro anterior (virada de ano)", () => {
    const r = resolveReportRange({ period: "last-month" }, "2026-01-10");
    expect([r.from, r.to, r.days]).toEqual(["2025-12-01", "2025-12-31", 31]);
  });

  it("personalizado aceita datas invertidas", () => {
    const r = resolveReportRange({ period: "custom", from: "2026-09-10", to: "2026-09-01" }, TODAY);
    expect([r.from, r.to]).toEqual(["2026-09-01", "2026-09-10"]);
  });

  it("personalizado inválido cai no padrão", () => {
    const r = resolveReportRange({ period: "custom", from: "2026-02-30", to: "x" }, TODAY);
    expect(r.period).toBe("30d");
  });

  it("período desconhecido na URL cai no padrão", () => {
    expect(resolveReportRange({ period: "999d" }, TODAY).period).toBe("30d");
  });
});

describe("formatRangeLabel", () => {
  it("mostra dia e mês abreviado", () => {
    expect(formatRangeLabel("2026-08-19", "2026-09-18", TODAY)).toBe("19 ago – 18 set");
  });

  it("mostra o ano quando o período atravessa anos", () => {
    expect(formatRangeLabel("2025-12-01", "2026-01-05", TODAY)).toBe("1 dez 2025 – 5 jan 2026");
  });

  it("mostra o ano quando não é o ano corrente", () => {
    expect(formatRangeLabel("2025-03-01", "2025-03-31", TODAY)).toBe("1 mar – 31 mar 2025");
  });
});

describe("todayInSaoPaulo", () => {
  it("usa o fuso de São Paulo, não UTC", () => {
    expect(todayInSaoPaulo(new Date("2026-09-19T02:00:00Z"))).toBe("2026-09-18");
  });
});
