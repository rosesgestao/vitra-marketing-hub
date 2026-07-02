# Etapa 4 (increment 2) — token_conformance (2026-07-01)

Fecha a pendência que venho anotando desde a Etapa 2: cor/fonte fora da paleta (o `#111111` do preço, a
Poppins). Validador NOVO, de mecanismo diferente — varre a **string SVG** final, não a geometria.

## Entregue
- **`creativeLint.tokenConformance(svg, palette, fonts)`**: extrai `fill/stroke/stop-color="#hex"` e
  `font-family` do SVG; sinaliza os que não estão na paleta do design system → `token_color:#..` /
  `token_font:..` (nível ALERTA). Ignora `none`, `url(#..)` e `rgba()` (alphas tratados à parte). Lê a
  **fonte primária** do stack (`"Inter, Arial, sans-serif"` → `Inter`).
- **Ligação em ponto único** (`render-asset` linha ~2329): logo após montar o SVG, funde os avisos no
  `metadata.lint.warnings`. Paleta = hex de `DS_COLORS`; fontes = `DS_FONT` (Anton/Inter).
- **Paleta completada:** os navies estruturais que a regra revelou (stops de gradiente + superfícies)
  viraram tokens em `DS_COLORS` — `navyAbyss #050C16`, `navyBg #0A1B32`, `navyPanel #0E1D38`,
  `navyBar #13294C`. Só NOMEIA hex já em uso → **byte-idêntico** (nenhum builder mudou).

## Medição (o que a regra revelou → o que ficou)
Antes: 8 cores + 2 "fontes" (uma era só o stack de fallback do Inter). Depois de completar a paleta +
ler a fonte primária, os alertas ficaram **cirúrgicos** (dívida real):
- **oferta ✅ / destino ✅** — totalmente limpos.
- **Poppins** — hero-checklist, vitrine, ficha (fonte fora da marca; DS_FONT só tem Anton/Inter).
- **near-whites** `#F2F2F2`/`#FAFAF8`/`#E8ECF4` — candidatos a consolidar em offWhite/white.
- **#111111** — ink do priceChip (duo-selos/dual-photo) — candidato a navyDeep.

## Por que ALERTA (não erro) e não corrigi agora
Trocar Poppins→Inter, near-whites→offWhite, #111111→navyDeep **muda o visual** — é decisão de marca, não
refactor. O validador SURFACE a dívida (advisory, auditável no `metadata.lint`); a correção é um passo
próprio com re-verificação + previews. Render **inalterado** → sem bump de versão, sem regenerar preview.

## Verificação
deno check + **226 testes** (+3 do tokenConformance: cor fora, fonte-stack, ignora none/url/rgba) +
ESLint OK. Deploy CLI. Medição pós-deploy confirma os alertas cirúrgicos acima.

## Restam na Etapa 4
contraste WCAG real (erro p/ texto sobre superfície sólida), format_divergence, promover logo_crowding a
erro por arquétipo, front exibir warnings/recommendations. Débito de token (decisão de marca): Poppins,
near-whites, #111111. [[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
