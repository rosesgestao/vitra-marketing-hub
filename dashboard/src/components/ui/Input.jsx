// Vitra UI — INPUT primitivo (Onda 2) sobre a classe .form-input. Padroniza o campo de texto e, junto do
// <FormField> (associacao de <label>) e do <Select> (VitraSelect), fecha a familia de controles de form.
// Aceita todas as props nativas do <input> (type, value, onChange, placeholder, id/aria vindos do FormField).
export default function Input({ className = '', ...rest }) {
  return <input className={`form-input ${className}`} {...rest} />
}
