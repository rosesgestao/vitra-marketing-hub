# Ferramenta Operacional Premium

Central de documentacao do desenvolvimento da ferramenta operacional para criacao, aprovacao, publicacao e acompanhamento de conteudos da Vitra Premium.

## Objetivo

Transformar o prototipo local `planejamento_vitra_premium/dashboard-conteudo.html` em uma ferramenta operacional conectada ao ecossistema do projeto:

- criacao de campanhas Vitra Premium;
- geracao de conteudos para redes sociais;
- aprovacao de assets e copies;
- renderizacao e armazenamento dos criativos;
- publicacao ou registro de publicacoes;
- coleta de metricas por publicacao;
- aprendizado para novas campanhas.

## Notas Principais

1. [[01 - Visao Geral da Ferramenta]]
2. [[02 - Diagnostico do Dashboard Atual]]
3. [[03 - Arquitetura Operacional Desejada]]
4. [[04 - Roadmap de Desenvolvimento]]
5. [[05 - Registro de Decisoes]]
6. [[06 - Escopo Oficial do Projeto]]
7. [[07 - Instrucoes para IA]]
8. [[08 - Auditoria e Plano de Evolucao]]
9. [[09 - Plano de Consolidacao da Geracao de Criativos]]

## Atualizacoes do Projeto

- [[../Atualizacao_2026-05-29_Ferramenta_Operacional_Premium_Fase_1]]
- [[../Atualizacao_2026-06-01_Automacao_Trafego_Pago_Premium]]
- [[../Atualizacao_2026-06-04_Templates_Vitra_Imobiliaria_Trafego_Pago]]
- [[../Atualizacao_2026-06-05_Variacoes_Por_Template_Aprovado]]
- [[../Atualizacao_2026-06-06_Geracao_Automatica_Render_Asset]]
- [[../Atualizacao_2026-06-06_Limpeza_Honestidade_UI]]
- [[../Atualizacao_2026-06-06_Fase0_Rede_de_Seguranca]]

## Estado Atual

- Plataforma operacional multi-marca em evolucao, com ambientes separados para Vitra Premium e Vitra Imobiliaria.
- Projeto Supabase confirmado: `Marketing Vitra Imobiliaria` (`birxcfkyuzqnhyvetbjv`).
- Migracao multi-marca aplicada no Supabase.
- Assets aprovados das duas marcas centralizados em `dashboard/public/brand/`.
- Templates aprovados da Vitra Imobiliaria registrados para trafego pago e disponiveis como catalogo operacional no modal `Nova Campanha`, com campos e slots de imagem dinamicos por template.
- Fases 1-3 concluidas (campanha -> assets -> aprovacao -> render server-side -> Storage); Fase 4 parcial (publicacao manual); Fase 5 parcial (metricas manuais, integracao Meta ainda ausente). Ver [[08 - Auditoria e Plano de Evolucao]].
- Auditoria senior realizada em 2026-06-06 e pass de honestidade da UI ja aplicado na `main`.
- Plano detalhado da geracao de criativos registrado em [[09 - Plano de Consolidacao da Geracao de Criativos]].
- Fase 0 (rede de seguranca: Vitest + 41 testes + CI) concluida na branch `fase0/rede-de-seguranca`.
- Em andamento: Fase 7 (Estabilizacao, Seguranca e Qualidade) — proximo passo e a Fase 1 do plano da pipeline (drain unico server-side com claim atomico e maquina de estados).

## Arquivos de Referencia

- Repositorio GitHub dedicado: `https://github.com/leoferrazbrasil/vitra-premium-ferramenta-operacional`
- `planejamento_vitra_premium/dashboard-conteudo.html`
- `planejamento_vitra_premium/README.md`
- `planejamento_vitra_premium/estrategia-conteudo-vitra-premium.md`
- `planejamento_vitra_premium/guia-produtos-vitra-premium.md`
- `dashboard/`
- `docs/ai-instructions-vitra-premium-operacional.md`
- `supabase/schema.sql`
- `src/agents/agent1-orquestrador.js`
- `src/agents/agent8-publicador.js`

## Regra de Marca

Esta ferramenta opera ambientes de marca separados. Vitra Premium e Vitra Imobiliaria nao devem misturar assets, linguagem, CTAs, templates ou estrategia sem validacao explicita do Brand System Vitra.
