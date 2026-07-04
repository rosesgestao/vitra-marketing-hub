# Onda 2 (parte 2) — primitivos Input/Select + fundação da escala de tipo — 2026-07-04

Sequência de [[Atualizacao_2026-07-04_Onda2_Tokens_Primitivos]]. Unificação de campos de formulário +
começo da tokenização de tipo. Aditivo/byte-equivalente; sem mudar comportamento.

## Unificação Input/Select
- **`<Input>`** e **`<Textarea>`** (novos, em `components/ui/`) sobre a classe `.form-input` — padronizam o
  campo de texto; aceitam props nativas. Par do `<FormField>` (que já resolve o `<label htmlFor>`).
- **`<Select>` canônico** = re-export do `VitraSelect` (o acessível: role=listbox, teclado, aria) a partir
  de `components/ui/index.js`. Unifica a entrada de "select" do kit; o `select.form-input` nativo migra
  para cá ao longo da adoção (antes eram DOIS selects concorrentes).

## Escala de tipo — fundação (byte-equivalente)
- Sub-escala micro no `tailwind.config`: `2xs`=11px · `3xs`=10px · `4xs`=9px · `5xs`=8px (aditivo; as
  faixas padrão do Tailwind permanecem). Documenta os microrrótulos abaixo de `xs`(12px) e substitui os
  `text-[Npx]` mais usados (10px×139, 11px×112) SEM mudar 1px.
- Migrados como prova: `text-[10px]→text-3xs` e `text-[11px]→text-2xs` no **Kanban** e **Calendário**.

## Adoção (dogfood)
- **EstudioCriativos**: todo o formulário "Dados do imóvel" migrado para `<FormField><Input/></FormField>`
  (headline, bairro, cidade, preço, área/quartos/suítes/vagas, CTA + input de diferenciais) — prova os
  primitivos E corrige a a11y real (labels sem `htmlFor`, apontada na auditoria).

## Verificação
lint limpo · **240 testes** · build OK · app sobe sem erro no console (HMR). Vai ao ar no rebuild.

## Restante da Onda 2
Migrar os 222 `text-[Npx]` do PremiumDashboard para a sub-escala; migrar os `select.form-input` nativos
para `<Select>`; adoção ampla de `<Button>/<Input>/<FormField>` e dos 12 overlays crus para `<Modal>`.
[[deploy-hostinger-vitrapremium]]
