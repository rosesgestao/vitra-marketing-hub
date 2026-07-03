# Login real (Supabase Auth) — endurecimento das Edges de IA para o deploy público (2026-07-03)

## Contexto
Depois do fix do "Importar do link", o passo "Extrair e gerar copy" dava **"Acesso negado: x-copilot-gate
ausente"**. Causa: as Edges de IA (paga/Anthropic) exigiam o gate token, mas o dashboard público não
manda `VITE_COPILOT_GATE` (não pode — vazaria no bundle). O próprio `edgeAuth.ts` já avisava: "antes de
deploy PÚBLICO, endurecer com auth de usuário real". **Decisão do Leonardo: login de verdade (Supabase Auth).**

## Entregue
- **`edgeAuth.ts`:** novo caminho autorizado = **usuário autenticado** (JWT com `role='authenticated'`),
  checado antes do anon. `verify_jwt=true` (config.toml) faz a plataforma validar a assinatura antes → o
  edge lê o `role` decodificado com segurança (JWT forjado não passa). Service role segue isenta; anon+gate
  vira caminho só-DEV. `jwtRole()` decodifica o payload. Campo `via` p/ observabilidade.
- **`config.toml`:** `verify_jwt=true` nas 10 Edges gated (generate-copy/content, extract-facts,
  suggest-template, publish-meta-ads, sync-metrics, suggest-meta-audiences, manage-audiences,
  geocode-address, agente-operacao). render-asset e fetch-listing-text ficam abertas.
- **Cliente:** `AuthGate` (novo) — sessão via supabase.auth + tela de **login on-brand** (navy+dourado,
  logo Vitra) + botão **Sair** (canto inf-esquerdo). `main.jsx` embrulha `<App/>` no `<AuthGate>`. O
  supabase-js anexa o JWT do usuário nas chamadas automaticamente → copiloto autoriza por login.
- **RLS:** verificado — todas as políticas já cobrem `{anon,authenticated}` (ou `{public}`) → autenticado
  não quebra o banco.

## Verificação
- Ao vivo: `extract-facts`/`generate-copy` SÓ com anon → **403 "faça login"** (proteção da API paga);
  `fetch-listing-text` (não-gated) → 200. 240 testes (edgeAuth +2: user autorizado, anon negado) + lint +
  deno check + build OK. 10 Edges deployadas (CLI).

## Ações do Leonardo no Supabase (não posso fazer — criar conta/senha)
1. **Criar usuário:** Authentication → Users → Add user (e-mail+senha, Auto Confirm). **auth.users=0 hoje**
   → sem usuário ninguém entra. Fazer ANTES de ativar o login.
2. **Desativar cadastro público:** Authentication → Email → desligar "Allow new users to sign up" (senão
   qualquer um se auto-registra).

## Rollout (PUSH SEGURADO)
O commit foi feito mas **NÃO** foi pushado ainda: o push ativa a parede de login no ar e, com 0 usuários,
trancaria o app. Sequência: (1) criar o usuário → (2) push → (3) rebuild Hostinger → logar.
DEPLOY.md seção 2.1. [[deploy-hostinger-vitrapremium]] [[validacao-criativo-arquitetura]]
