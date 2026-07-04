# Auditoria Completa — Arquitetura de Informação, UX/UI e Front-end (Sistema) — 2026-07-04

Diagnóstico como **Dev Sênior + PO + Diretor de Design**, lente da skill **ui-ux-pro-max** (confirmada
instalada e funcional: Python 3.13.1, scripts respondem). **Read-only** — nenhuma alteração de código.
Ancorado em 3 agentes de exploração (navegação/IA · módulos Estúdios/Inteligência/Métricas · produção de
conteúdo + design system) + conhecimento das Ondas 1–4 e das auditorias anteriores
([[Atualizacao_2026-06-26_Auditoria_Trafego_Pago_Roadmap]], [[Atualizacao_2026-07-04_Auditoria_UX_UI_Dashboard]]).

> **Precedência de marca:** a identidade Vitra (navy #0A1628 + dourado #C4942A, Playfair/Inter, separação
> Imobiliária × Premium) é autoridade do brandbook / `frontend-design` / `direcao-de-arte`. Aqui a lente é
> **UX, fluxo, arquitetura e consistência de componente** — não redesenho de marca.

---

## 1. Diagnóstico da experiência atual

**Fundação forte (o que já está bom):**
- **Navegação e IA sólidas:** hash routing + deep-linking + botão voltar funcionam; sidebar em acordeão
  (uma seção aberta por vez); estado em URL + localStorage. Separação de marca por `data-brand` no `<html>`.
- **Design system real:** 12 primitivos com a11y sólida (`Modal`/`Drawer` com foco-preso/Esc/scrim,
  `Toast` aria-live, `LoadingState`/`EmptyState`/`ErrorAlert`, `Button`/`Badge`/`FormField`/`VitraSelect`).
  Tokens semânticos (~70%): `--z-*`, `--shadow-*`, `--color-success/warning/danger`, escala de tipo micro
  (2xs–5xs). Fruto das Ondas 1–2.
- **Tráfego Pago maduro** (Ondas 1–4 + auditoria 26/06 fechada) e **núcleo do Meta testado** (Onda 4:
  `metaAdReadiness`/`metaAds` com 38 testes de guarda; monólito 5.655→3.045 linhas).
- **Produção de conteúdo sem duplicação de dados:** Kanban e Calendário leem a MESMA `premium_content_posts`
  por perspectivas diferentes (board por status × timeline por data). Não há divergência de fonte.

**Onde ainda se comporta como "sistema tradicional / pouco intuitivo":**
1. **Dois modelos mentais numa tela só.** "Conteúdo" (orgânico) e "Tráfego Pago" (pago) são a MESMA
   `PremiumDashboard`, alternada por `focusMode='trafego'` — **sem indicador visual do modo**. A sidebar
   tem 4 entradas de marca (Imob Conteúdo, Imob Tráfego, Premium Conteúdo, Premium Tráfego) que caem no
   mesmo componente. O operador não sabe em que "mundo" está.
2. **Gap de ADOÇÃO do design system** (a inconsistência real). Os primitivos existem e são bons, mas o
   código ainda tem **~100 `.btn-*` vs ~10 `<Button>`**, **`Field.jsx` (menos acessível) coexistindo com
   `FormField.jsx`**, **`window.confirm`** em ações destrutivas, **select nativo × `VitraSelect`**, e
   bespoke duplicando primitivos (`StatusBadge`, `BrandToggle`, abas com estilo inline, `StatTile`). O
   sistema *parece* consistente, mas os componentes por baixo divergem → estados (loading/a11y) e
   manutenção derivam.
3. **Responsividade parcial.** Grids fixos quebram no tablet/celular: **Métricas** (tabela 6 colunas sem
   scroll), **Agentes** (`grid-cols-2` fixo em 320px), **Estúdio de Criativos** (specs 4-col < 350px). O
   corretor usa tablet — isso é real.
4. **Maturidade desigual entre módulos.** Tráfego e Produção maduros; **Agentes** bruto (painel de status
   de agentes ainda não implementados, roadmap notice); **Métricas** sem gráfico (só tiles + tabela);
   **Estúdios** pesados em componente bespoke.
