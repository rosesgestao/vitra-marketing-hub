# Atualização 2026-06-26 — Remoção de 3 templates da seleção do "Nova campanha"

Decisão de PO: 3 templates não atingiram o padrão de qualidade para criativos imobiliários e saem da
**seleção** do módulo "Nova campanha" (sem serem apagados do sistema):
- **Hero com painel e galeria** (`vitra-imobiliaria-hero-panel-gallery`)
- **Lançamento / Em breve** (`vitra-imobiliaria-lancamento`)
- **Oportunidade no bairro** (`vitra-imobiliaria-oportunidade-bairro`)

## Como (padrão já estabelecido: `hidden: true`)
Marcados com `hidden: true` no `creativeTemplateCatalog.js` (mesmo mecanismo dos 4 templates antigos
aposentados em junho/2026). A função `selectableCreativeTemplatesForBrand` filtra `!hidden`, e TODOS os
consumidores da seleção/seed usam ela (ou `defaultCreativeTemplateForBrand`, que também filtra):
- modal Nova Campanha (`PremiumDashboard.jsx` → `templateOptions`)
- seed de assets de nova campanha + default (`premiumData.js`)

**Sem órfãos:** o render de assets já criados resolve por id via `getCreativeTemplateById` /
`creativeTemplateForTemplateKey`, que **não** filtram `hidden` → campanhas/assets existentes com essas
families continuam resolvendo e renderizando. Builders no Edge, schemas e `renderVersions` ficam intactos.

## Resultado
Seleção da Imobiliária passa de **9 → 6** templates: hero-checklist, duo-selos, vitrine-gallery,
ficha-imovel, oferta-ancora, destino-bairro. Ocultos: 7 (4 antigos + estes 3).

## Verificação
- Guarda atualizada (`templateCatalog.test.js`): selecionáveis = 6 (na ordem), ocultos = 7; assert extra
  de que `oportunidade-bairro` ainda resolve por id. **172/172 testes verde**; lint + build OK.
- Prova na build servida pelo Vite (preview_eval no módulo real): `selectableCount: 6`, os 3 removidos
  **não vazam** para a seleção (`removedStillSelectable: []`), e `oportunidade-bairro` resolve por id.
  Sem erros no console.

## Reversível
Para retornar qualquer um à seleção, basta remover o `hidden: true` da family — nada foi destruído.

Commit: hidden nos 3 templates + guarda atualizada.
