# DEPLOY — vitrapremium.com.br (Hostinger)

Runbook de publicação do **dashboard** (Vitra Marketing Hub) na **raiz** de `https://vitrapremium.com.br`,
via deploy de GitHub da Hostinger. Escrito em 2026-07-02.

---

## 1. Arquitetura (o que é publicado)

- O dashboard é uma **SPA estática** (React 18 + Vite 5). `npm run build` gera `dashboard/dist/` (HTML +
  JS + CSS + assets). **Não há servidor Node em produção** para o dashboard — a Hostinger serve os
  arquivos estáticos de `dist/`. Portanto **não se aplica** `process.env.PORT`, endereço de escuta,
  proxy reverso ou script de start.
- O **back-end** é o **Supabase** (Postgres + Storage + Edge Functions), hospedado no próprio Supabase
  (`https://birxcfkyuzqnhyvetbjv.supabase.co`) — **fora da Hostinger**. O front fala com ele via HTTPS.
- O **render-worker** (Node + Puppeteer) é **opcional e dormente**, hospedado no **Fly.io**, não na
  Hostinger. Não faz parte deste deploy.
- **Roteamento por hash** (`#/metricas`, `#/pecas:facebook`). Como a rota vive no fragmento (`#`), o
  servidor sempre entrega `index.html` e **não há 404 ao atualizar uma rota interna** — nenhum rewrite/
  fallback SPA é necessário no host.
- **`base` do Vite = `/`** (default) → assets referenciados a partir da raiz (`/assets/...`). Publica
  direto na raiz do domínio, **sem subdiretório**.

## 2. Configurações da Hostinger (deploy de GitHub)

| Campo | Valor |
|-------|-------|
| Fonte | GitHub (branch `main`) |
| Framework | Vite |
| **Diretório raiz** | `dashboard` |
| Versão do Node | **22.x** |
| Comando de instalação | `npm install` (padrão) |
| Comando de build | `npm run build` (padrão) → gera `dist/` |
| Diretório de saída | `dist` (padrão do Vite) |
| Domínio | `vitrapremium.com.br` (raiz) |

Essas são as configurações já usadas no deploy atual (confirmadas na tela "Implantação concluída").

## 3. Variáveis de ambiente (BUILD) — **passo que faltava**

O Vite injeta variáveis `VITE_*` **em tempo de build**. O arquivo `.env` é **gitignored**, então o build
do GitHub **não** enxerga o `.env` local. É preciso definir as variáveis no **painel do app na Hostinger**
(Configurações → Variáveis de ambiente) e **redeployar** (rebuild).

**Obrigatórias:**

| Variável | Valor | Observação |
|----------|-------|------------|
| `VITE_SUPABASE_URL` | `https://birxcfkyuzqnhyvetbjv.supabase.co` | Tem fallback no código, mas defina explicitamente. |
| `VITE_SUPABASE_ANON_KEY` | *(a chave `anon`/`publishable` do projeto)* | **Causa do "Invalid API key".** Chave **pública** (RLS protege os dados). |

Onde obter a `anon key`: **Supabase → Project Settings → API → Project API keys → `anon` `public`**.

**Não definir em produção** (são de dev / segredos — não vão ao front):
`VITE_COPILOT_GATE`, `WORKER_RENDER_URL`, `WORKER_RENDER_TOKEN`, `VITE_WORKER_RENDER_9X16`.

> Prova do mecanismo: um build com `VITE_SUPABASE_ANON_KEY` vindo **do ambiente** (não do `.env`) injeta
> a chave no bundle e remove o fallback `missing-public-key`. Logo, definir a var na Hostinger + rebuild
> resolve o erro. Nenhuma mudança de código é necessária.

## 4. Procedimento para corrigir a produção agora

1. Hostinger → app `vitrapremium.com.br` → **Configurações → Variáveis de ambiente**.
2. Adicionar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (valores acima).
3. **Redeploy / Rebuild** (a var só entra no bundle em um novo build).
4. Abrir `https://vitrapremium.com.br` → o banner "Invalid API key / Chave pública ausente" desaparece e
   os painéis carregam.

## 5. Domínio / SSL / www

- **SSL:** a Hostinger provê certificado gratuito (Let's Encrypt) para o domínio. Garantir "Forçar
  HTTPS" ligado no painel de domínio.
- **www → raiz:** definir `www.vitrapremium.com.br` como redirect 301 para `https://vitrapremium.com.br`
  (ou vice-versa) no painel de domínio/DNS da Hostinger. É configuração de host, não de código.
- **Conteúdo misto:** não há — todas as chamadas externas do front são HTTPS (`supabase.co`).

## 6. Testes pós-deploy (checklist)

- [ ] `https://vitrapremium.com.br` abre a SPA (sem página padrão da Hostinger, sem tela branca).
- [ ] Redirecionamento HTTP → HTTPS e www → raiz.
- [ ] **Sem** banner "Invalid API key / Chave pública ausente".
- [ ] Navegar entre telas (Conteúdo, Tráfego Pago, Métricas, Estúdios) e **atualizar (F5)** numa rota
      interna (`#/metricas`) → continua na tela certa (sem 404).
- [ ] Cards de contagem (Conteúdos/Rascunhos/Agendados/Publicados) leem do Supabase.
- [ ] Console do navegador sem erros de rede/CORS; assets/fontes/logos (`/brand/...`, `/generated/...`,
      `/pecas/...`) carregam 200.
- [ ] Responsivo em desktop e mobile.
- **Degradação esperada em produção** (não são bugs): "Importar do link", conversão HEIC no servidor e
      ingestão de imagem por URL usam middleware **de dev** (`vite.config.js`), inexistente no estático →
      o fluxo cai para colar texto / upload direto. Copiloto de IA (gerar copy/conteúdo) depende do gate
      das Edges; se as Edges exigirem `COPILOT_GATE`, essas ações retornam 403 em produção (avaliar à
      parte se for necessário liberar).

## 7. Atualização futura (fluxo normal)

1. `git push` para `main` → a Hostinger builda e publica automaticamente.
2. Antes do push, localmente: `cd dashboard && npm ci && npm run lint && npm run test:run && npm run build`.
3. As variáveis de ambiente **persistem** entre deploys — só reconfigurar se mudarem.

## 8. Rollback

- **Via Hostinger:** no histórico de implantações do app, **reverter para o deploy anterior** (build já
  validado). É o caminho mais rápido.
- **Via Git:** `git revert <sha>` do commit problemático + `git push` (dispara novo build limpo). Evitar
  `reset --hard` no `main` remoto.
- **Backup da config atual (para restaurar):**
  - Diretório raiz `dashboard`, Node `22.x`, install `npm install`, build `npm run build`, saída `dist`.
  - Branch `main`, framework Vite, deploy de GitHub.
  - Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (as duas acima).

## 9. Arquivos deste ajuste

- `DEPLOY.md` (este runbook) — **novo**.
- `dashboard/.env.example` — nota de produção sobre as variáveis de build.
- **Nenhuma mudança em regra de negócio, funcionalidade ou identidade visual.** O código do dashboard já
  estava pronto para a raiz (hash routing, `base:/`, sem `localhost`, HTTPS-only); faltava apenas a
  variável de build na Hostinger.
