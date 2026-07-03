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

## Cadastro (2ª parte, mesmo dia)
Leonardo pediu **sistema de cadastro** na tela. `AuthGate` ganhou modo **Criar conta** (nome, e-mail,
senha+confirmação, validações, toggle) via `supabase.auth.signUp`; se a confirmação de e-mail estiver
ligada, mostra "confirme seu e-mail" e volta ao login. Verificado no preview (login + cadastro
renderizam on-brand, console limpo). **Escolha do Leonardo: cadastro ABERTO com confirmação de e-mail**
(qualquer e-mail válido se registra + confirma antes de entrar). Trade-off consciente: o copiloto pago
fica acessível a quem se cadastrar. Auto-cadastro resolve o lockout (não precisa mais criar usuário à mão).

## Config Supabase (Authentication → Email)
Manter **"Allow new users to sign up" LIGADO** + **"Confirm email" LIGADO** (padrões). Recomendado criar
1 conta pelo painel (Auto Confirm) como fallback garantido. SMTP embutido cobre baixo volume; próprio p/
produção séria.

## Rollout
Com auto-cadastro, sem risco de lockout (registra o 1º acesso). Sequência: (1) confirmar signups ON +
confirm email ON + criar fallback → (2) push → (3) rebuild Hostinger → cadastrar/logar. DEPLOY.md §2.1.
[[deploy-hostinger-vitrapremium]] [[validacao-criativo-arquitetura]]
