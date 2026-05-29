# Registro de Decisoes

## 2026-05-29 - Inicio da Documentacao Operacional

Foi criada esta pasta no cofre Obsidian para registrar o desenvolvimento da ferramenta operacional Premium antes de iniciar implementacao.

### Contexto

O arquivo `planejamento_vitra_premium/dashboard-conteudo.html` ja funciona como prototipo local para criacao de campanhas e conteudos Vitra Premium.

O objetivo agora e evoluir esse prototipo para uma ferramenta operacional conectada a banco, storage, publicacao e metricas.

### Decisoes Iniciais

- Documentar antes de implementar.
- Tratar o HTML atual como prototipo/referencia, nao como sistema final.
- Migrar a experiencia para o dashboard React existente em `dashboard/`.
- Usar Supabase como fonte de verdade para campanhas, assets, publicacoes e metricas.
- Manter separacao rigida entre Vitra Premium e Vitra Imobiliaria.
- Nao expor tokens de redes sociais no front-end.

### Pendencias

- Definir schema SQL final.
- Definir status oficiais de campanha e asset.
- Definir quais metricas serao coletadas de Instagram/Facebook organicamente.
- Definir se publicacao sera automatica, manual ou hibrida.
- Revisar compatibilidade entre schema atual `metricas` e os coletores existentes.

## 2026-05-29 - Repositorio GitHub Dedicado

Foi criado um repositorio exclusivo para o desenvolvimento da ferramenta operacional Premium.

### Repositorio

`https://github.com/leoferrazbrasil/vitra-premium-ferramenta-operacional`

### Decisoes

- Repositorio criado como privado.
- Nome escolhido: `vitra-premium-ferramenta-operacional`.
- O repositorio atual `vitra-agentes-marketing` segue como base de referencia e cofre historico.
- Nenhum codigo foi migrado ou copiado ainda para o novo repositorio.

### Proximo Passo

Definir o escopo inicial do novo repositorio antes de clonar/pushar arquivos: app React isolado, pacote full-stack, ou extracao gradual a partir de `dashboard/` e `planejamento_vitra_premium/dashboard-conteudo.html`.

## 2026-05-29 - Escopo Oficial Definido

O escopo oficial do projeto foi definido a partir da analise do que falta para transformar o prototipo `dashboard-conteudo.html` em ferramenta operacional.

### Referencia

[[06 - Escopo Oficial do Projeto]]

### Prioridade

1. Migrar o dashboard Premium para React + Supabase.
2. Criar tabelas de campanha, assets, publicacoes e metricas.
3. Mover geracao e renderizacao para backend com Supabase Storage.
4. Implementar integracao Meta para importar publicacoes e metricas por post.

## 2026-05-29 - Fase 1 Iniciada e Base Aplicada

Foi iniciada a migracao do prototipo Premium para o dashboard React existente em `dashboard/`.

### Entregas

- Criada a tela principal `Premium` no dashboard React.
- Criado o formulario `Nova campanha` conectado ao modelo Premium.
- Criada a camada de dados React/Supabase para campanhas, assets, posts, publicacoes, metricas, jobs e contas sociais.
- Criada a migracao `supabase/migration-premium-operational.sql`.
- Aplicada a migracao no projeto Supabase `birxcfkyuzqnhyvetbjv`.
- Confirmado via REST que as 8 tabelas Premium estao acessiveis pelo dashboard.

### Decisoes

- A Fase 1 cria assets e conteudos como registros planejados, nao como artes finais.
- A renderizacao com `card-builder.js`, Storage e jobs reais fica para a Fase 2/3.
- Tokens de Meta, Instagram, Facebook e Ads nao serao armazenados no browser.
- O acesso RLS da migracao esta permissivo para a Fase 1 e deve ser endurecido com autenticacao antes de producao publica.

## 2026-05-29 - Cofre Atualizado com Estado Atual da Fase 1

Foi criada a nota [[../Atualizacao_2026-05-29_Ferramenta_Operacional_Premium_Fase_1]] para registrar o estado atual completo entre a ultima atualizacao do cofre e o projeto atual.

### Confirmacoes

- Conta Supabase confirmada: `souleonardobrasil`.
- E-mail Supabase confirmado: `github@leonardobrasil.com.br`.
- Organizacao Supabase confirmada: `Vitra Imobiliaria`.
- Projeto Supabase confirmado: `Marketing Vitra Imobiliaria`.
- URL Supabase confirmada: `https://birxcfkyuzqnhyvetbjv.supabase.co`.
- Repositorio exclusivo atualizado: `leoferrazbrasil/vitra-premium-ferramenta-operacional`.
- Commit do repositorio exclusivo: `d22eb86 feat: add premium operational dashboard phase 1`.
- Commit do repositorio base: `01779f8 feat: add premium operational dashboard phase 1`.

### Decisao

O cofre passa a tratar o repositorio exclusivo `vitra-premium-ferramenta-operacional` como a base dedicada da ferramenta operacional Premium, enquanto `vitra-agentes-marketing` segue como base historica, vault e ecossistema de agentes.
