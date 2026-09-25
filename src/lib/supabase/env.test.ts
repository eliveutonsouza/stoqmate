import { describe, it, expect } from "vitest";
import { parseSupabaseEnv } from "./env";

const URL_OK = "https://abc.supabase.co";

describe("parseSupabaseEnv", () => {
  it("aceita URL https e chave, aparando espaço e quebra de linha", () => {
    expect(parseSupabaseEnv(` ${URL_OK}\n`, "sb_publishable_x\n")).toEqual({ url: URL_OK, anonKey: "sb_publishable_x" });
  });

  it("aceita http só em localhost", () => {
    expect(parseSupabaseEnv("http://127.0.0.1:54321", "k").url).toBe("http://127.0.0.1:54321");
    expect(() => parseSupabaseEnv("http://abc.supabase.co", "k")).toThrow(/https/);
  });

  it("rejeita variável ausente ou só com espaços, citando o nome", () => {
    expect(() => parseSupabaseEnv(undefined, "k")).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(() => parseSupabaseEnv(URL_OK, "   ")).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("rejeita URL inválida sem vazar o valor na mensagem", () => {
    expect(() => parseSupabaseEnv("segredo-nao-url", "k")).toThrow(/não é uma URL válida/);
    expect(() => parseSupabaseEnv("segredo-nao-url", "k")).not.toThrow(/segredo/);
  });
});
