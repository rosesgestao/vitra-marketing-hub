# Atualizacao 2026-06-22 — Drawer "Prévia do post": upload manual de imagem

> O operador pode usar a arte gerada OU enviar a própria imagem (substituir/remover), no mesmo fluxo do
> drawer. Na `main`. Commit: **<HASH>**.

## Diagnóstico
O drawer (Fase 2) só permitia arte GERADA (Tipográfico / Com foto via URL pública). Não havia upload de
arquivo. Faltava: usar imagem própria como arte, enviar a foto do card por arquivo, substituir/remover.

## Entregue
### UI (drawer `PostDetailDrawer`)
- Nova aba **"Imagem própria"** (ao lado de Tipográfico/Com foto): dropzone "Fazer upload de imagem" →
  preview imediato no enquadramento do formato (feed 1:1 / story 9:16, object-cover) → **"Salvar como arte"**
  (a imagem vira a arte do post, sem branding) · **Substituir** · **descartar envio** · **remover arte do post**.
- Aba **"Com foto"**: além da URL, botão **"Enviar arquivo"** que sobe a foto e a usa como hero do card branded.
- Mantém: escolher a arte gerada, trocar entre **versões** (a imagem enviada entra no histórico como versão).

### Regras / validações (cliente)
- Formatos: **JPG, PNG, WebP**. Tamanho: **≤ 8 MB**. Resolução: **avisa** (não bloqueia) se o lado menor < 1080px.
- Lê dimensões reais antes de salvar; erros claros (formato/tamanho/arquivo ilegível).
- Preview com `URL.createObjectURL` (revogado ao trocar/remover). Qualidade preservada: o arquivo é enviado
  como está (sem recompressão); `uploadPostArt` agora grava no tipo real (jpg/png/webp).

### Back-end (`premiumData`, sem migração)
- `uploadPostArt`: deriva extensão/contentType do blob → aceita imagem própria (File é Blob) além do PNG gerado.
- `setActivePostArt(postId, null)`: **remove** a arte ativa (art_url → null; versões preservadas p/ restaurar).
- Foto do card branded: reusa `uploadMediaAsset` (sobe + registra na Biblioteca + retorna URL pública).

## Estados / erros
- Carregando: spinners em "Enviar arquivo"/"Salvar". Sucesso: a imagem vira `art_url` + versão + recarrega o board.
- Erro: formato/tamanho inválido, leitura falha, falha de upload — mensagem no drawer (não trava o fluxo).
- "Salvar como arte" fica desabilitado até haver um arquivo válido.

## Verificação (ao vivo)
- lint limpo · **162 testes** ✓ · build OK.
- Preview: aba "Imagem própria" mostra o dropzone + formato; "Com foto" mostra URL + "Enviar arquivo"
  (2 inputs de arquivo). Screenshots conferidos.

## Critérios de aceite
Operador escolhe entre arte gerada e imagem própria; envia/substitui/remove; vê preview no formato;
salva vinculado ao post (art_url + versão); validações de formato/tamanho com mensagens; responsivo.
Ver [[Atualizacao_2026-06-22_Producao_Visual_Fase2]].
