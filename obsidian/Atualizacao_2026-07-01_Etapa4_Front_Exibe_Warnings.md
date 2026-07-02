# Etapa 4 (increment 4) — front exibe warnings/recommendations (2026-07-01)

Fecha o ciclo "o gate audita → o operador vê". Até aqui o `token_conformance` e o `logo_crowding` já
gravavam a dívida no `metadata.lint`, mas o operador só via o BLOQUEIO (por `ok`). Agora os avisos
consultivos aparecem no card de revisão do Tráfego Pago.

## Entregue
- **`dashboard/src/lib/lintText.js`** (novo, puro/testável): `humanizeLintNote(code)` traduz os códigos do
  gate em PT legível (`token_font:Poppins` → "Fonte fora da marca: Poppins"; `logo_crowding:hero:12<14`
  → "Logo próxima da hero (folga 12px < 14px)"; `contrast:price:2.1<4.5` → "Contraste baixo em price
  (2.1:1)"; safe_zone/overflow/char_limit/dead_gap/axis/price_weak/underfill/overlap/logo_missing).
  `humanizeLintList` dedup + humaniza. Código desconhecido passa como veio.
- **`PremiumDashboard.jsx`**: o bloco de ERRO (âmbar) agora é **humanizado** (era código cru) e rotulado
  "Reprovado na validação visual"; a mensagem de erro do fluxo de aprovar também. NOVO bloco **azul/sky**
  "Observações de qualidade — não bloqueiam" com `warnings + recommendations` humanizados (visualmente
  mais suave que o erro, deixando claro que é consultivo).

## Verificação
234 testes (+5 do lintText: token_font/color, logo_crowding, contrast, desconhecido, dedup) + ESLint +
build OK. Preview: app carrega e navega (Conteúdo → Tráfego Pago → campanha → criativo) com **zero erro
de console**; o card de revisão renderiza. O bloco azul só aparece em assets **renderizados após o deploy
do lint v3** (os antigos não têm `warnings` no metadata.lint — regra nova); a lógica é conditional
testada + espelha o bloco de erro que já funcionava.

## Estado da Etapa 4
increment 1 (3 severidades + logo_crowding) ✅ · 2 (token_conformance) ✅ · 3 (contraste WCAG) ✅ ·
**4 (front exibe warnings) ✅**. Restam (menores/mecânicos): estender contraste às outras 5 famílias +
sobre foto (raster), `format_divergence`, promover `logo_crowding` a erro por arquétipo.

Débito de marca a decidir (agora visível ao operador): Poppins→Inter, near-whites→offWhite,
#111111→navyDeep. [[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
