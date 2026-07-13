# Deploy — Brandbooks publicados como páginas estáticas no domínio — 2026-07-13

Publicados os dois brandbooks da Vitra como URLs acessíveis em `vitrapremium.com.br`, via o deploy de
GitHub da Hostinger (Vite copia `public/` → `dist/` → servido na raiz do domínio).

## URLs
- **Vitra Imobiliária** → `https://vitrapremium.com.br/brandbook/imobiliaria/`
- **Vitra Premium** → `https://vitrapremium.com.br/brandbook/premium/`
- Garantido em qualquer host (arquivo real): acrescentar `index.html` (`…/brandbook/imobiliaria/index.html`).
  A versão curta depende do host resolver o index do diretório — pelo DEPLOY.md a Hostinger não tem rewrite
  SPA (hash routing), então deve funcionar; se abrir o app, usar `/index.html`.

## Como foi feito (commit `71c2422`)
- Origem: `D:/LEONARDO/Vitra/vitra-agentes-marketing/vitra_brand_assets/{vitra-brandbook.html,
  brandbook-premium.html}` (repo/pasta SEPARADA).
- Copiados para `dashboard/public/brandbook/{imobiliaria,premium}/index.html`.
- Os HTMLs referenciam `../assets/brand/...` (logos/wordmark/watermark) → **25 assets** (22 PNG + 3 SVG,
  5,9 MB) copiados para `public/brandbook/assets/brand/...` preservando a estrutura, então os caminhos
  relativos resolvem. Fontes (Google Fonts) e html2canvas vêm de CDN https (sem mixed content).
- Verificado no dev: os 2 HTMLs servem (títulos corretos) e **todos os 28 requests de asset → 200 OK**;
  build ok. Estático e público (fora do AuthGate) — como pedido.
- Nota: o dev-server do Vite tem fallback SPA para diretórios (artefato de dev); em produção estática o
  index.html do diretório é servido normalmente.

## Junto no mesmo push (`dfb82b2`)
Melhoria do reset de senha (mensagem honesta de rate-limit + cooldown anti-reenvio) — que estava segurada;
verificada e inofensiva, foi ao ar junto (com o aval do Leonardo).

[[deploy-hostinger-vitrapremium]] [[Atualizacao_2026-07-13_Reset_Senha_AuthGate]]
