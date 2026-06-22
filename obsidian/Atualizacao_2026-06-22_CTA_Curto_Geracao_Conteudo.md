# Atualizacao 2026-06-22 — Geração de conteúdo: CTA curto (botão) + frase na legenda

> A IA do "Gerar posts" passa a produzir `cta` como rótulo CURTO de botão (para a arte), e a chamada
> conversacional vai no fim da legenda. Correção de raiz do CTA que vazava a arte. Na `main`. Commit: **<HASH>**.

## Contexto
Complementa o fix visual do `postArt.js` (truncamento). Lá tratamos o sintoma; aqui, a raiz: o `cta`
gerado era uma FRASE, então a arte recebia um texto longo demais para um botão.

## Mudança (`generate-content`)
- Schema: `cta` redefinido como **rótulo de botão** (`≤ 22 caracteres`, imperativo, sem ponto final —
  "Agende sua visita", "Fale no WhatsApp", "Saiba mais").
- Prompt: regra 4 deixa explícito que a **chamada conversacional (frase)** vai no **FINAL da caption**;
  nova regra 5 define o `cta` como o texto do **botão da arte** e proíbe repetir a frase longa ali.
- Sem mudança de schema de banco; a edge é a única afetada. Redeploy via Supabase CLI.

## Resultado
- `cta` curto alimenta o pill da arte (cards/drawer/PNG) sem estourar; a legenda mantém o convite completo.
- Combina com o truncamento do `postArt.js` (rede de segurança para dados antigos ou CTAs longos manuais).

## Verificação (ao vivo)
- `deno check` OK; deploy CLI.
- "Gerar posts" no preview: CTAs **"Agende sua visita" (17), "Fale no WhatsApp" (16)** — curtos; a legenda
  termina com "…Fale com a nossa equipe no WhatsApp e agende uma visita hoje mesmo." (frase na legenda).

Ver [[Atualizacao_2026-06-22_Fix_CTA_Overflow_Arte]] e [[Atualizacao_2026-06-22_Producao_Visual_Fase2]].
