// Mensagem de erro amigável para exibição (fallback quando o erro não traz `message`). Puro.
// Extraído de PremiumDashboard.jsx (Onda 4) para ser compartilhado por componentes/modais.
export function errorMessage(error) {
  return error?.message || 'Nao foi possivel concluir a acao. Confira os dados e tente novamente.'
}
