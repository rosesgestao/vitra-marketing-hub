# Atualizacao 2026-06-18 — Conteúdo: arte com foto + thumbnail no card/Calendário + arte na publicação

> Cluster de follow-ups do "Gerar arte do post" (todos ORGÂNICOS, sem o render pago/Satori). Na `main`.
> Commit: **4428158**.

## Entregue
- **Variação COM FOTO** (`postArt.js`): novo `photoUrl` desenha a foto do imóvel como HERO no topo +
  scrim que funde para o fundo da marca; texto (kicker/título/apoio/CTA) abaixo. `crossOrigin=anonymous`
  (Storage Supabase serve CORS) + **fallback tipográfico** se a imagem não carregar (URL/CORS). Mantém
  auto-fit do título e a moldura dourada.
- **PostArtModal**: toggle **Tipográfico | Com foto** + campo de **URL da foto do imóvel** (pública).
- **Thumbnail da arte** (`metadata.art_url`) no **card do funil** (28px) e no **card do Calendário**
  (Calendario.jsx passou a selecionar `metadata`).
- **"Marcar publicado"**: `publishContentPost` copia `art_url` para a publicação (`createManualPublication`
  ganhou `artUrl` → vai em `metadata.art_url` da publicação) — a arte vira a mídia de referência.

## Verificacao (ao vivo)
lint, 157 testes, build OK. No preview: variante "Com foto" renderizada (1080×1080, foto + scrim + texto,
imagem cross-origin do Storage SEM taint); "Salvar no post" → `art_url` gravado e **thumbnail apareceu no
card** do funil. Zero erro no console. Metadata de teste revertida nos posts reais.

## Sequenciamento do que resta (cada um = entrega própria)
1. **Configurações editoriais** (tela p/ pilares/tons/cadência/diretrizes — hoje vivem no contentPlaybook).
2. **Biblioteca (DAM)** — repositório de artes/fotos/legendas reutilizáveis (o bucket `cards`/`organic-art`
   já acumula as artes; a DAM as organiza).
3. **Publicação NATIVA via Graph** (Instagram/Facebook orgânico) — a MAIS pesada: exige IG Business,
   permissão `instagram_content_publish`, token de Página server-side e fluxo container/publish; outward-
   facing/credenciada, no padrão das edges (publish-meta-ads). A `art_url` pública já serve de mídia.

Follow-ups menores da arte: quick-pick de fotos da galeria da oferta (hoje é URL manual); mais de um
template por formato. Continuacao de [[Atualizacao_2026-06-18_Conteudo_Gerar_Arte_Do_Post]].
Ver [[conteudo-organico]].
