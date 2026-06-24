# Atualizacao 2026-06-23 — Imóvel Vendido (vídeo): máscara v2 + 4:5

> Ajustes de máscara (marca d'água, carimbo, degradê) + novo formato 4:5. Na `main`. Commit: **<HASH>**.
> Continua [[Atualizacao_2026-06-23_Imovel_Vendido_Video_Fase1]].

## Ajustes pedidos (3) — só os elementos indicados
1. **Marca d'água**: a logo, antes no topo-esquerda, virou **marca d'água oficial centralizada
   horizontalmente** (lockup VITRA IMOBILIÁRIA), com leve transparência (alpha .9) e dentro da safe.
   Centragem precisa via `measureText` (com letter-spacing).
2. **Carimbo "Vendido"**: **removido o selo circular** (anel + monograma). Sobrou **só o texto "VENDIDO"**
   com tratamento de **carimbo** — moldura dupla arredondada dourada, **inclinado -8°** e translúcido (.86),
   reposicionado no **canto superior-direito** (área estratégica, sem cobrir corretor/sino/centro).
3. **Legibilidade da headline**: o degradê inferior virou **escuro e suave** (4 stops, fade longo a partir
   de ~55–65% da altura), **sem faixa rígida**, integrando ao vídeo e garantindo contraste atrás da headline.

## Novo formato 4:5 (validação pedida em 9:16 e 4:5)
Adicionado **toggle 9:16 ⇄ 4:5** com **layout por formato** (`LAYOUT.story|feed`): dimensões do canvas,
posições da marca d'água/carimbo/colchetes/headline e o display do preview mudam por formato. 9:16 mantém as
**posições aprovadas**; 4:5 (1080×1350) recebeu layout próprio. Export e capa nomeiam o formato (`9x16`/`4x5`).

## Inalterado (aprovado)
Mensagem (presets) + nome do corretor, colchetes dourados, régua, gradiente do topo, fluxo de
corte/zoom/áudio/trilha/capa/export. Texto/logo seguem desenhados nativamente no canvas (fontes da marca).

## Verificação (ao vivo)
lint + build OK. Gerador aberto no preview nos **dois formatos**: máscara correta (marca d'água centralizada,
carimbo VENDIDO sem selo no canto, degradê suave na base, centro livre), safe-area respeitada, **console
limpo**. Catálogo (`pecasCatalog`) atualizado p/ "9:16 · 4:5".

Critérios atendidos: alinhamento/proporção, áreas de segurança, legibilidade, identidade, sem cortes/
sobreposições, leitura em fundos diversos (degradê + carimbo translúcido funcionam sobre footage claro/escuro).
