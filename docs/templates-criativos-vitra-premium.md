# Templates de Criativos Vitra Premium

Atualizado em: 2026-06-02

## Leitura das referencias

A pasta `referencias-criativos-exemplos-vitra-premium/` contem 11 criativos de referencia com bom apelo comercial, mas com linguagem visual mais proxima de varejo imobiliario: azul dominante, chamadas de preco muito agressivas, caixas fortes e excesso de informacao visual.

Para Vitra Premium, a decisao tecnica foi preservar a logica de performance dessas referencias, mas converter a estetica para um sistema editorial preto + dourado, com mais respiro, tipografia Playfair/Inter, foto como protagonista e CTA consultivo.

## Modelos aprovados para geracao automatica

1. `premium-photo-offer`
   - Uso: imagem do imovel com alto apelo visual imediato.
   - Estrutura: foto full-bleed, moldura dourada fina, headline editorial, CTA e chip de oferta.

2. `premium-editorial-panel`
   - Uso: awareness, autoridade, investimento e posicionamento.
   - Estrutura: painel preto editorial com tipografia forte, foto como contraponto e CTA discreto.

3. `premium-dark-spec`
   - Uso: diferenciais, captacao de lead e argumentos racionais.
   - Estrutura: foto escurecida, painel tipografico, lista curta de atributos e CTA consultivo.

4. `premium-location-panorama`
   - Uso: localizacao, vista, bairro, orla e tese de valorizacao.
   - Estrutura: imagem ampla, base editorial e marcador dourado de localizacao/oferta.

5. `premium-gallery-proof`
   - Uso: prova visual, variedade de ambientes e estrutura do empreendimento.
   - Estrutura: composicao editorial com area de imagem e painel de prova sem excesso comercial.

## Aplicacao na ferramenta

- O usuario nao precisa escolher o template manualmente.
- Cada conceito criativo de Meta Ads recebe automaticamente um `visual_template` no metadata.
- Cada variacao continua gerando os tres cortes obrigatorios: `1:1`, `9:16` e `1.91:1`.
- O card de Trafego Pago exibe o nome do modelo visual aplicado para facilitar QA.
- O pacote exportado inclui `visual_template` por anuncio e por placement.

## Regra de marca

Os modelos nunca devem voltar para azul dominante ou composicao de varejo. O padrao Premium e preto + dourado, editorial, sofisticado, com copy consultiva e foco em curadoria.
