import Modal from './Modal.jsx'
import Button from './Button.jsx'

// Vitra UI — CONFIRMAÇÃO acessível de ação (sobre Modal). Substitui window.confirm em ações destrutivas:
// herda foco-preso/Esc/scrim/scroll-lock do Modal, descreve o que vai acontecer e usa botão de perigo.
// O foco inicial NÃO cai no botão destrutivo (fica por último) — o operador não confirma sem querer.
// O guarda de gasto "Ativar (gastar) na Meta" NÃO usa este componente (é intencionalmente separado).
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',        // 'danger' (padrão) | 'gold'
  loading = false,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={tone === 'gold' ? 'gold' : 'danger'} size="sm" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      }
    >
      {description && <p className="text-sm leading-6 text-white/70">{description}</p>}
      {children}
    </Modal>
  )
}
