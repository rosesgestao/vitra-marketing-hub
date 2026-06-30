# Tráfego Pago — Fase 1 (P0.1): Premium em full-res (≥1080) (2026-06-26)

Motor de render — primeiro item de MOTOR da Fase 1 do roadmap do Tráfego
([[Atualizacao_2026-06-26_Auditoria_Trafego_Pago_Roadmap]]). O caminho **Satori (Premium)** saía em
**~594px (1:1) e ~660px (1.91:1)** — abaixo do mínimo de 1080 da Meta (borrado/recusado). A Imobiliária já
roda full-res por outro motor (SVG-direto).

## O que mudou (cirúrgico)
- `render-asset/index.ts`: default de `PREMIUM_RENDER_SCALE` **0.55 → 1.0**. Como
  `premiumScale(false)=1.0` e `premiumScale(true)=min(1.0, SCALE_TALL=0.75)=0.75`:
  - **1:1 → 1080×1080** (era 594) · **1.91:1 → 1200×628** (era 660) — **full-res**.
  - **9:16 → INALTERADO** (capado por SCALE_TALL; 729×1296) — **zero novo risco de OOM** (é o caminho que
    estoura o 546). O comentário do código confirma que 1:1/1.91:1 a 1.0 "renderiza ok" (mais leves).
- Continua **configurável por secret** (`PREMIUM_RENDER_SCALE`) → rollback sem redeploy.

## Verificação (render real)
deno check + deploy via CLI. Renderizei 3 cortes Premium reais (1:1/9:16/1.91:1) → **todos 200 (sem 546),
inclusive o 9:16**. Dimensões medidas no PNG: **1:1 = 1080×1080**, **1.91:1 = 1200×628**, 9:16 = 729×1296
(capado, esperado). Inspeção visual do 1:1 full-res: layout intacto (logo VITRA Premium, moldura dourada,
headline Playfair, CTA dourado), nítido. Assets de teste removidos.

## Observações
- **Assets Premium existentes** mantêm a resolução antiga até serem **re-renderizados** (não há cache-bust
  de render-version para o Satori/Premium — o mapa `renderVersions.ts` é só da Imobiliária). Renders NOVOS
  já saem full-res; para forçar os antigos, re-renderizar (resetar p/ queued).

## P0.2 (9:16 sem 546) — não feito de propósito, com recomendação
Subir a resolução do 9:16 **aumentaria** o OOM (direção oposta a "sem 546"). Determinismo real do 9:16
full-res precisa do **render-worker** (Puppeteer, hoje dormente) ou de um caminho de 9:16 com menos memória.
**Não arrisquei regressão de OOM** num chute. Recomendação: (a) ativar o render-worker para o 9:16 (fix
correto, full-res), ou (b) aceitar 918px no 9:16 Imobiliária com o retry da fila + a mensagem clara de
recuperação (já entregue no P0.3). Mantida a guarda existente (nunca dois 9:16 full-res por invocação).

## Estado da Fase 1
P0.5 ✅ · P0.3 (parcial) ✅ · **P0.1 ✅**. Faltam: **P0.2** (decisão de infra: render-worker) · **P0.4**
(progresso em operações longas) · resto do P0.3.

Commit: render-asset — Premium full-res (SCALE 0.55→1.0; 9:16 intacto). [[render-asset-deploy-e-limites]]
