# Propagação v2 — destino-bairro (2026-07-01)

6ª família e **fecha os SELECIONÁVEIS** (depois de [[Atualizacao_2026-07-01_Propagacao_v2_Ficha|ficha-imovel]]).
Arquétipo **CENTRADO**: feed/story ancoram no eixo central (logo centralizada, herói-bairro, painel de
condições, CTA-pílula, tudo no centro); o wide vira banner em coluna à esquerda.

## Diagnóstico: render já saudável, faltava declarar o gate
A reconstrução de junho ([[Atualizacao_2026-06-26_Reconstrucao_Destino_Bairro]]) já tinha deixado a
composição limpa (colunas de peso igual + facet dourado + profundidade). O lint já era rico (herói,
subtítulo, painel, CTA, footnote, badge) — mas usava `lintCreative(F.safe, els)` **sem opts**, então
não exigia a logo. A migração v2 foi **fechar a lacuna da logo**.

## BUG real (mesmo achado do oferta/ficha)
A logo do **story** ficava em `y=206`, **acima da safe-zone do 9:16** (`y≥250`) — dentro do chrome da
Meta (nome do perfil / botões). Ao declarar a logo como elemento crítico, o gate **reprovaria**
`safe_zone:logo`. Fix: `logoY 206→258` (entra na safe-zone; nada colide, o herói segue em 470).

## v2 declarado
- **logo** (`requireLogo`, `isLogo`, `critical`) — dentro da safe-zone nos 3 formatos.
- **SEM regra de eixo (axis)**: arquétipo centrado, não left-anchored (feed/story no centro; wide em
  coluna à esquerda). Diferente dos left-anchored (oferta, hero-checklist, vitrine, ficha, hero-panel),
  onde o eixo é regra. Aqui o gate seria um falso-positivo — por isso `{ requireLogo: true }` e nada mais.
- Herói (bairro) já com `charLimit=18` + `display` (encolhe p/ caber, reprova se estourar); painel/CTA/
  footnote/badge intactos.
- destino-bairro-poster **v4→v5** (espelhado em `renderVersions.ts` + `creativeTemplateCatalog.js`).

## Verificação
Harness **3 formatos verdes** (`lint.ok=true []`). Render real inspecionado (feed + story) — logo agora
folgada na safe-zone do story; sem cortes, sem sobreposição. **6/6 previews regenerados** (o 9x16
com-moldura renderizou sem 546 nesta rodada). 202 testes + ESLint OK. Assets de teste removidos.

## Placar — SELECIONÁVEIS COMPLETOS ✅
oferta-ancora ✅ · hero-checklist ✅ · duo-selos ✅ · vitrine ✅ · ficha-imovel ✅ · **destino-bairro ✅**
(hero-panel ✅ oculto). **Os 6 templates que o operador escolhe no "Nova Campanha" passaram todos pelo
gate determinístico v2.** Restam só ocultos (legado, prioridade menor): lancamento, oportunidade-bairro.

Padrão da propagação confirmado: cada família revelou um bug de fábrica distinto (split `|`, priceChip,
colisão por wrap, truncagem de headline, logo fora da safe-zone) — endureceu a base inteira. Destino
fechou reforçando a regra **logo sempre dentro da safe-zone** e mostrando que **arquétipo centrado
dispensa a regra de eixo** (o gate se adapta ao arquétipo, não impõe um layout único).

Commit: destino-bairro v2 (logo requireLogo + safe-zone story) + previews. [[render-asset-deploy-e-limites]]
[[validacao-criativo-arquitetura]]
