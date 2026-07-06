# Feature — Página inicial do dashboard (Início / #/inicio) — 2026-07-06

Criada a **tela de entrada** do dashboard (não existia; o pós-login caía direto no painel da marca-mãe).
Pedido conduzido sob a lente `ui-ux-pro-max` (AI/hierarquia/a11y/responsividade), com a **identidade Vitra
como autoridade** (brandbook/frontend-design). Decisão do Leonardo: contexto **marca-mãe (Imobiliária)**.

## Rota
Nova view `inicio` → hash `#/inicio`, item **"Início"** na seção **Central** (topo do menu), e novo
**`DEFAULT_VIEW_ID`** (pós-login sem hash cai na home). Retornantes com `localStorage` seguem na última
tela — sem regressão. Também na busca ⌘K (deriva de `NAV_SECTIONS`). Reversível.

## Arquivos
- **Novo:** `dashboard/src/views/Inicio.jsx`.
- **Editado (mínimo):** `dashboard/src/App.jsx` (import + item de menu + branch de render + default).
- Sem tocar em auth, permissões, schema ou outras views.

## Blocos (7)
1. Saudação ao usuário logado (`supabase.auth` → full_name/e-mail) + contexto de marca + data + **CTA
   primária única** (Nova campanha).
2. **4 KPIs reais**: Campanhas · Criativos gerados (`public_url` + `generated/approved`) · Aguardando
   revisão (`generated`) · Templates (catálogo `selectableCreativeTemplatesForBrand`).
3. Ações rápidas (Nova campanha, Tráfego, Catálogo, Criativos, Calendário, Métricas).
4. Campanhas recentes (dados reais: nome, status, nº criativos, "atualizada há…").
5. Status operacional — **alertas derivados** (aguardando revisão, aguardando geração
   `isRenderablePendingAsset`, campanha sem criativo aprovado); "Operação em dia" quando vazio.
6. **Launchpad de módulos** — inclui os painéis das DUAS marcas (Premium a 1 clique) **sem carregar/
   misturar dados Premium** (separação de marca preservada).
7. Próximos passos contextuais (muda conforme haja ou não campanhas/criativos/métricas).

## Dados & estados
SÓ dados reais via `loadPremiumWorkspace({ brandScope: imobiliaria })` (leitura; **backend zero**). Sem
dado → **estados vazios úteis com CTA** (nada fabricado; métrica de tráfego ausente vira orientação, não
número falso). Skeletons no load, `ErrorAlert` + retry.

## UX/a11y/responsivo (ui-ux-pro-max)
Grid mobile-first (KPIs 2→4; ações 2→3→6; módulos 2→3→5), sem scroll horizontal, `focus-visible:ring`,
status com **ícone+texto** (não só cor), `tabular-nums`, h1 + h2 por seção com `aria-labelledby`, alvos
de toque ≥44px, CTA primária única.

## Verificação
`lint` limpo · **278/278** testes · `build` ok · app inicializa sem erro de console/servidor. Tela atrás
do login → validação visual do Leonardo (OK dado). Commit `c5b2ce9` (push com OK).

## Nota
"Nova campanha" leva ao painel Tráfego Imobiliária (onde o modal vive) — não abre o modal direto, para
não acoplar a home ao `PremiumDashboard`. Abrir o modal já da home fica como melhoria futura.

[[Atualizacao_2026-07-06_Catalogo_Templates_Preview]]
