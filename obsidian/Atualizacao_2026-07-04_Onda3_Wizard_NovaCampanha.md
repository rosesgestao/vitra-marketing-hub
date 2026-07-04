# Onda 3 — wizard de Nova Campanha: <Modal> + 3 passos + confirm-close — 2026-07-04

Autorizado pelo Leonardo a commitar para testar ao vivo em vitrapremium.com.br (parede de login impede o
teste de fluxo aqui). Pacote completo do NewCampaignModal.

> **✅ VALIDADO NO AR (2026-07-04):** Leonardo testou em produção — o fluxo do wizard funcionou sem erro e
> uma "Nova campanha" foi criada/publicada de ponta a ponta. O maior risco da Onda 3 (mudança na tela mais
> crítica, sem teste visual do meu lado) está confirmado em produção.

## Feito
1. **Migração para `<Modal>`**: o overlay cru virou o primitivo `<Modal>` (size xl). Ganha foco-preso, Esc,
   scroll-lock, restauração de foco, role=dialog/aria-modal. O corpo (form) vai no body rolável do Modal;
   o erro + a navegação vão no `footer` sticky do Modal.
2. **Wizard de 3 passos** (o modal-monólito de ~7 seções vira etapas):
   - **1 Template**: variações + catálogo de templates + importar de anúncio/IA.
   - **2 Dados & copy**: campos do template (ou fallback Dados/Textos) + copiloto de copy.
   - **3 Imagens & revisão**: upload de imagens.
   - Header de progresso clicável (passo ativo/concluído com ✓), nav **Voltar/Avançar/Criar Campanha**
     (Criar só no passo 3). Seções gated por `hidden` (montadas — preservam estado ao navegar). Enter/submit
     nos passos 1-2 apenas AVANÇA; a validação/criação roda no passo 3.
3. **Validação com salto de passo** (soma ao fix anterior): campo obrigatório faltante → pula para o passo
   dele (campos=2, imagens=3) + foco/scroll/borda vermelha no 1º.
4. **Confirm-close** (necessário porque o `<Modal>` fecha por Esc/scrim): `handleClose` pede confirmação de
   descarte quando `dirty` (qualquer edição/`update` marca dirty) — não perde a copy gerada por IA.

## Verificação possível (sem login)
build 1558 módulos + 240 testes + lint; reload limpo, React monta. **O fluxo em si (navegar passos,
validar, fechar) é teste do Leonardo no ar.** `window.confirm` no descarte é pragmático (confirm-in-app
seria modal-sobre-modal) — anotado p/ refino.

## Checklist p/ o teste ao vivo
Abrir Tráfego Pago → Nova campanha: passos aparecem? Avançar/Voltar navegam? Criar só no passo 3? Submeter
sem campo obrigatório pula pro passo/campo certo? Esc/X/cancelar com dados pede confirmação? Criar campanha
completa funciona igual antes? [[Atualizacao_2026-07-04_Onda3_Validacao_Foco]] [[deploy-hostinger-vitrapremium]]
