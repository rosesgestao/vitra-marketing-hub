# Débito de marca — Poppins → Inter (2026-07-02)

Resolve o único débito de marca com impacto VISUAL que o `token_conformance` (Etapa 4) vinha sinalizando:
a **Poppins**, uma 3ª fonte fora do brandbook (oficial = Anton display + Inter corpo). Decisão do Leonardo:
**padronizar em Inter** (fiel ao brandbook). As cores off-palette (near-whites, #111111, gradientes) são
débito INVISÍVEL — ficam para depois (tokenização, sem mudança visual).

## Achado que validou a decisão
A Poppins era **carregada de verdade** no Edge (`resvgFonts` fetchava Poppins 500/600/700) — não era
fallback. Logo, trocar muda o render. Usada em **3 templates**: hero-checklist (De/Por, bullets, badge,
CTA), vitrine (De/Por, CTA), ficha (headline, subtítulo, cards, preço, rodapé).

## Entregue
- **Poppins → Inter** em 15 sites (`family: "Poppins"` → `DS_FONT.body`; `font-family="Poppins"` →
  `Inter`). O `token_conformance` **para de sinalizar** Poppins (débito pago).
- **Loader morto removido:** `loadResvgFonts` não baixa mais Poppins 500/600/700 (3 fetches a menos →
  cold isolate mais leve, menos 546). resvg agora carrega Inter 700 + Anton 400.
- Versões: hero-checklist **v6→v7**, vitrine **v3→v4**, ficha **v3→v4** (espelhado em renderVersions +
  catálogo + teste-guarda). **18 previews** regenerados.

## Verificação
- **Visual:** hero-checklist e ficha inspecionados (feed) — o corpo em Inter ficou COESO com o headline
  Anton, mais sóbrio/premium, **sem overflow** (os fatores de fit tunados p/ Poppins seguem cabendo com
  Inter — validado empiricamente). Lint `ok=true` nos **27 fixtures** (3 famílias × curto/médio/vazio × 3).
- **Golden visual (SHA) atualizado** (o pixel mudou — mudança intencional); passada normal pós-update =
  **9/9 zero regressão**. **Baseline de MÉTRICAS inalterado** → prova de que é troca de GLIFO, não de
  layout (axis/gap/fill idênticos).
- deno check + **237 testes** + ESLint OK. Deploy CLI.

## Débito de marca restante (INVISÍVEL — sem decisão, faço quando quiser)
- **near-whites** (#FAFAF8/#F2F2F2/#E8ECF4) → `offWhite #F5F5F0` (1-2 tons off).
- **#111111** (ink do priceChip) → `navyDeep #07111F`.
- **gradientes/accents** (navies/dourados/azuis de degradê) → adicionar ao `DS_COLORS` como tokens
  nomeados (zero mudança visual — só oficializa a paleta).

Com a Poppins resolvida, a tipografia do sistema é agora **Anton + Inter** (+ Playfair no caminho
Satori/Premium), 100% brandbook. [[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
