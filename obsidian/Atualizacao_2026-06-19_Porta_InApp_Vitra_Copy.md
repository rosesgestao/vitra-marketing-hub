# Atualizacao 2026-06-19 — Porta in-app da vitra-copy (gerar copy no anúncio + aplicar)

> Leva a inteligência da skill vitra-copy para dentro do dashboard: gerar 3 ângulos de copy a partir dos
> fatos do imóvel e aplicar ao criativo em 1 clique, com guard pago ao vivo. Na `main`. Commit: **a349ea1**.

## Contexto
Item #4 do roadmap (P1). Antes: a copy "esperta" só existia na skill (sessão) e o botão in-app gerava
ângulos crus que o operador copiava/colava. Agora o operador gera e **aplica direto no criativo**.

## Entregue
### Edge `generate-copy` (4º campo)
- `ANGLES_SCHEMA` + prompt: passam a gerar **`description`** (descrição do link, 1 linha de reforço) além de
  headline/body/cta. Redeploy via Supabase CLI (disco==prod; carrega também os fixes de `channel:'paid'`).

### premiumData — `generateAdCopyAngles({ campaign, brandScope })`
- Monta os fatos a partir de `campaign.brief.product_data` (name/price/neighborhood/area/suites/differentials/
  financing_claim/condo_argument) e chama a Edge com `count:3` + `angle_hints` dos 3 ângulos estratégicos
  (preço-âncora · aspiração-local · escassez/oportunidade). Mesma Edge (canal pago server-side).

### UI — `AdEditModal` (editor de anúncio no fluxo de Tráfego)
- Bloco **"Copy por IA · vitra-copy"**: botão "Gerar 3 ângulos" → lista cada ângulo com **headline (com
  contador /40) · texto · descrição · CTA sugerido** e os **`issues`** do `copyValidation` ao vivo
  (`revalidateCopyAngle` canal `paid`).
- **"Aplicar a este anúncio"** preenche título/texto principal/descrição do formulário. O **CTA** (enum da
  Meta) fica no seletor — não é sobrescrito pela frase de CTA do ângulo (decisão correta: são coisas
  diferentes). Salvar segue o fluxo existente (`saveAd` → re-render nos 3 cortes).
- `AdEditModal` recebe `campaign` (resolvida por `campaign_id` do asset) + `brandScope`; sem campanha
  vinculada, o botão fica desabilitado com aviso.

## Verificacao
- `deno check` generate-copy OK; deploy CLI (description no ar).
- Dashboard: lint limpo, **162 testes** ✓, build OK; preview sem erros no console.
- Exercício ao vivo do botão depende de `ANTHROPIC_API_KEY` setado + uma campanha com criativos meta_ads.

## Estado
Ciclo da copy paga fechado in-app: **gerar (playbook) → revisar (issues) → aplicar ao criativo → salvar →
build 3×3**. A skill (sessão) e o app (tela) compartilham a Edge `generate-copy` + `copyValidation`.
Restam só itens de dados/go-live (fotos reais, ativar 1 campanha, métricas) e a v2 (aprender com CPL/CTR).
Ver [[Atualizacao_2026-06-19_Auditoria_Skills_Trafego_Copy]] e [[Atualizacao_2026-06-19_Skill_Vitra_Copy_e_Guard_Contextual]].
