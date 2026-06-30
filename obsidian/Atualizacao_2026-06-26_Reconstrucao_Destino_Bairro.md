# Atualização 2026-06-26 — Reconstrução do "Bairro em destaque (pôster)" via Direção de Arte

Primeira aplicação da skill **Direção de Arte** num caso real: reconstruir o template `destino-bairro`
tendo a arquitetura de um anúncio de referência (estilo "destino", eixo central, painel de condições) como
norte — **sem copiar marca/logo/texto/imagem**, só a direção de layout, com identidade e conteúdo Vitra.

## Diagnóstico (por que o gerado ficava distante da referência)
Causa-raiz: a *arquitetura* estava certa, mas as **regras de composição eram frouxas**:
1. **Colunas do painel desbalanceadas** — `destinoConditionColumn` fitava cada coluna sozinha e ancorava
   no topo; `destinoSplitHighlight("Entrada facilitada")` não acha número → vira tudo "big". Resultado:
   "Até 120x"(grande) vs "Entrada facilitada"(maior ainda), sem centro comum.
2. **Herói sem ar** — `heroBudget` largo demais → o nome do bairro sangrava de margem a margem.
3. **Eixo quebrado** — a tag/selo no canto esquerdo competia com a logo central.
4. **Profundidade suja** — o véu saltava opacidade 1→0 em ~20% da altura (transição dura, foto escura).
5. **Sem assinatura** — só uma régua dourada chapada (sem elemento de marca memorável).

## Reconstrução (no motor, não superficial)
- **Colunas balanceadas:** `destinoConditionColumn` reescrito — recebe um **tamanho de destaque
  COMPARTILHADO** (menor fit das duas colunas → pesos iguais) e **centra o bloco verticalmente** em um
  centro comum. As duas condições passam a ter o mesmo peso visual.
- **Assinatura Vitra:** régua dourada com o **facet (▲)** ao centro (dois segmentos flanqueando o triângulo)
  no lugar da régua chapada — o elemento de marca da peça.
- **Eixo central:** tag vira **eyebrow centrado sob a logo** (era canto esquerdo).
- **Ar no herói:** `heroBudget` reduzido (feed 760, story 720) + `heroBase` do story 168→150 → o nome do
  bairro respira nas laterais.
- **Profundidade:** véu navy→foto com **mais stops** (transição suave) e base menos pesada → foto mais
  luminosa/aspiracional, com sensação de profundidade.
- 3 formatos adaptados: feed/story centrados; wide como banner à esquerda (foto à direita, véu horizontal).

## Verificação (render real dos 3 + comparação com a referência)
deno check + lint + 172 testes + build OK; deploy via CLI. Renderizei feed/story/wide → **`lint.ok=true []`
nos três**. Inspeção visual: eixo central, herói com ar, facet, **2 colunas de mesmo peso**, pílula com
profundidade, transição suave — fiel à arquitetura da referência, 100% identidade Vitra (navy+dourado,
Anton/Inter, sem nada proprietário de terceiros). Bump `destino-bairro-poster-v4` + **6 previews**
regerados (3 formatos × com/sem moldura). Assets de teste removidos.

## Aprendizado de motor (registrado no playbook da skill)
- O `fitDisplaySize` (modelo de largura por glifo) **subestima o Anton real** — um `heroBase` alto "cabe"
  no budget e renderiza largo demais. Para herói Anton, manter `heroBudget`/`heroBase` conservadores e
  **verificar no render** (o lint não pega isso: a caixa estimada é mais estreita que o glifo real).
- **Cold-isolate:** 2 renders saíram com **todo o texto sumido** (resvg desenha shapes e descarta o texto)
  e 1 render pegou **isolate quente com código antigo** logo após o deploy. Re-render resolveu os dois.
  Padrão a lembrar: após deploy + arte nova, conferir 1 corte e re-renderizar se vier texto-dropado/antigo.

## Critérios de aceite (atingidos)
Mesmo conceito de direção (eixo central + herói-região + painel de condições + pílula + profundidade);
hierarquia previsível; colunas balanceadas; herói com margem; assinatura de marca; transição de foto suave;
`lint.ok=true` nos 3 formatos; identidade Vitra sem elementos proprietários da referência.

Commit: reconstrução do destino-bairro (colunas balanceadas + facet + eyebrow central + ar do herói + véu)
+ bump/preview + playbook da skill.
