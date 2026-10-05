import { describe, it, expect } from "vitest";
import { checkImage, uploadPath } from "./image-upload";

const file = (type: string, size: number, head: number[] = []) => {
  const bytes = new Uint8Array(size);
  bytes.set(head.slice(0, size));
  return new File([bytes], "x", { type });
};
const WEBP = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];

describe("checkImage", () => {
  it("recusa ausência de arquivo", async () => {
    expect(await checkImage(null, 2)).toEqual({ error: "Nenhum arquivo enviado." });
    expect(await checkImage(file("image/png", 0), 2)).toEqual({ error: "Nenhum arquivo enviado." });
  });

  it("recusa SVG e HTML", async () => {
    expect(await checkImage(file("image/svg+xml", 10), 2)).toHaveProperty("error");
    expect(await checkImage(file("text/html", 10), 2)).toHaveProperty("error");
  });

  it("recusa acima do limite", async () => {
    expect(await checkImage(file("image/png", 2 * 1024 * 1024 + 1), 2)).toEqual({ error: "Arquivo maior que 2 MB." });
  });

  it("recusa conteúdo que não é a imagem declarada", async () => {
    expect(await checkImage(file("image/png", 100), 2)).toHaveProperty("error");
  });

  it("aceita imagem válida e devolve extensão", async () => {
    expect(await checkImage(file("image/webp", 100, WEBP), 2)).toEqual({ ext: "webp" });
  });
});

describe("uploadPath", () => {
  it("não usa nome original e mantém prefixo", () => {
    expect(uploadPath("tenant-1", "png")).toMatch(/^tenant-1\/[0-9a-f-]{36}\.png$/);
  });
});
