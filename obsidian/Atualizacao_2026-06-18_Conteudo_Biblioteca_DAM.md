# Atualizacao 2026-06-18 — Conteúdo: Biblioteca (DAM)

> Acervo de mídia orgânica reutilizável por marca (artes geradas + fotos enviadas). Na `main`.
> Commit: **(ver git)**.

## Entregue
- **Tabela** `premium_media_assets` (id, brand_scope, kind `art|photo`, title, url, path, tags,
  created_at) + RLS permissiva (postura de dev). Reusa o bucket público **`cards`** (`library/<scope>/…`
  para uploads; as artes ficam em `organic-art/<scope>/…`). Migration aplicada.
- **Helpers** (premiumData): `listMediaAssets(brandScope)`, `registerMediaAsset(...)`,
  `uploadMediaAsset({brandScope,file,kind})`, `deleteMediaAsset(asset)` (remove storage + linha).
- **Auto-registro**: `uploadPostArt` (o "Salvar no post" do "Gerar arte") passou a **registrar a arte na
  biblioteca** automaticamente (kind=art, título = título do post). O acervo se popula sozinho conforme
  o time gera artes.
- **View `Biblioteca.jsx`** (menu Produção de conteúdo → Biblioteca): grid por marca (Todas/Imobiliária/
  Premium) e por tipo (Tudo/Artes/Fotos); **enviar mídia** (upload), **copiar URL**, **baixar**, **excluir**.
- **App.jsx**: item "Biblioteca" + rota.

## Verificacao (ao vivo)
lint, 157 testes, build OK. No preview: gerei a arte de um post → "Salvar no post" → a arte apareceu no
acervo da Biblioteca (badge **Arte**, título do post) e a linha foi confirmada no banco
(`premium_media_assets`, kind=art). **Excluir** pela UI removeu o objeto do storage e a linha (acervo
voltou a vazio). Zero erro no console. Metadata de teste revertida no post real.

## Sequenciamento restante
3. **Publicação NATIVA via Graph** (Instagram/Facebook orgânico) — última e mais pesada: IG Business +
   permissão `instagram_content_publish` + token de Página server-side + fluxo container/publish, no
   padrão das edges; a `art_url`/mídia da biblioteca já serve de imagem. Entrega dedicada, com os
   pré-requisitos do Meta alinhados (passos do Leonardo, como no Lead/ToS).

Follow-up menor (próximo natural): no "Gerar arte → Com foto", **escolher uma foto da Biblioteca** em vez
de colar URL (o DAM já tem os assets). Continuacao de
[[Atualizacao_2026-06-18_Conteudo_Configuracoes_Editoriais]]. Ver [[conteudo-organico]].
