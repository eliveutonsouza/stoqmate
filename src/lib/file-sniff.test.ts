import { describe, it, expect } from "vitest";
import { matchesSignature, pdfPageCount } from "./file-sniff";

const bytes = (s: string) => new TextEncoder().encode(s);

describe("matchesSignature", () => {
  it("aceita assinatura certa", () => {
    expect(matchesSignature(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg")).toBe(true);
    expect(matchesSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), "image/png")).toBe(true);
    expect(matchesSignature(bytes("RIFF\0\0\0\0WEBPVP8 "), "image/webp")).toBe(true);
    expect(matchesSignature(bytes("%PDF-1.7\n"), "application/pdf")).toBe(true);
  });

  it("recusa conteúdo que não bate com o tipo declarado", () => {
    expect(matchesSignature(bytes("<html><script>"), "image/png")).toBe(false);
    expect(matchesSignature(bytes("%PDF-1.7"), "image/jpeg")).toBe(false);
    expect(matchesSignature(bytes("RIFF\0\0\0\0WAVEfmt "), "image/webp")).toBe(false);
    expect(matchesSignature(bytes("%PDF-"), "image/svg+xml")).toBe(false);
  });
});

describe("pdfPageCount", () => {
  it("lê o /Count da árvore de páginas", () => {
    expect(pdfPageCount(bytes("%PDF-1.4 1 0 obj << /Type /Pages /Kids [3 0 R] /Count 12 >> endobj"))).toBe(12);
    expect(pdfPageCount(bytes("<< /Count 3 /Kids [] /Type /Pages >>"))).toBe(3);
  });

  it("devolve null quando não dá pra saber", () => {
    expect(pdfPageCount(bytes("%PDF-1.7 stream compressed"))).toBeNull();
  });
});
