# Atualizacao 2026-06-09 — Capas sociais (FB / LinkedIn / YouTube) + menu "Estudio de Pecas" no dashboard

> Continuacao de [[Atualizacao_2026-06-07_Copiloto_IA_Marketing]]. Duas frentes nesta sessao:
> (1) uma suite de CAPAS/banners sociais para as duas marcas, como geradores HTML standalone que exportam
> PNG no tamanho exato; (2) a integracao dessas pecas no dashboard via um novo menu **Estudio de Pecas**
> (data-driven, escalavel). O menu foi commitado e PUSHED na `main` (commit **8104eb7**). Os geradores
> vivem em `vitra-agentes-marketing/vitra_brand_assets` e sao espelhados em `dashboard/public/pecas`.
> Tudo verificado: build + lint + 148 testes verdes; export conferido por captura REAL do html2canvas.

## Antes das capas: brandbooks e destaques
- **Bug "8K" no export dos icones de destaque** (`vitra-brandbook.html` e `brandbook-premium.html`): o
  badge de hover `::after '↓ 8K'` era capturado pelo html2canvas e o arquivo saia `-8k.png`. Corrigido:
  badge e outline suprimidos durante a captura via `body.exporting` (com restauracao tambem no `catch`) e
  filename `name + '.png'`. Resolucao/qualidade intactas (EXPORT_SIZE 7680).
- **4 novos icones de destaque** da marca-mae (POST, CONTATO/WhatsApp, ENDERECO/pin, PREMIOS/medalha), no
  mesmo padrao dos demais (hexagono navy, borda dourada, SVG inline 24x24).
- **Foto de perfil**: recomendado o "V isolado" facetado (vs V dentro do hexagono) — maxima legibilidade
  no crop circular pequeno; bate com o asset `v-isolado-colorido` do brandbook.

## Capas sociais — geradores HTML -> PNG (as duas marcas)
Padrao comum a todas: HTML autossuficiente, **logo aprovada embutida como PNG base64** (export-safe, sem
taint no canvas), fundo da marca (gradiente + glow + sheen), **"V" facetado decorativo no sangramento**,
**guias de area segura so na tela** (suprimidas no PNG via `body.exporting`, a prova de falha no `catch`),
e botoes de export no **tamanho exato** (+ opcao 2x onde faz sentido).

| Plataforma | Formato(s) | Area segura | Imob | Premium |
|---|---|---|---|---|
| Facebook | capa 820 x 360 | 640 x 312 (centro) | ok | ok |
| LinkedIn | perfil 1584 x 396 · pagina 1128 x 191 | centro (canto inf. esq. livre) | ok | ok |
| YouTube | banner 2560 x 1440 | 1546 x 423 (centro) | ok | ok |

- **Imobiliaria** = navy `#0A1628` + dourado, V azul + dourado. **Premium** = preto `#000` + dourado, V
  100% dourado, **SEM azul** (auditado: zero hex de azul/navy nos Premium).
- **LinkedIn perfil**: campos **Nome/Cargo editaveis ao vivo** dentro do gerador (entram no PNG).
- **YouTube**: fundo full-bleed (a TV mostra a tela inteira). Preview em escala 0.5, mas o export e
  full-res — durante a captura `body.exporting` zera o `transform` e expande o `.stage` (sem corte).
- Cada lote passou por **auditoria adversarial (workflows)**: dimensoes exatas, ausencia de taint, area
  segura, filename correto e separacao de marca (sem cross-contaminacao).

## A correcao critica de export (o "V" de fundo sumia no PNG)
- Sintoma apontado pelo usuario: o PNG baixado nao trazia o "V" de fundo (so o gradiente).
- Causa: o "V" era um `<svg>` **inline**; o html2canvas 1.4.1 nao rasteriza esse svg posicionado
  (`right` + `transform`) — ele some no PNG. Adicionar `xmlns` sozinho NAO resolveu.
- Fix a prova de falhas: **rasterizar o "V" para PNG (sharp) e embutir como `<img>` data-URI** — o mesmo
  mecanismo da logo, que sempre exportou perfeito. O layout aprovado nao muda (mesmo vetor, tamanho,
  posicao e opacidade); so troca o "motor" de renderizacao daquele elemento.
- Aplicado nas **6 capas** (Facebook + LinkedIn) e ja **nas 2 do YouTube** desde o inicio.
- Verificado capturando a saida REAL do html2canvas (antes: sem V; depois: com V, opacidade correta).
- Ressalva honesta: `filter: drop-shadow` do logo e **screen-only** (html2canvas nao rasteriza `filter`),
  porem imperceptivel sobre o fundo escuro.

## Estudio de Pecas — novo menu no dashboard (commit 8104eb7, na `main`)
Objetivo: organizar a navegacao para que **cada tipo de peca tenha sua secao**, de forma escalavel.
- **Catalogo data-driven** `src/lib/pecasCatalog.js`: plataforma -> formato -> variante de marca +
  status. Adicionar uma peca = editar dados (nova plataforma aparece sozinha no menu e no hub).
- **View** `src/views/EstudioPecas.jsx`: hub "Visao geral" + secoes por plataforma, com preview na
  proporcao real (na cor da marca + "V"), medidas/proporcao/area segura, **toggle Imobiliaria/Premium** e
  botao **"Abrir gerador"** (ou **"Em breve"** nas futuras).
- **Nav**: novo grupo "Estudio de Pecas" em `App.jsx`, derivado do catalogo (render das views `pecas:*`).
- **Espelhamento** `scripts/sync-pecas.mjs` + `npm run sync:pecas`: copia os geradores de
  `vitra_brand_assets` para `public/pecas` (mesma convencao de `public/brand`; fonte unica continua nos
  brand assets — rodar o sync apos editar/criar gerador). 8 geradores espelhados.
- **Disponiveis**: Facebook, LinkedIn, YouTube. **Roadmap (Em breve)**: Instagram, WhatsApp, E-mail.
- **Decisao de produto**: "Trafego Pago" (criativos de campanha, nos paineis de marca) **NAO** entra no
  Estudio de Pecas — fronteira clara entre *peca avulsa de marca* e *criativo de campanha* (decisao do
  usuario: manter separado).
- Regra dura preservada: marcas nunca se misturam. Build + lint + 148 testes verdes.

## Estado / git
- `vitra-premium-ferramenta-operacional`: commit **8104eb7** na `main`, **PUSHED**. O push tambem subiu
  ~18 commits locais anteriores que nunca tinham ido ao GitHub (Copiloto IA, gate de seguranca das Edges,
  render-worker v2 etc.) — repositorio agora **sincronizado** com o remoto.
- Geradores das capas vivem em `vitra-agentes-marketing/vitra_brand_assets` (dir separado); o dashboard
  apenas os serve via `public/pecas`.

## Pendente / proximo
- **Ativar uma area "Em breve"** (ex.: Instagram): criar o gerador HTML no mesmo padrao, adicionar o
  arquivo as `variants` no catalogo e mudar o status para `available`, rodar `npm run sync:pecas`.
- (Opcional) registrar capas + menu no `CHANGELOG.md` da raiz (padrao das notas anteriores).
- Frentes anteriores seguem: estender o copiloto ao Premium, seguranca das Edges de IA antes de deploy
  publico, ativar o worker (9:16 full-res / v2 do link).
