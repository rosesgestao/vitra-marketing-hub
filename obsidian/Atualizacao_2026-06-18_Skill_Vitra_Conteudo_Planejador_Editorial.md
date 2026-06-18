# Atualizacao 2026-06-18 — Skill `vitra-conteudo` (planejador editorial orgânico)

> Analise (dev+PO): a inteligencia editorial POR POST ja existe no app (Edge generate-content +
> contentPlaybook + copyValidation). A unica LACUNA "skill-shaped" e o **planejamento em lote**
> (calendario/pauta). Criada UMA skill enxuta para isso — sem duplicar a geracao por-post.
> Skill LOCAL (`.claude/` e gitignored, como gerar-criativo); por isso so esta nota e versionada.

## Por que uma skill (e por que so essa)
- Ja coberto pelo app (NAO virar skill): ideias, legendas, roteiros, adaptacao por formato, pilares,
  tom de voz, status/producao — tudo no `generate-content` + `contentPlaybook` + funil. Uma skill que
  refizesse isso DUPLICARIA a fonte unica (voz/regras vivem em `_shared/`, testadas no Vitest).
- Lacuna real (skill-shaped, multi-step, estrategica): **calendario editorial** + **curadoria de pauta**
  em lote — o gerador single-shot (3 ideias de 1 tipo) nao faz.

## A skill (`.claude/skills/vitra-conteudo/`)
- **Funcao:** de um briefing (marca / periodo / foco), monta um PLANO editorial completo: pauta
  distribuida por pilares (equilibrio de funil), cadencia, mix de formatos; por post entrega tema/gancho,
  legenda pronta, CTA, hashtags, roteiro (so Reels/Stories) e direcao visual — na voz da marca.
- **Reutiliza a fonte unica:** consome `contentPlaybook.ts` (pilares/tipos/formatos/tons/status) e
  `copyValidation.ts` (vocab proibido por marca). `references/playbook-editorial.md` espelha os .ts
  (autoridade = codigo).
- **Saida dupla:** (A) calendario em markdown para revisao + (B) JSON no formato `createContentPost`
  (contentType/pillar/format/platform/title/caption/cta/hashtags/script/visual/scheduled_for) —
  importavel para `premium_content_posts` (board do funil). Ponte natural: futuro botao "Importar plano".
- **Fronteira:** NAO gera post avulso (isso e o "Gerar posts" do app); a skill PLANEJA em lote.
  Conversacional (chat/Claude Code), sem tokens no front.

## Verificacao (smoke test, subagente independente)
Briefing "plano de 1 semana, Vitra Imobiliária, foco primeiro imovel/financiamento, a partir de
2026-07-06": a skill leu os .ts, montou 5 posts com funil equilibrado (2 educativo + autoridade +
bastidores/Reels + prova social), legendas completas na voz Imobiliária, **zero vocab Premium**, sem
inventar preco, roteiro so no Reels, e JSON valido no shape do createContentPost com datas reais.

## Follow-ups
- Botao "Importar plano" no dashboard (le o JSON da skill -> createContentPost em lote). Fecharia
  planejamento->producao->funil de ponta a ponta.
- Opcional: rodar o otimizador de descricao da skill (run_loop) para afinar o trigger.

Ver [[conteudo-organico]] e [[Atualizacao_2026-06-18_Conteudo_Gerar_Posts_Remove_Render_Pago]].
