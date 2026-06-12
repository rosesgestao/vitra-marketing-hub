# Atualizacao 2026-06-12 — Hero-checklist reposicionado para dentro da safe zone

> Continuacao de [[Atualizacao_2026-06-12_Oculta_Templates_Antigos_Modal]]. Apos a auditoria de safe
> zone dos 3 templates selecionaveis, o **Template 05 (Foto de fundo com checklist)** — o unico que
> reprovava — foi corrigido nos 3 formatos. Na `main`, pushado. Commit: **45b229b**.
> Edge `render-asset` redeployado via **Supabase CLI**.

## O diagnostico
A auditoria (medindo coordenadas no Edge + conferindo previews) mostrou: duo-selos e hero-panel 100%
dentro da safe zone; **hero-checklist reprovando nos 3 formatos** — era o unico dos 3 criado antes da
skill margem-seguranca-criativos (a regra `meta_safe_zone` nem estava no `fixedBrandRules` dele).

## A correcao (por formato)
- **1:1**: logo recuada do canto (x852, base do CTA 1012 -> 964); margem esquerda 90 -> 108.
- **9:16**: logo abaixo dos 250px do topo (y120 -> 276) e CTA acima da faixa de reels (base 1644 ->
  1400). Antes so cabia em Stories; **agora e reels-safe** (projetar para o mais restritivo cobre os dois).
- **1.91:1**: logo dentro de [89..1111]x[63..]; CTA acima de 564 (base 588 -> 544); margem esquerda
  70 -> 90; stack vertical compactado para caber em y[63..564].

So a foto de fundo segue sangrando ate a borda; todo o conteudo critico (logo, headline, De/Por,
checklist, CTA) ficou dentro do retangulo seguro. Validado visualmente nos 3 formatos.

## Processo (melhoria importante)
O deploy do Edge passou a ser feito pelo **Supabase CLI** (`npx supabase functions deploy render-asset
--project-ref birxcfkyuzqnhyvetbjv`), que **le os arquivos do disco**. Isso elimina de vez o risco de
divergencia disco<->deploy que vinha do deploy inline por MCP (a causa do bug de separacao de marcas
da v59). O projeto de Producao ja esta linkado e o `SUPABASE_ACCESS_TOKEN` esta no ambiente. Ver
[[render-asset-deploy-e-limites]].

Render-version bumpado (`hero-checklist-approved-v1` -> `hero-checklist-safezone-v2`) para forcar o
re-render dos PNGs ja em storage. 6 previews regenerados pelo Edge e baixados. 151 testes verdes,
deno check OK, lint limpo.

## Estado
Os **3 templates selecionaveis da Imobiliaria estao 100% dentro da safe zone do Meta**. Os 4 antigos
seguem ocultos do modal (e nao auditados — nao aparecem para o operador, entao sem risco).
