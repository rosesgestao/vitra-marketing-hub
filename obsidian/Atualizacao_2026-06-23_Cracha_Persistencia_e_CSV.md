# Atualizacao 2026-06-23 — Crachá: persistência local + lote por CSV

> Próximo passo do crachá: salvar/reabrir registros e importar/exportar lote em CSV. Na `main`. Commit: **<HASH>**.

## Decisão de arquitetura (PO)
O gerador do crachá é uma **página estática** (`public/pecas`, sem sessão/cliente Supabase). Em vez de
acoplar um banco a uma página pública (anti-padrão), a persistência foi feita **client-side**:
**localStorage** (salvar/reabrir registros) + **CSV** (lote em massa, round-trip). Cobre os gaps reais
sem backend. Um banco compartilhado só se justificaria para histórico multiusuário/auditoria — fica como
opção futura, se necessário.

## Entregue (no gerador `cracha-corporativo-vitra-imobiliaria.html`)
- **Importar CSV** (cabeçalho `nome;cargo;setor;matricula;qr`, aceita `,` ou `;`, com/sem header) → vira a
  lista do lote. **Baixar modelo CSV** (template).
- **Registros salvos (localStorage):** "Salvar registro" (dedup por nome+matrícula), "Salvar lote"
  (grava todos os registros do lote), seletor "Abrir registro salvo" → carrega no form/card, "Excluir
  selecionado", "Exportar todos (CSV)". A foto não é persistida (reanexar ao reabrir — avisado na UI).

## Verificação (ao vivo)
Ciclo testado por eval: CSV (2 registros, Ana Paula aplicada) → salvar registro + salvar lote → 2 salvos
(dedup ok: Ana Paula, Carlos Lima) → abrir o 2º → card mostra "Carlos Lima". Screenshot conferido (form +
card + botões CSV). Sem mudança de back-end; só o gerador estático.

Ver [[Atualizacao_2026-06-23_Cracha_Corporativo_PVC]].
