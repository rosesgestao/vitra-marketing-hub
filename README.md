# Vitra Marketing Hub

Plataforma operacional de marketing da Vitra — campanhas, geracao de criativos, identidade visual,
trafego pago, automacao, IA e metricas. **Multi-marca**: atende a **Vitra Imobiliaria** (marca-mae,
identidade principal do sistema) e a **Vitra Premium** (sub-marca de luxo), sem misturar as marcas.

> Renomeado de `vitra-premium-ferramenta-operacional` para `vitra-marketing-hub` (2026-06). O foco
> evoluiu de Premium-only para a marca-mae Vitra Imobiliaria como identidade principal, mantendo a
> Vitra Premium disponivel quando necessario.

## O que faz

- **Paineis por marca** (Imobiliaria / Premium): campanhas, assets, publicacoes e metricas reais (Supabase).
- **Trafego pago**: fila para gerar, revisar, aprovar e exportar criativos Meta Ads, por marca.
- **Estudio de Pecas**: capas/banners sociais (Facebook, LinkedIn, YouTube; Instagram/WhatsApp/E-mail no roadmap).
- **Copiloto de IA**: copy na voz da marca, extracao de fatos de anuncios e sugestao de template,
  com ancoragem anti-alucinacao (Supabase Edge Functions).
- **Geracao/renderizacao server-side** (Edge + Storage) e metricas por publicacao.

## Stack

- **Front:** React + Vite + Tailwind — em `dashboard/`.
- **Back:** Supabase (Postgres + Edge Functions + Storage).
- **Render headless (opcional):** `render-worker/` — dormente; ativacao em `render-worker/ACTIVATION.md`.

## Identidade visual (tema dinamico por marca)

O chrome do dashboard usa **Vitra Imobiliaria (navy + dourado) como tema principal** e re-tinge para
**Vitra Premium (preto + dourado, SEM azul)** quando um painel Premium esta ativo (variaveis de tema
por `data-brand` no `<html>`). Spec da marca em `BRAND.md`.

## Regra de Marca (dura)

Vitra Imobiliaria (marca-mae) e Vitra Premium (sub-marca de luxo) **nao misturam** assets, linguagem,
CTAs, templates, cores nem estrategia. Cada peca declara seu `brand_scope` e nunca cruza o de outra
marca. Imobiliaria = navy + dourado (com azul); Premium = preto + dourado (sem azul).

## Documentacao

- Cofre Obsidian: `obsidian/` (notas de atualizacao + "Ferramenta Operacional Premium").
- Brand System: `BRAND.md` (raiz) + brandbooks oficiais.
- Changelog tecnico: `CHANGELOG.md`.

## Repositorio

`https://github.com/leoferrazbrasil/vitra-marketing-hub`
