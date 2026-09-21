// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Artefato do `storybook build` (gate 5). Sem isso, rodar o gate na ordem
    // storybook→eslint faz o lint varrer bundle minificado e falhar.
    "storybook-static/**",
    // Edge Functions rodam em Deno, runtime e convenções de lint próprias
    // (import npm:, globais Deno.*) — fora do escopo deste config Next.js.
    "supabase/functions/**",
  ]),
  ...storybook.configs["flat/recommended"]
]);

export default eslintConfig;
