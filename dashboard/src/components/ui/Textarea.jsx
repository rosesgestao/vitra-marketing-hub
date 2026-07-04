// Vitra UI — TEXTAREA primitivo (Onda 2) sobre a classe .form-input (mesma superficie/foco dos inputs),
// com resize vertical. Par do <Input> para campos longos (legenda, texto principal do anuncio, etc.).
export default function Textarea({ className = '', rows = 4, ...rest }) {
  return <textarea rows={rows} className={`form-input resize-y ${className}`} {...rest} />
}
