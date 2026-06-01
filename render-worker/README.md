# Vitra Premium — Render Worker (full-res)

Worker dedicado que renderiza os criativos da Vitra Premium em alta resolucao com
Puppeteer (HTML -> screenshot PNG), consumindo a MESMA fila do Supabase usada pela
Edge Function `render-asset`. Use-o em vez (ou alem) da Edge Function quando precisar
de full-res confiavel, fora do teto de memoria do worker edge.

## Como funciona
1. Reivindica assets `status='queued'` (canais visuais) marcando-os como `rendering`
   — isso evita conflito com o cron edge, que so pega `queued`.
2. Renderiza cada asset em full-res (1080x1080 / 1080x1920 / 1080x1350 / 1280x720 / 1200x630)
   no padrao Premium (foto de fundo + scrim, kicker/tagline, fase, headline Playfair, copy, CTA, moldura, vinheta).
3. Faz upload para o bucket `cards` (`premium-campaigns/<slug>/rendered/<assetId>.png`) e atualiza
   o asset (`status='generated'`, `public_url`, `storage_path`). Em falha, marca `status='error'`.
4. Quando a fila da campanha zera, marca o job `asset_render` como `done`.

Contrato de fila (ja existente no banco): tabela `premium_campaign_assets` (status) e
`premium_generation_jobs` (job_type='asset_render').

## Rodar local
```bash
cp .env.example .env   # preencha SUPABASE_SERVICE_ROLE_KEY
npm install
npm start              # modo servico (poll a cada POLL_INTERVAL_MS) + HTTP
# ou
npm run once           # drena a fila uma vez e sai (ideal p/ cron externo)
```

## Endpoints (modo servico)
- `GET  /healthz` — checagem.
- `POST /render`  — dispara um lote imediato. Header: `x-render-token: <RENDER_TOKEN>`.

## Deploy
- Container: use o `Dockerfile` (base oficial do Puppeteer com Chrome).
- Plataformas: Fly.io, Render, Railway, Cloud Run, ECS, ou uma VM. Defina as envs.
- Acione `POST /render` a partir do app (apos criar campanha) ou rode `--once` por cron.

## Seguranca
- Use SEMPRE a SERVICE ROLE KEY apenas aqui (servidor). Nunca no front-end.
- Mantenha `RENDER_TOKEN` para proteger o endpoint.
