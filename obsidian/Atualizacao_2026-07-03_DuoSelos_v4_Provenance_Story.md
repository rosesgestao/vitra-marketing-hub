# duo-selos v4 — selo com proveniência + story preenchendo a safe zone (2026-07-03)

Fecho das 3 tarefas do teste com referência real (peça Zona Norte) + saneamento dos goldens.

## Entregue
- **Selo com proveniência (fecha a truncagem silenciosa):** diferenciais REAIS do operador que estouram
  30c agora **REPROVAM** (`char_limit:selo1/2`) como a headline — nunca truncar copy do operador;
  fallbacks (location/área/padrão) seguem degradando em silêncio (`realDiffCount`).
- **Story 9:16 redistribuído:** fotos 465×560 + selos/CTA preenchendo a zona segura (y≤1470) — fecha o
  "vazio inferior"; abaixo de 1470 é UI da Meta (correto ficar livre).
- **Catálogo:** descrição reescrita (modelo reutilizável, não "peça da Zona Norte"); bump v3→v4
  espelhado (renderVersions + catálogo + teste); 6 previews regenerados.

## Achados no caminho (o harness pegando de verdade)
- **Fixture vazio furado:** o builder mescla o brief da campanha QA no `pd`; o brief tinha um diferencial
  de **34c** → com a proveniência, o gate bloqueava o teste de fallback (`char_limit:selo1`). Fix: o
  fixture declara `differentials:''`. Em produção o bloqueio é o comportamento DESEJADO.
- **Goldens defasados pré-Inter:** o commit Poppins→Inter só regravou 3 famílias (ficha/hero-checklist/
  vitrine); **premium-lancamento** (9) e **lancamento** (3) ficaram com SHA velho. Provado determinismo
  (SHAs idênticos entre runs) + inspeção visual (Inter correto) → goldens regravados.
- Contabilidade fechada: 15 falhas do full-run = 9 premium + 3 lancamento + 3 duo-selos/vazio. Zero mistério.

## Verificação
Full harness **75/75**; 238 testes + lint + deno check OK; deploy CLI. Débito legado anotado: famílias
OCULTAS (ex.: lancamento) ainda truncam com compactText — o padrão de proveniência vale para duo-selos
e novos templates. [[render-asset-deploy-e-limites]] [[validacao-criativo-arquitetura]]