5. **Lacunas de primitivo forçam reimplementação:** faltam `Tabs`, `Toggle/Switch`, `StatTile`, `DataTable`,
   `Stepper`, `ConfirmModal`, `Chip`, e `PageHeader` como primitivo governado.

---

## 2. Principais problemas (por eixo, com impacto real)

| Eixo | Problema | Impacto (produto/usabilidade/conversão/produtividade/escala) |
|------|----------|--------------------------------------------------------------|
| Ações destrutivas | `window.confirm` em excluir mídia (Biblioteca) e excluir campanha (PremiumDashboard) | A11y quebrada (sem foco/anúncio) + clique acidental fácil → **perda de dados** |
| Responsividade | Tabela de Métricas 6-col sem scroll; Agentes 2-col fixo | Corretor no **tablet não lê** o resultado das campanhas nem o status → tela inútil no campo |
| Clareza de fluxo | `focusMode` sem indicador; 4 entradas de marca → 1 componente | Operador **age no modo errado** (posta orgânico achando que é pago, e vice-versa) |
| Consistência | ~100 `.btn` vs `<Button>`; `Field`×`FormField`; select nativo×custom | Botões **sem estado de loading/aria-busy**; forms com a11y desigual; manutenção derramada |
| Dados/decisão | Métricas sem gráfico (tiles + tabela) | Sem **tendência visível** → a tela de métricas não cumpre seu propósito (decidir) |
| Escala/manutenção | Sem `Tabs`/`Toggle`/`Table`/`StatTile` primitivos | Cada nova tela **reinventa** o padrão → dívida cresce linearmente com features |
| Legibilidade | text-[10px]/[9px] em labels de foto, specs, chips | Abaixo do confortável; **ilegível** em mobile |
| Cor semântica | Cores de plataforma hardcoded (instagram #E1306C…) | Fora do sistema de tokens → **divergência** e retrabalho ao rebrandizar |

---

## 3. Recomendações — P0 / P1 / P2

### P0 — críticos (usabilidade/funcionamento)
- **P0.1 `ConfirmModal` no lugar de `window.confirm`.** *Problema:* excluir mídia/campanha via diálogo
  nativo (a11y quebrada, clique acidental). *Ação:* criar primitivo `ConfirmModal` (sobre `Modal`) e trocar
  as 2 ocorrências (Biblioteca, excluir campanha). **NÃO** tocar no `window.confirm` de "Ativar (gastar) na
  Meta" — é guarda de gasto deliberado. *Front.* **Aceite:** excluir pede confirmação in-app com foco-preso
  + descrição do que será removido; Esc/Cancelar aborta; o guarda de gasto Meta permanece.
- **P0.2 Métricas responsiva.** *Problema:* tabela de 6 colunas ilegível < 600px (corretor no tablet).
  *Ação:* `overflow-x-auto` + `min-w` (padrão já usado no `MetricsSection` do PremiumDashboard) + números
  tabulares. *Front.* **Aceite:** 375/768px sem corte de conteúdo; a tabela rola; números alinhados.
- **P0.3 Agentes responsivo.** *Problema:* `grid-cols-2` fixo quebra em 320px. *Ação:* `grid-cols-1
  md:grid-cols-2`. *Front.* **Aceite:** 1 coluna no celular, 2 no tablet+; cards legíveis.
- **P0.4 Indicador de modo (Conteúdo × Tráfego).** *Problema:* mesma tela, sem sinal do modo → ação errada.
  *Ação:* um selo/eyebrow persistente no header do PremiumDashboard ("Conteúdo orgânico" vs "Tráfego Pago")
  + cor de acento distinta. *Front.* **Aceite:** em qualquer aba, o operador vê em 1 relance o modo e a
  marca ativos.

### P1 — produtividade e consistência
- **P1.1 Adoção do `<Button>`.** *Problema:* ~100 `.btn-*` perdem loading/aria-busy e derivam. *Ação:*
  migrar em lote para `<Button variant size>` (começar por Kanban/Calendário/Biblioteca/Estúdios). *Front.*
  **Aceite:** 0 `.btn-*` cru nas views migradas; ações assíncronas mostram spinner + `aria-busy`.
- **P1.2 `Field` → `FormField`.** *Problema:* `Field.jsx` não gera id/aria-describedby → a11y desigual em
  ~20 forms. *Ação:* unificar em `FormField` (id automático, erro com role=alert). *Front.* **Aceite:** todo
  campo tem label associada + erro anunciado; `Field.jsx` deixa de existir OU vira alias fino de `FormField`.
- **P1.3 Select único.** *Problema:* `<select>` nativo coexiste com `VitraSelect`. *Ação:* padronizar
  `VitraSelect` (via `Select` do design system) nos forms. *Front.* **Aceite:** UX de dropdown única no
  produto (teclado/role/listbox); sem popup nativo nos forms principais.
- **P1.4 Primitivo `Tabs`.** *Problema:* abas reimplementadas com className manual em 3+ telas (Produção,
  Publicações, Config, formato dos criativos). *Ação:* `Tabs` (role=tablist/tab/tabpanel, teclado, `aria-
  selected`). *Front.* **Aceite:** as abas usam o primitivo; navegação por seta funciona; 1 fonte de estilo.
- **P1.5 Primitivo `Toggle/Switch` + filtro de marca unificado.** *Problema:* filtros de marca são button-
  groups manuais em Kanban/Calendário/Estúdios (cada um seu). *Ação:* `Segmented`/`Toggle` primitivo +
  um `BrandFilter` compartilhado. *Front.* **Aceite:** um só componente de filtro de marca em todas as
  views compartilhadas.
- **P1.6 Métricas com gráfico.** *Problema:* só tiles + tabela → sem tendência. *Ação:* linha (tendência
  temporal de alcance/leads/CPL) + tabela como alternativa acessível (lente da skill: line p/ tempo,
  bullet/gauge p/ KPI vs meta). *Front (+ back se precisar de série temporal agregada).* **Aceite:** a
  tela mostra tendência ao longo do tempo por segmento (orgânico/pago), com tooltip e resumo textual a11y.
- **P1.7 `StatTile`, `PageHeader`, `Table`, `Chip` no design system.** *Problema:* padrões recorrentes
  vivem inline/bespoke. *Ação:* promover para `components/ui/`. *Front.* **Aceite:** os 4 padrões têm
  primitivo; as views consomem por import; 0 reimplementação nova.
- **P1.8 `StatusPill`/`Badge` unificados.** *Problema:* `StatusBadge` bespoke (Agentes/Peças) duplica
  `Badge`/`StatusPill`. *Ação:* consolidar em `StatusPill` (já extraído na Onda 4). *Front.* **Aceite:**
  um só componente de status em todo o produto.

### P2 — refinamentos e evolução
- **P2.1 Tokenizar cores de plataforma** (instagram/facebook/… hardcoded → `--platform-*`). *Aceite:* 0 hex
  de plataforma cru; um mapa de tokens.
- **P2.2 Fallback de rota inválida no Estúdio de Peças** (`#/pecas:999` → EmptyState "seção não encontrada"
  com ação). *Aceite:* rota inválida não renderiza tela vazia silenciosa.
- **P2.3 Rótulo "Inteligência & automação"** mais claro (ex.: "Automação & Métricas") + microcopy do que a
  seção faz. *Aceite:* o nome descreve o conteúdo.
- **P2.4 Breadcrumb** em fluxos aninhados (campanha → assets; peças → plataforma → formato). *Aceite:*
  orientação em telas de 2+ níveis.
- **P2.5 Legibilidade** (subir os `text-[9/10px]` de labels/chips para 2xs/3xs onde for conteúdo, não
  micro-rótulo decorativo). *Aceite:* nenhum texto de conteúdo < 11px.

---

## 4. Componentes/padrões a padronizar + evolução do Design System

O design system está numa boa fundação, mas **subaproveitado**. A evolução é de "biblioteca de primitivos"
para **design system governado** em 4 movimentos:

1. **Completar a cobertura de primitivos** (o que falta): `Tabs`, `Toggle/Segmented`, `Switch`, `StatTile`,
   `DataTable` (com `overflow-x-auto` + números tabulares por padrão), `Stepper`, `ConfirmModal`, `Chip`,
   `PageHeader` (promover o `PremiumPageHeader`).
2. **Forçar adoção** (fechar o gap): migrar `.btn-*`→`Button`, `Field`→`FormField`, `<select>`→`Select`,
   `window.confirm`→`ConfirmModal`, `StatusBadge`→`StatusPill`. É aqui que está o maior ganho de
   consistência real (não estética).
3. **Tokenizar o que sobrou** (cores de plataforma; tones hardcoded em StatTile).
4. **Documentar** — uma página viva de componentes (Artifact "storybook-lite" ou rota `#/design-system`
   só em dev) mostrando cada primitivo, variantes e uso. Reduz a tentação de reinventar.

---

## 5. Melhorias por módulo

- **Vitra Imobiliária / Vitra Premium (Conteúdo):** indicador de modo/marca (P0.4). Aba "editar rascunho"
  clara (hoje o draft reabre no mesmo form sem sinal). Adotar `Button`/`Tabs`.
- **Tráfego Pago:** já maduro (Ondas 1–4). Só herda os primitivos novos (`Button`/`Tabs`/`ConfirmModal`).
- **Produção de conteúdo (Kanban/Calendário/Biblioteca/Publicações/Pipeline):** **unificar** Kanban+Calendário
  num só workspace "Produção" com alternador de vista (board × calendário × lista) — matam a fragmentação de
  perspectiva sem mexer nos dados. Decidir o destino do **Pipeline** (órfão do menu, ainda renderável):
  reabsorver como "vista de fluxo" ou remover de vez. Filtro de marca unificado (P1.5).
- **Estúdio de Criativos (só Imobiliária):** error boundary (não tem try/catch); abas de formato via `Tabs`;
  specs 4-col responsivas; `Button` no lugar de `btn-gold`. **Integração:** é um 2º sistema de criação visual
  paralelo ao render-asset do Tráfego — avaliar convergência (ver §6).
- **Estúdio de Peças:** estados vazio/erro formais; `BrandToggle`/`StatusBadge`→primitivos; fallback de rota
  (P2.2). Catálogo data-driven é bom — manter o padrão de registro.
- **Inteligência & automação (Agentes):** responsivo (P0.3); primitivos; e **decisão de produto:** Agentes
  é um painel de status de agentes ainda não implementados. Ou vira o hub real de orquestração (ligando à
  sala editorial / vitra-trafego), ou o status é dobrado dentro dos fluxos que ele descreve. Hoje é uma
  promessa visual sem função.
- **Métricas:** responsiva (P0.2) + gráfico (P1.6). É a tela onde a lente "data-dense dashboard" da skill
  mais se aplica (line p/ tendência, bullet/gauge p/ KPI vs meta, tabela como alternativa a11y).

---

## 6. Mapa de integração entre módulos (oportunidades)

- **Estúdio de Criativos × Tráfego Pago (render-asset):** dois sistemas de criação visual em paralelo — um
  gerador HTML standalone (Imobiliária) e o pipeline Satori/Edge (ambas marcas). *Oportunidade:* um **hub de
  criação visual** único que alimenta orgânico (Biblioteca/Conteúdo) e pago (Tráfego), reduzindo a
  duplicação conceitual e o retrabalho. (Estrutural — médio/longo prazo.)
- **Estúdio de Peças × Estúdio de Criativos:** ambos geram artes HTML; poderiam compartilhar o padrão de
  catálogo/registro (o de Peças é o mais escalável).
- **Agentes × sala editorial (contentPlaybook/generate-content) × vitra-trafego:** Agentes descreve 8
  agentes; a automação real de conteúdo e de tráfego já existe em outras partes. *Oportunidade:* Agentes
  vira o **painel de controle** dessas automações reais (não um mock).
- **Produção de Conteúdo (4–6 telas) → 1 workspace:** Kanban+Calendário+(Pipeline) são perspectivas do
  mesmo funil. Unificar reduz salto entre telas e reforça o modelo mental único.
- **Métricas ↔ Publicações ↔ Tráfego:** o vínculo publicação→métrica já existe; um "loop" visível
  (publicou → mediu → próxima ação) fecharia o ciclo (evolução).

---

## 7. Quick wins × estruturais

**Quick wins (baixo esforço, alto impacto):** P0.2 (Métricas scroll), P0.3 (Agentes grid), P0.1
(ConfirmModal — 1 primitivo + 2 trocas), P2.2 (fallback Peças), P2.3 (rótulo seção), P0.4 (indicador de
modo — 1 selo no header). Tudo front, contido, sem back.

**Estruturais (médio/longo):** adoção do `<Button>`/`FormField`/`Select` em lote (P1.1–1.3); primitivos
novos `Tabs`/`Toggle`/`StatTile`/`Table` (P1.4–1.7); Métricas com gráfico (P1.6); unificação da Produção de
Conteúdo; decisão de produto de Agentes; convergência dos dois sistemas de criação visual (§6);
documentação viva do design system.

---

## 8. Roadmap por prioridade e dependência

- **Fase A — Quick wins de UX (P0, 1 leva):** ConfirmModal + Métricas/Agentes responsivos + indicador de
  modo + fallback Peças + rótulo. *Sem dependência; alcançável já.* Fecha os buracos que mais machucam no dia.
- **Fase B — Fundação de componentes (P1.4–1.8):** criar os primitivos que faltam (`Tabs`, `Toggle`,
  `StatTile`, `Table`, `Chip`, `ConfirmModal` já da Fase A). *Depende de nada; habilita a Fase C.*
- **Fase C — Adoção em lote (P1.1–1.3):** migrar `.btn`/`Field`/`select`/`StatusBadge` para os primitivos.
  *Depende da Fase B (os primitivos precisam existir).* É o maior ganho de consistência real.
- **Fase D — Dados & fluxo (P1.6 + unificação de Produção + decisão de Agentes):** Métricas com gráfico;
  Produção num workspace; Agentes vira hub real ou é reabsorvido. *Depende de B/C para herdar os primitivos.*
- **Fase E — Estrutural (§6):** convergência dos sistemas de criação visual; documentação viva do DS.
  *Depende de tudo acima; é a evolução de plataforma.*

Dependências-chave: **primitivos (B) antes de adoção (C)**; adoção antes de estrutural (E). Fase A é
independente e vai primeiro.

---

## 9. Impactos no back-end

A grande maioria é **front-only**. Toca back apenas:
- **P1.6 (gráfico de Métricas):** pode exigir um endpoint/consulta de **série temporal agregada** por
  segmento (hoje `premium_metrics` é por publicação/dia — pode bastar agregar no front; medir).
- **Unificação da Produção / decisão de Agentes:** se Agentes virar hub real, precisa ligar às automações
  (edges de conteúdo/tráfego) — mas isso é feature, não refactor.
- **Convergência dos sistemas de criação visual (§6):** estrutural; envolve o pipeline `render-asset`.
- **Invariante inviolável:** nada disto altera o "Meta sempre PAUSED + ativar só com confirm" nem os guards
  de marca/segurança.

---

## 10. Critérios de aceite transversais

Nenhuma regressão funcional; build + testes (261+) + lint verdes; a11y sem violação crítica nas telas
tocadas (foco visível, label associada, erro anunciado, cor nunca sozinha); verificado em 375/768/1024/1440;
**identidade preservada** (sem cor/fonte fora do brandbook — precedência de marca); `window.confirm` de
gasto Meta e guards de marca **intocados**; adoção medível ("0 `.btn` cru na view X", "0 `window.confirm`
destrutivo fora do guarda de gasto").

---

Sem alteração de código (diagnóstico). Esta nota é o roadmap de referência de UX/arquitetura do SISTEMA
(complementa o roadmap específico do Tráfego de 26/06). Artifact navegável publicado para consulta.
[[Atualizacao_2026-07-04_Onda4_Split_PublishMetaPanel]] [[Atualizacao_2026-06-26_Auditoria_Trafego_Pago_Roadmap]]
