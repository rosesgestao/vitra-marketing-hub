# Segurança — alerta de vulnerabilidades da Hostinger (deps) — 2026-07-13

A Hostinger (Segurança → Vulnerabilities) apontou 9 CVEs em dependências de `vitrapremium.com.br`.

## Diagnóstico central
**Todas são toolchain de DEV/BUILD** — `vite`, `vitest`, `esbuild`, `ws`, `@babel/core`. **Nenhuma** das 7
dependências de PRODUÇÃO (react, react-dom, @supabase/supabase-js, lucide-react, heic-convert, heic2any,
sharp) está na lista. O deploy é uma **SPA estática** (HTML/CSS/JS buildado) — os visitantes NÃO carregam
vite/vitest/esbuild/ws/@babel; elas rodam só no build/servidor de dev. **O site servido não está exposto.**

## Feito (fix seguro — commit `5a06add`)
`npm audit fix` (não-breaking) → corrigiu **`ws` (High)** + **`@babel/core` (Low)** (transitivos). Só o
`package-lock.json` mudou; 278 testes + build + lint intactos. `npm audit`: de 7 → 5.

## Pendência (decisão do Leonardo: ADIAR)
Restam **5** (`vite`/`vitest`/`esbuild`/`vite-node`) — inclusive a "crítica" (`vitest --ui` server) e a
"alta" (`vite` `server.fs.deny` no Windows). **Todas são vulnerabilidades do servidor de DEV**, sem
exposição no site. Só somem com `npm audit fix --force` → **`vite@8` + `vitest@3` (breaking, +3 majors de
vite)**. O `vite.config.js` tem middleware custom (ingestão de imagem/HEIC/guardas SSRF) que um salto de
major pode quebrar de um jeito que testes/build NÃO pegam (só aparece rodando o dev). Por isso a migração
fica como **tarefa planejada** — feita e testada com calma (incl. testar a middleware do vite.config.js),
não no susto. Risco aceito no ínterim: dev-only, site não afetado.

## Nota
O alerta da Hostinger continuará mostrando as 5 até a migração vite@8/vitest@3 — mas não indica risco ao
site servido.

[[deploy-hostinger-vitrapremium]]
