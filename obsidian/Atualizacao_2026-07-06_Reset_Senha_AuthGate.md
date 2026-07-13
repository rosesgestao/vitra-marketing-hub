# Fix/Feature — Redefinição de senha (link caía em localhost:3000) — 2026-07-06

Bug reportado (screenshots): o link de "Reset your password" (Supabase) abria `localhost:3000`
(ERR_CONNECTION_REFUSED) + `otp_expired`, em vez do painel de produção.

## Causa raiz (DUAS, somadas)
1. **`localhost:3000` = configuração no painel Supabase** (não código): o **Site URL** do projeto está em
   `http://localhost:3000` (dev). O e-mail de recuperação redireciona para o Site URL → conexão recusada.
2. **O app não tinha fluxo de redefinição** — nem pedir link, nem definir nova senha, nem tratar expirado.
   O `AuthGate` só tinha entrar/criar conta.

## Parte do CÓDIGO (feita — `dashboard/src/components/AuthGate.jsx`, commit `fac2000`)
- **"Esqueci minha senha"** → `resetPasswordForEmail(email, { redirectTo: window.location.origin })` (link
  volta para a origem atual; em produção, https://vitrapremium.com.br).
- **Tela "Definir nova senha"** → evento `PASSWORD_RECOVERY` → `updateUser({ password })`; prioridade sobre
  a sessão (pede a senha antes de entrar).
- **Link expirado/inválido** → lê o hash de erro (`otp_expired`/`access_denied`), mensagem amigável, abre em
  modo Redefinir, limpa o hash (não confunde o roteador por hash).
- Entrar/criar conta e o visual preservados; shell comum reaproveitado.

## Parte de CONFIG (AÇÃO DO LEONARDO — painel Supabase, fora do código) — PENDENTE
Projeto `birxcfkyuzqnhyvetbjv` → **Authentication → URL Configuration**:
- **Site URL** = `https://vitrapremium.com.br`
- **Redirect URLs** (allowlist): `https://vitrapremium.com.br`, `https://vitrapremium.com.br/**`, e
  (dev, opcional) `http://localhost:5173/**`.
Sem isso, o e-mail continua caindo em localhost — o código só resolve DEPOIS do Site URL apontar p/ produção.

## Verificação
lint + 278 testes + build. Tela de auth não abriu no preview (env do Supabase ausente no ambiente de
preview → renderer trava; sem erro de console/servidor; não é regressão). Validação visual do Leonardo
após ajustar o Site URL e o front novo subir na Hostinger.

[[deploy-hostinger-vitrapremium]] [[Atualizacao_2026-07-06_Fix_Foco_Modal]]
