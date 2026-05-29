# Instruções para IA

Esta nota resume como uma IA deve trabalhar na ferramenta operacional Vitra Premium.

## Documento Canonico

O guia tecnico completo esta em:

`docs/ai-instructions-vitra-premium-operacional.md`

Use esta nota como atalho dentro do Obsidian.

## Regras Essenciais

- Trabalhar sempre a partir do escopo oficial da ferramenta operacional Premium.
- Ler `06 - Escopo Oficial do Projeto` antes de mudancas grandes.
- Usar o brandbook Premium como fonte de verdade visual.
- Nao misturar Vitra Premium com Vitra Imobiliaria.
- Nao usar assets de `planejamento_vitra_premium/` como producao aprovada.
- Nao expor tokens no front-end.
- Registrar decisoes importantes no Obsidian.
- Commits da ferramenta devem ir ao repositorio dedicado quando forem parte da evolucao operacional.

## Fontes de Verdade

- [[00 - Indice]]
- [[06 - Escopo Oficial do Projeto]]
- [[05 - Registro de Decisoes]]
- [[../Atualizacao_2026-05-29_Ferramenta_Operacional_Premium_Fase_1]]
- `docs/brand/vitra-premium-brandbook.html`
- `docs/ai-instructions-vitra-premium-operacional.md`

## Identidade Premium

Vitra Premium deve parecer:

- preto + dourado;
- luxo discreto;
- editorial;
- sofisticado;
- consultivo;
- alto padrao;
- focado em curadoria e patrimonio.

Nunca usar visual generico, roxo, azul dominante, ornamentos baratos ou linguagem popular.

## Fluxo de Trabalho

1. Entender o pedido.
2. Ler as notas e arquivos relevantes.
3. Implementar com escopo controlado.
4. Validar build/testes.
5. Atualizar o cofre se a decisao for relevante.
6. Commitar no repositorio correto.

## Estado Atual

- Fase 1 React + Supabase iniciada.
- Supabase oficial: `Marketing Vitra Imobiliaria` (`birxcfkyuzqnhyvetbjv`).
- Repositorio dedicado: `leoferrazbrasil/vitra-premium-ferramenta-operacional`.
- Proxima etapa: backend de jobs, renderizacao server-side e Supabase Storage.
