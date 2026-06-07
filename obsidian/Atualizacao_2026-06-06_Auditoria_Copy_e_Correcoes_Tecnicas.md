# Atualizacao 2026-06-06 — Auditoria de Copy dos Criativos + Correcoes Tecnicas

> Auditoria multi-agente (5 agentes, evidencia file:line) da geracao de copy dos 4 templates
> aprovados da Vitra Imobiliaria. Correcoes tecnicas ja aplicadas (commit `a23fc7f`); as
> reescritas de copy e os 20 angulos novos abaixo estao **propostos para revisao do marketing**.

## Como a copy e gerada (resumo)
- Cada template tem **receitas** (angulos) em `templateVariationContracts` (`creativeTemplateCatalog.js`),
  com `headline`/`copy`/`cta` em strings com tokens `{token}`.
- Em runtime, `selectedTemplateVariationConcepts` (`premiumData.js`) limita a quantidade ao numero de
  receitas (sem repetir) e `buildHeadline`/`buildAssetCopy` interpolam os tokens via `variationTokens`.
- A **arte** (Edge `render-asset`) so renaliza a headline + dados do produto; o corpo (texto_principal)
  vai para o anuncio do Meta. Limites de largura: a arte quebra a headline em ~18 chars/linha (2 linhas).

## 4 bugs cross-cutting encontrados

| # | Severidade | Bug | Status |
|---|---|---|---|
| 1 | HIGH | Nome do produto vaza como headline da arte (`{headline}` -> fallback `product`) e reabre no corpo -> duplicacao "Produto. Produto." | **CORRIGIDO** (token `headline_only`) |
| 2 | HIGH | Receitas usam tokens de campos inexistentes: `{offer}` no dual e `{area}` no patios -> viram filler institucional | **Pendente marketing** (reescrita de copy) |
| 3 | MEDIUM | `maxLength` desalinhado do render (44/36/34) + menino-deus sem trava; headline de financiamento com `R$` era descartada pela arte | **CORRIGIDO** (maxLength + `preco-partida` sem R$) |
| 4 | MEDIUM | Angulo de escassez quase identico nos 4 templates ("avaliar agora / confirmar disponibilidade") | **Pendente marketing** (diferenciacao) |

### Correcoes tecnicas aplicadas (commit `a23fc7f`, frontend-only, sem deploy de Edge)
- **Token `headline_only`** em `variationTokens` (sem fallback para o nome do produto). As 3 receitas que
  usavam `{headline}` cru (dual `oferta-direta`, patios `patios-suite`, financiamento `financiamento`)
  passaram a `{headline_only}`; sem headline sugerida, cai no fallback por angulo (copy existente).
- **Financiamento `preco-partida`**: headline com `R$` (descartada pela arte, caia no default fixo) ->
  `{headline_only}` + angle `curadoria`->`investimento` (fallback sem R$ e sem vocabulario Premium).
- **`maxLength`** alinhado ao render: dual 44->36, patios 36->30; menino-deus ganhou trava em
  `suites`(32) e `condo_argument`(28).
- +8 testes de regressao. `npm run test:run` => 61 passed; build ok.

## Angulos novos propostos (20 — revisao do marketing)

