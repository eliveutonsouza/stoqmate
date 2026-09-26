// Gera src/lib/supabase/database.types.ts a partir do banco linkado e ajusta
// uma limitação do gerador: argumentos de função SQL saem como não-nulos
// (`p_x: string`), mas o Postgres aceita null em qualquer argumento e as
// nossas funções tratam null de propósito (filtro opcional, "sem loja"…).
// Sem o ajuste, cada chamada com null precisaria de cast. Aqui todo tipo de
// argumento dentro de `Functions.*.Args` vira `T | null`.
//
// Uso: npm run db:types
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const OUT = "src/lib/supabase/database.types.ts";
const raw = execSync("npx supabase gen types typescript --linked --schema public", { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });

// Só mexe entre "Functions: {" e o "Enums: {" seguinte (bloco do schema public).
const start = raw.indexOf("    Functions: {");
const end = raw.indexOf("    Enums: {", start);
if (start < 0 || end < 0) throw new Error("formato inesperado do database.types gerado");

const nullableArgs = (block) =>
  block.replace(/Args:\s*(\{[^{}]*\}|never)/g, (match, body) => {
    if (body === "never") return match;
    const patched = body.replace(/(\w+\??:\s*)([^;\n}]+?)(\s*(?:;|\n|\}))/g, (m, key, type, tail) =>
      /\|\s*null\s*$/.test(type) ? m : `${key}${type.trim()} | null${tail}`);
    return `Args: ${patched}`;
  });

const out = raw.slice(0, start) + nullableArgs(raw.slice(start, end)) + raw.slice(end);
writeFileSync(OUT, out);
console.log(`ok: ${OUT}`);
