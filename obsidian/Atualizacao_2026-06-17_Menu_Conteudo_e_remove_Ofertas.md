# Atualizacao 2026-06-17 — Menu "Conteúdo" + remocao da aba "Ofertas"

> Foco organico da central de conteudo: menu renomeado e a gestao de ofertas saiu como aba (virou
> seletor compacto). So navegacao/UI. Na `main`. Commit: **e4cce39**.

## Mudancas
- **Menu** "Conteúdo & Curadoria" -> **"Conteúdo"** (ambas as marcas, `App.jsx`).
- **Aba "Ofertas" removida** do `PremiumDashboard`. A central de conteudo agora e: **Produção ·
  Publicações · Modelo** (default = Produção).
- A escolha da oferta/empreendimento (que Produção/Publicações precisam para saber "produzir para o
  quê") virou um **seletor compacto no topo** — `VitraSelect` "Oferta em foco". Criar oferta segue no
  botao **"Nova campanha"** do header (nao dependia da aba).

## Por que (PO)
"Conteúdo" deve ser planejamento/criacao/curadoria/organizacao/acompanhamento de publicacoes organicas.
Gerir ofertas e contexto, nao o proposito da secao — entao saiu da barra de abas, mas o material ainda e
organizado por oferta, logo mantemos um picker leve (sem quebrar Produção/Publicações).

## Garantias
SO navegacao/UI. Nenhuma logica de tela alterada; `focusMode='trafego'` (PaidTrafficWorkspace / painel
"Publicar na Meta") intacto. `selectedCampaignId` ja default para a 1a oferta; o seletor so troca o foco.
lint, 151 testes, build OK; preview confirmou menu "Conteúdo", seletor "Oferta em foco" e abas
Produção/Publicações/Modelo.

## Nota de copy (pendente, dentro da view)
O hero interno ainda diz "Central Vitra Imobiliária / Campanhas, assets, publicacoes e metricas..." —
texto dentro do `PremiumDashboard`/brandProfile, nao no menu. Alinhar essa copy ao foco "Conteúdo" e um
ajuste a parte. Continuacao de [[Atualizacao_2026-06-17_Conteudo_Curadoria_So_Organico]].
