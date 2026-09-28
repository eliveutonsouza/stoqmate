# Mídia da central de ajuda (`/help`)

Gera as **capturas** das telas, os **vídeos narrados e legendados** e publica tudo
no bucket `help-media` do Supabase Storage. Fica fora do build do app (tem
`package.json` próprio). O conteúdo escrito dos artigos está em
`src/lib/help/content/*.ts`.

## Quando rodar

Quando uma tela ensinada na central mudar de layout ou de rótulo, ou quando
um artigo/vídeo novo entrar. Atualize também o `updatedAt` do artigo.

## Passo a passo

```bash
cd scripts/help-media
npm install
# app rodando localmente contra o banco (next build && next start -p 3100)
```

1. **Empresa demo** — "Bonsucesso Varejo", 4 unidades, 26 SKUs, 90 dias de vendas.
   - `capture/01-cadastro-demo.mjs` cria a conta pela tela real de cadastro
     (`DEMO_PASSWORD=…`), e `capture/02-onboarding.mjs` conclui o onboarding
     já capturando as telas dele.
   - Rode `sql/01-estrutura.sql`, `sql/02-vendas.sql` (em blocos),
     `sql/03-situacoes.sql` e `sql/04-notificacoes-e-anomalias.sql` como
     `postgres`. Os scripts executam as RPCs do app **como o proprietário demo**
     (RLS real), não como service role.
   - `capture/03-aceitar-convites.mjs` (`INVITE_TOKENS=…`) cria os usuários
     Vendedor, Gestor de Estoque e Gestor Financeiro pelo link de convite.
2. **Capturas** — `capture/10-*.mjs` … `capture/91-ajustes.mjs`, em ordem, a
   partir de `scripts/help-media` (`STORE_CENTRO` e `STORE_NORTE` = ids das
   unidades). Cada captura grava o PNG e o retângulo de destaque medido no DOM
   em `shots/meta.json`. `capture/review.mjs out.png nome…` monta uma folha de
   revisão com o destaque desenhado.
3. **Publicar as capturas no app** — `node shots.mjs` converte para WebP só as
   capturas citadas nos artigos (`out/shots/`) e grava os destaques em
   `src/lib/help/shots.json`. O teste `src/lib/help/articles.test.ts` falha se
   um artigo citar uma captura que não está lá.
4. **Áudio e legendas** — `python3 audio.py out` (precisa de `piper-tts`,
   `numpy`, ffmpeg e `VOICE=…/pt_BR-faber-medium.onnx`). O roteiro está em
   `videos.json`: cada cena é uma captura e uma fala, e a fala vira a legenda.
   A trilha lo-fi é sintetizada no próprio script, então não tem direito
   autoral envolvido, e abaixa sozinha durante a narração.
5. **Vídeos** — `node render.mjs out shots out chave…` gera
   `out/videos/<chave>.mp4` (1920×1080, 25 fps, H.264/AAC), `.jpg` (poster) e
   `.vtt`. Use `--stills 2,10,30` para revisar quadros antes. Depois, atualize
   `seconds` do vídeo no artigo.
6. **Upload** — `NEXT_PUBLIC_SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node upload.mjs out`.
   Ao regerar mídia já publicada, suba a versão (`VERSION` aqui e
   `HELP_MEDIA_VERSION` em `src/lib/help/media.ts`) para furar o cache.

## Limpeza

`sql/99-limpeza.sql` remove a empresa demo e os 4 usuários. Revise antes: ele
apaga dados de verdade.
