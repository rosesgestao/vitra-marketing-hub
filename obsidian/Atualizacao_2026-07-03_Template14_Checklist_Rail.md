# Template 14 checklist-rail — 1º template nascido 100% dentro do sistema determinístico (2026-07-03)

Teste real de ponta a ponta: criar um template NOVO a partir de referência concreta (peça de oferta em
duas colunas: texto + trilho de 3 fotos) e avaliar o fluxo pós-spec. **Resultado: 1 iteração de layout
do zero ao aprovado** — o processo está previsível.

## O template (vitra-imobiliaria-checklist-rail)
- **Arquitetura (fiel à referência, zero cópia proprietária):** painel dividido — coluna navy à esquerda
  (foto + véu; logo > headline Anton 2 linhas > De riscado / Por dourado > checklist de até 5 selos >
  **CTA pill CLARO** com texto navy) + trilho off-white à direita com fotos arredondadas (PROVA visual).
- **Formatos adaptados individualmente:** 1:1 split com 3 fotos; 9:16 trilho vertical alto (386px/foto,
  conteúdo na reels-safe y[250..1470]); 1.91:1 duas colunas com 2 fotos e 3 checks. Amarelo→dourado,
  azul→navy, wordmark oficial (mesma regra de sempre).
- **Papel distinto do hero-checklist:** foto única full-bleed = ATMOSFERA; checklist-rail = EVIDÊNCIA
  (vários ambientes). Governança validada antes de criar (não é redundante).

## Como nasceu DENTRO do sistema (a prova do teste)
- **Schema primeiro (E3):** layout por formato + contrato de campos em `templateSchemas.ts` (dado);
  builder consome `schemaFor`/`checklistRailLayout`. Componentes REUSADOS: badge, De/Por, dsImageLayer,
  logoBlock, duoSelosPhoto.
- **Gate pegou colisão no nascimento:** 1º render → `overlap:hero×price` (feed/story). Correção no DADO
  do layout (deY/porY), não no código. 2º render → 3/3 ok. **1 iteração.**
- **Proveniência desde o dia 1:** check real de 34c → `char_limit:check1` + `blocked_by_gate` (provado);
  fallbacks degradam (vazio ok).
- **1º template com contraste WCAG REAL no lint:** CTA declara textColor/bgColor → `contrast_cta=17.31`.
- **Nasce protegido:** 9 fixtures no harness (médio/curto/vazio × 3 formatos) + baseline de métricas +
  golden SHA (75→84 entradas). token_conformance limpo (Anton+Inter, paleta DS).
- Guards automáticos exigiram tudo: schema, recipes ≥5, versão espelhada, contagens — testes quebravam
  até completar (14 templates, 7 selecionáveis).

## Verificação
3 formatos inspecionados visualmente (feed/story/wide + com-moldura) — fiéis à referência; axis_spread=0;
84/84 no harness (42 do full-run + 45 por família — rede intermitente na máquina derrubou 2 full-runs
por `insert: fetch failed`; **zero falhas de render/golden**; INSERT com retry segue como robustez a
adicionar). 238 testes + lint + deno check; deploy CLI; 6 previews no catálogo + build no dist.

## Pendências conhecidas
- Trilho com <3 fotos DUPLICA a foto anterior (fallback em cascata) — degradação aceitável, mas vale
  UI avisar "3 fotos recomendadas".
- INSERT do harness sem retry (falha com rede ruim).
- Débito legado: famílias ocultas ainda truncam silenciosamente (padrão de proveniência só nas ativas
  novas). [[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
