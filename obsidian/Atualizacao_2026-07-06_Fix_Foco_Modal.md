# Fix — Modal roubava o foco a cada tecla (campos travavam ao digitar) — 2026-07-06

Bug reportado (com screenshot): no modal "Nova campanha", passo 2, o campo "Valor de (riscado)" (e qualquer
campo digitado à mão) travava — digitava 1 caractere, perdia o foco, era preciso clicar fora e voltar.

## Causa raiz (NÃO é máscara de moeda)
Os inputs monetários são controlados simples, sem reformatação (não há máscara no modal). O travamento era
**roubo de foco pelo primitivo `ui/Modal.jsx`**: o `useEffect` de foco/trap tinha **`onClose` nas
dependências**. O `NewCampaignModal` passa `onClose={handleClose}` (recriado a cada render) e o estado do
formulário vive dentro dele → **cada tecla** re-renderiza → novo `handleClose` → `onClose` muda de
identidade → o efeito re-roda → o `setTimeout(...focus(),0)` devolve o foco ao 1º elemento (e o cleanup
restaura o foco ao gatilho). Foco saía do campo a cada caractere. Campos com "IA ✕" foram preenchidos pela
IA (não digitados), por isso só o "Valor de" (digitado à mão) revelou o bug.

## Correção (componente compartilhado — conserta TODOS os modais/campos)
Em `dashboard/src/components/ui/Modal.jsx`: `onClose` passa a ser lido via **`onCloseRef`** (ref sempre
atual) e o efeito depende só de **`[open, initialFocusRef]`** → foco inicial/trap roda **uma vez ao abrir**,
não a cada render. Esc/scrim/restauração de foco preservados. Nenhum campo/máscara/regra alterado. Solução
estável e reutilizável (protege qualquer input em qualquer modal, incl. os outros monetários).

## Verificação
lint (sem `react-hooks/exhaustive-deps` error) + 278 testes + build; preview sem erro de console. Modal
atrás do login → validação visual do Leonardo (digitação contínua, backspace, colar, trocar de passo).
Commit `f099662`.

[[Atualizacao_2026-07-06_Modal_Variacoes_Criativos]]