> Voz Vitra Imobiliaria (institucional-comercial, navy #0A1628). **Brand-check do auditor: 0 mistura
> com a Premium** (sem "curadoria/uma categoria acima/liquidez/alto padrao"). Tokens entre `{}` sao
> preenchidos com os campos do brief. Antes de implementar: validar que cada `{token}` existe no
> template (regra de "lint" sugerida pelo auditor).

### Oferta com duas fotos (dual-photo-offer)
| Angulo | Headline | Texto principal | CTA |
|---|---|---|---|
| preco-ancora | De {price_from} por {price} | Condicao com valor reduzido neste imovel. Veja fotos, diferenciais e fale com a Vitra para garantir. | Quero o valor com desconto |
| planta-config | {area} pronto para morar | Distribuicao inteligente e diferenciais que fazem diferenca no dia a dia: {details}. Agende sua visita. | Ver planta e detalhes |
| financiamento-entrada | Saia do aluguel financiando | Simulamos a melhor condicao de entrada e parcela para o seu perfil. A partir de {price}, com apoio da Vitra Imobiliaria. | Simular financiamento |
| localizacao-pontos | Morar perto de tudo em {place} | Comercio, escolas e mobilidade no entorno. Conheca a regiao e as condicoes deste imovel com a Vitra. | Conhecer a localizacao |
| ultimas-unidades | Ultimas unidades disponiveis | As condicoes desta fase tem prazo. Confira disponibilidade e valores atualizados antes de encerrar. | Consultar disponibilidade |

### Galeria de patios (patios-gallery)
| Angulo | Headline | Texto principal | CTA |
|---|---|---|---|
| preco-oportunidade | Sua chance a partir de {price} | Imovel com {differentials} pronto para avaliar. A Vitra Imobiliaria mostra valor, planta e condicoes sem rodeios. | Receber condicoes |
| lazer-completo | Lazer e ambientes que voce usa | Patios, area externa e {differentials} reunidos numa galeria de fotos reais. Veja se o imovel combina com a sua rotina. | Ver a galeria |
| localizacao-acesso | Bem localizado em {neighborhood} | {location}. Mobilidade, vizinhanca e acesso rapido ao que importa — avalie a regiao com a assessoria da Vitra Imobiliaria. | Conhecer a regiao |
| metragem-planta | Planta inteligente bem aproveitada | {differentials} num imovel pensado para o dia a dia. A Vitra organiza metragem, ambientes e valor numa leitura objetiva. | Ver detalhes da planta |
| agende-visita | Visite antes que seja vendido | Disponibilidade limitada para este imovel em {neighborhood}. Agende uma visita com a Vitra Imobiliaria e decida com calma. | Agendar visita |

### Financiamento e orla (financiamento-orla)
| Angulo | Headline | Texto principal | CTA |
|---|---|---|---|
| parcela-cabe-no-bolso | Parcela que cabe no seu mes | {financing_claim} em {neighborhood}: simule a parcela e veja como sair do aluguel sem comprometer o orcamento. | Simular minha parcela |
| prazo-de-entrega | Pronto para morar este ano | Entrega proxima e {financing_claim}: garanta as melhores unidades de {neighborhood} antes da virada de tabela. | Ver unidades disponiveis |
| planta-e-metragem | Plantas de 1 e 2 dormitorios | Layouts inteligentes a partir de {price} junto a Nova Orla: escolha a planta que combina com a sua rotina. | Conhecer as plantas |
| lazer-completo-orla | Lazer completo a beira da orla | Piscina, academia e areas de convivio em {neighborhood}, com {financing_claim} para fechar com tranquilidade. | Ver a area de lazer |
| entrada-parcelada | Entrada parcelada direto com a Vitra | Condicoes de entrada facilitadas e {financing_claim}: organize a compra em {neighborhood} sem peso no primeiro pagamento. | Ver condicoes de entrada |

### Oferta foto protagonista (menino-deus-offer)
| Angulo | Headline | Texto principal | CTA |
|---|---|---|---|
| plantas-metragem | Plantas de {suites} bem resolvidas | Metragem aproveitada do hall a sacada, com {differential1} pensado para o dia a dia. A Vitra mostra cada ambiente antes da visita. | Ver as plantas |
| lazer-condominio | Lazer completo no condominio | Churrasqueira, sacada e infraestrutura que reduzem a saida de casa. Avalie o que o condominio entrega por {price}. | Conhecer o lazer |
| entrega-prazo | Pronto para morar agora | Sem espera de obra: unidade disponivel para mudanca imediata em {neighborhood}. Garanta a sua antes que esgote. | Ver disponibilidade |
| financiamento-entrada | Simule a entrada deste imovel | Condicoes de financiamento e entrada que cabem no seu planejamento, a partir de {price}. A Vitra ajuda na simulacao. | Simular financiamento |
| investimento-valorizacao | Bom imovel para investir | Localizacao consolidada e {differential2} sustentam valor de revenda e locacao em {neighborhood}. Veja a tese completa. | Avaliar como investimento |

## Proximos passos sugeridos (depois do aval do marketing)
1. Aprovar/ajustar a voz dos 20 angulos acima (1a leva; replicar para futuros templates).
2. Reescrever a copy das receitas com tokens inexistentes (`{offer}` no dual, `{area}` no patios).
3. Diferenciar o angulo de escassez por template.
4. Eliminar a reabertura do corpo com o bairro ja usado na headline (menino `bairro-destaque`).
5. Adicionar uma checagem de build: todo `{token}` de uma receita deve existir no field group do template.
