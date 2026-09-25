import { describe, it, expect } from "vitest";
import { checkImage, uploadPath } from "./image-upload";

const file = (type: string, size: number) => new File([new Uint8Array(size)], "x", { type });

describe("checkImage", () => {
  it("recusa ausência de arquivo", () => {
    expect(checkImage(null, 2)).toEqual({ error: "Nenhum arquivo enviado." });
    expect(checkImage(file("image/png", 0), 2)).toEqual({ error: "Nenhum arquivo enviado." });
  });

  it("recusa SVG e HTML", () => {
    expect(checkImage(file("image/svg+xml", 10), 2)).toHaveProperty("error");
    expect(checkImage(file("text/html", 10), 2)).toHaveProperty("error");
  });

  it("recusa acima do limite", () => {
    expect(checkImage(file("image/png", 2 * 1024 * 1024 + 1), 2)).toEqual({ error: "Arquivo maior que 2 MB." });
  });

  it("aceita imagem válida e devolve extensão", () => {
    expect(checkImage(file("image/webp", 100), 2)).toEqual({ ext: "webp" });
  });
});

describe("uploadPath", () => {
  it("não usa nome original e mantém prefixo", () => {
    expect(uploadPath("tenant-1", "png")).toMatch(/^tenant-1\/[0-9a-f-]{36}\.png$/);
  });
});
