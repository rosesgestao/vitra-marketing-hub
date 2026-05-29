# Diagnostico do Dashboard Atual

## Arquivo Atual

`planejamento_vitra_premium/dashboard-conteudo.html`

## Estado Atual

O dashboard atual e um prototipo HTML local, monolitico, com CSS e JavaScript embutidos. Ele ja possui uma experiencia visual coerente com Vitra Premium e implementa boa parte do fluxo de campanha no navegador.

## Funcionalidades Existentes

- Aba `Campanha` com botao `+ Nova Campanha`.
- Modal `Nova Campanha` com campos comerciais do produto.
- Geracao automatica de assets por campanha.
- Campanha padrao Lake Baikal ja carregada.
- Edicao de copy, CTA, status e visual do card.
- Upload de imagens de fundo.
- Aprovacao de assets.
- Exportacao de PNG via `html2canvas`.
- Abas de planejamento, producao, metricas, calendario e templates.

## Comportamento Validado

Uma campanha criada pelo modal gera automaticamente um pacote completo de assets:

- Meta Ads;
- carrosseis;
- WhatsApp;
- thumbnails;
- emails;
- landing page.

No teste realizado, uma nova campanha gerou 73 assets.

## Limitacoes Atuais

- Persistencia apenas em `localStorage`.
- Sem Supabase.
- Sem autenticacao.
- Sem historico confiavel.
- Sem colaboracao entre dispositivos/usuarios.
- Sem vinculo real com publicacoes das redes sociais.
- Aba `Metricas` ainda e manual/local.
- Exportacao depende de `html2canvas` via CDN.
- Renderizacao no navegador pode falhar com imagens locais ou canvas contaminado.
- Logica de geracao esta exposta no front-end.
- Assets gerados nao entram automaticamente no pipeline de agentes.

## Risco Principal

O prototipo parece uma ferramenta operacional, mas ainda funciona como uma ferramenta local de planejamento. Para producao, os dados precisam sair do navegador e entrar em banco, storage, APIs oficiais e jobs controlados.
