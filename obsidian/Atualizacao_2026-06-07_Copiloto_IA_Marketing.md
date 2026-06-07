# Atualizacao 2026-06-07 — Copiloto de marketing imobiliario por IA (A / B' / fluxo unico / B)

> Continuacao de [[Atualizacao_2026-06-07_Autonomo_Estabilidade_Worker_UX]]. Virada de chave: a
> ferramenta deixa de ser "mais um gerador de imagem" e vira um COPILOTO que conhece a Vitra e
> progressivamente tira do operador o trabalho de pensar a peca — mantendo-o como APROVADOR.
> Detalhe tecnico no CHANGELOG.md (raiz). Tudo na `main`. **Secret ANTHROPIC_API_KEY setado pelo
> usuario -> copiloto VIVO** (4 Edges respondendo 200). So Vitra Imobiliaria por enquanto.

## A virada de produto
Reflexao do usuario: "gerar criativo se parece com o trabalho manual do Canva". Resposta: nao competir
com o Canva, e sim um copiloto que conhece a marca. Fluxo no modal Nova Campanha hoje:
> Colar anuncio -> **Sugerir template** -> confirmar -> **Extrair e gerar copy** -> revisar fatos+copy -> aprovar.

## Degrau A — copy na voz da marca (ATIVO)
- Edge `generate-copy` (Claude `claude-sonnet-4-6`, structured output): N angulos DISTINTOS de copy na
  voz da Imobiliaria (vs Premium editorial), com o vocabulario PROIBIDO da auditoria barrado.
- `_shared/copyValidation.ts` (puro): valida tamanho da headline, nome duplicado, vocabulario fora da
  marca. Pipeline: `aiCopyConcepts` usa a copy como receita LITERAL nas variacoes. UI no modal com
  rascunhos editaveis + badges de issue.

## Degrau B' — extrair fatos de um anuncio colado (ATIVO)
- Edge `extract-facts`: o dashboard passa os field specs do template (fonte de verdade) e a Edge monta
  a json_schema dinamicamente; a IA devolve por campo `{value, evidence, confidence, present}`.
- `_shared/factsExtraction.ts`: defesa ANTI-ALUCINACAO real — o PROPRIO valor precisa estar ANCORADO no
  texto (substring contigua com fronteira de palavra; numero puro com fronteira de digito); listas
  validadas item a item; evidence e so contexto, nunca passe-livre. Sem ancoragem -> campo descartado.
- **Revisao adversarial (workflow): 12 achados corrigidos**, inclusive 2 high que furavam o invariante
  (evidence validada separada do valor; recombinacao de tokens espalhados). 2 ceticos confirmaram fechado.

## Fluxo unico — extrair + gerar copy num clique (ATIVO)
- `handleExtractAndGenerate`: extrai -> aplica (fill-empty) -> gera copy do form ja preenchido. Usa o
  `nextForm` LOCAL (setForm e assincrono). Revisao pegou 1 regressao high (re-extrair granular apos o
  combinado prendia o estado `applied`) — corrigida.

## Degrau B — a IA sugere o template ideal (ATIVO)
- Edge `suggest-template`: recebe os templates da marca (id/nome/bestFor) e devolve `{template_id,
  rationale, confidence}`. Anti-alucinacao do id em 5 camadas (enum no schema + 4 checagens). O
  operador CONFIRMA ("Usar este template") — humano aprovador.
- Smoke-test em producao: anuncio de financiamento -> `financiamento-orla`; anuncio de amenidades ->
  `patios-gallery` (discrimina, confidence high). Revisao: "degrau B solido".

## Revalidacao ao vivo da copy (ATIVO)
- Ao editar um rascunho, os badges de issue RECALCULAM ao vivo (mesma `copyValidation` da Edge).
  `vite.config` ganhou `fs.allow:['..']` p/ o dashboard importar o `_shared` puro (fonte unica, sem
  drift). Verificado: dev serve o modulo (200) e o build bundla.

## Estado / metricas
- 131 testes; build + deno check + dev verdes. Tudo revisado adversarialmente (workflows ultracode).
- Custo trivial: ~157-1047 input tokens/chamada; system prompt de marca cacheado (ephemeral 5m).
- Seguranca: as 4 Edges usam `verify_jwt=false` + auth manual (aceita a anon/publishable). Como a chave
  Anthropic agora e paga e viva, os endpoints sao acessiveis a quem tiver a anon key (publica). Risco
  pratico baixo (ferramenta interna local, dashboard nao publicado), mas e um vetor de custo a fechar
  antes de qualquer deploy publico (auth de usuario / rate-limit).

## Pendente (gated no usuario) / proximo
- **Estender o copiloto ao Premium** (copy + template) — exige validacao de voz/Brand System (decisao de marca).
- **Refino**: persistir o `source_text` colado junto da campanha (proveniencia/auditoria) — exige migration.
- **Seguranca** das Edges de IA (auth de usuario / rate-limit) antes de deploy publico.
- Frentes anteriores seguem: ativar o worker (9:16 full-res), integracao Meta, ampliar a copy (marketing).
