# Brand System Vitra — referencia oficial do projeto

> Fonte da verdade: os brandbooks oficiais (fora deste repo).
> - Imobiliaria: `D:/LEONARDO/Vitra/vitra-agentes-marketing/vitra_brand_assets/vitra-brandbook.html`
> - Premium: `D:/LEONARDO/Vitra/vitra-agentes-marketing/vitra_brand_assets/brandbook-premium.html`
> - Logos (origem): `D:/LEONARDO/Vitra/vitra-agentes-marketing/assets/brand/logos-brandbook-vitra-{imobiliaria,premium}`
>
> Auditoria 2026-06-07: o projeto ESTA fiel a estes brandbooks (cores, fontes, logos e voz conferidos).
> Este arquivo codifica o spec no repo para que toda evolucao continue seguindo a identidade de cada marca.

## REGRA DURA (Brand System)
Vitra **Imobiliaria** (marca-mae, navy + dourado, institucional-comercial) e Vitra **Premium**
(sub-marca de luxo, preto + dourado, editorial) **NAO misturam** assets, linguagem, CTAs, templates
nem estrategia. Toda peca declara `brand_scope` e nunca cruza o de outra marca.

## Vitra Imobiliaria (marca-mae)
- **Conceito:** assessoria patrimonial; "Viva, Invista, Evolua."; Porto Alegre. Confianca · Patrimonio · Evolucao.
- **Cores primarias:** Navy `#0A1628` (dominante) · Dourado `#C4942A` · Branco `#FFFFFF`.
  - Familia azul (V esquerdo): `#8EC4F0` `#4A7EC7` `#2E6BB5` `#1B3A6B`.
  - Familia dourada (V direito): `#F0C95C` `#D4A84A` `#C4942A` `#9B7A1C`.
  - Neutros: Deep Navy `#07111F` (preenchimento icone) · Navy Mid `#0F2140` · Off White `#F5F5F0`.
- **Logo:** hexagono navy borda dourada UNICA (2.5px), "V" azul (esq) + dourado (dir); wordmark VITRA
  (Inter Bold, tracking 8px, "A" = triangulo vazado); descriptor "Imobiliaria" (Inter SemiBold, tracking 8px).
- **Voz:** institucional-comercial DIRETA — preco, parcela, planta, bairro, financiamento, lazer, prazo,
  escassez concreta. CTAs: "Fale com a Vitra", "Agendar visita", "Simular financiamento", "Receber condicoes".

## Vitra Premium (sub-marca de luxo)
- **Conceito:** alto padrao selecionado. Exclusividade · Sofisticacao · Atemporal. **"O luxo nao grita — sussurra."**
- **Cores primarias:** Preto `#000000` · Dourado `#C4942A` · Branco `#FFFFFF`. **SEM AZUL** (diferenciador da mae).
  - Tons dourados: `#7A5C10` `#D4A84A` `#F0C95C` `#FFE08A`.
  - Neutros: Charcoal `#1A1A1A` · Dark Gray `#2D2D2D` · Medium Gray `#4A4A4A` · Off White `#F5F5F0`.
- **Logo:** hexagono preto **DUPLA borda** (principal dourada + interna sutil), "V" 100% dourado;
  descriptor "PREMIUM" (Inter Bold, tracking largo, SEM tracos laterais, largura visual > wordmark).
- **Voz:** menos e mais — frases CURTAS, vocabulario preciso, SEM superlativos gratuitos, **SEM emojis no feed**.
  Lexico oficial: Curadoria · Excepcional · Seleto · Atemporal · Exclusivo · Patrimonio · Experiencia ·
  Discreto · Sofisticado · Singular. CTAs: "Receba a curadoria", "Agende uma visita reservada".

## Tipografia (ambas)
- **Playfair Display** (serif): titulos, nomes de empreendimento, citacoes, slogans.
- **Inter** (sans): wordmark, descriptor, corpo, CTAs, dados, interface. Pesos 300–700.

## Uso de logo (ambas)
- Tamanho minimo horizontal 120px (digital) / 30mm (impresso); icone isolado 32px / 8mm. Area de protecao = 1x (altura do icone).
- Versao escura/branca/dourada -> fundo navy/preto/escuro. Versao navy/invertida -> fundo claro/off-white.
- NUNCA: recolorir o icone, distorcer, rotacionar, sombra/brilho/gradiente, transparencia parcial (exceto marca d'agua 12–18%).

## Onde isto vive no projeto (conferido)
- Render (`supabase/functions/render-asset/index.ts`): `GOLD #C4942A`, `GOLD_LIGHT #F0C95C`, `OFF_WHITE #F5F5F0`,
  navy `#0A1628`/`#07111F`, facetas azuis `#2E6BB5/#164DA6/#123B86`; fontes Inter + Playfair. OK.
- `dashboard/src/lib/brandProfiles.js`: `navy_gold` (mae) vs `black_gold` (premium) + caminhos das logos aprovadas. OK.
- Logos aprovadas em `dashboard/public/brand/vitra-{imobiliaria,premium}/...` (espelham os brandbooks). OK.
- Copiloto de copy (`_shared/copyValidation.ts` + Edge `generate-copy`): voz por marca + bloqueio de
  cross-contaminacao de vocabulario (lexico Premium nao vaza pra Imobiliaria). Alinhado ao brandbook.

## Pendente de marca (decisao do usuario)
- Ativar o copiloto de copy/template no **Premium** (a voz Premium ja esta alinhada ao brandbook aqui;
  falta o aval de marca + ligar o escopo na UI, hoje Imobiliaria-only).
