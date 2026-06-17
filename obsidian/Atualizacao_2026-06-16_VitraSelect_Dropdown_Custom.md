# Atualizacao 2026-06-16 — VitraSelect: dropdown custom pixel-perfect

> Upgrade de polimento dos dropdowns do painel "Publicar na Meta": componente proprio acessivel com a
> identidade Vitra, no lugar do <select> nativo (cujo popup o SO so deixa estilizar ate certo ponto).
> Na `main`. Commit: **(VitraSelect)**.

## Por que
O fix CSS anterior deixou o popup nativo escuro, mas hover/estados finos ficam a cargo do SO. Para
controle 100% (pixel-perfect) e recursos como type-ahead, troca-se por um componente proprio.

## Entregue
- **`components/VitraSelect.jsx`** (sem dependencia nova): gatilho estilizado + lista em <ul role=listbox>.
  - Acessibilidade: `role=listbox`/`option`, `aria-activedescendant`, `aria-expanded`, `aria-selected`.
  - Teclado: setas, Home/End, Enter/Espaco, Esc, **type-ahead** (digitar para pular).
  - Foco gerenciado (foca a lista ao abrir, volta ao gatilho ao escolher), **fecha ao clicar fora**,
    abre para **cima/baixo** conforme o espaco.
  - Estilo Vitra: popup `--surface-2`, borda dourada, item ativo dourado (gold-500/15), selecionado com
    **check** dourado, chevron dourado. Funciona nas duas marcas (gold #C4942A comum; surface por marca).
  - API espelha o select: `value`, `onChange(value)`, `options` ({value,label} ou strings),
    `placeholder`, `disabled`, `className`, `ariaLabel` — **logica dos campos inalterada**.
- **Aplicado a TODOS os dropdowns do app** (consistencia 100%, commit 85ba32f): painel Publicar na Meta
  (conta, pagina, pixel, evento, retargeting, lookalike) + Metricas (Publicacao, com guard de obrigatorio
  no submit ja que o `required` nativo sai) + publicacao manual/editor de anuncio (CTA, conteudo vinculado
  com efeito colateral preservado, asset, plataforma, tipo). **Nenhum `<select>` nativo restante.**

## Verificacao
lint, 151 testes, build OK. Ao vivo no painel: VitraSelect de Conta abre com popup navy (surface-2),
borda dourada, 3 contas (PoA/RH/Premium) e a selecionada com check dourado. Acessivel por teclado.

Continuacao de [[Atualizacao_2026-06-16_Dropdowns_Tema_Vitra]] (o fix CSS anterior do select nativo).
