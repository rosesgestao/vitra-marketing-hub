// Vitra UI — camada de primitivos do design system (Onda 1 / P0). Construídos sobre os tokens existentes
// (CSS vars + classes .card/.modal-overlay/.form-input/.btn-*). Identidade de marca permanece no brandbook.
export { default as LoadingState } from './LoadingState.jsx'
export { default as EmptyState } from './EmptyState.jsx'
export { default as ErrorAlert } from './ErrorAlert.jsx'
export { default as FormField } from './FormField.jsx'
export { default as Button } from './Button.jsx'
export { default as Badge } from './Badge.jsx'
export { default as Chip } from './Chip.jsx'
export { default as StatTile } from './StatTile.jsx'
export { default as Tabs } from './Tabs.jsx'
export { default as Segmented } from './Segmented.jsx'
export { default as DataTable } from './DataTable.jsx'
export { default as Input } from './Input.jsx'
export { default as Textarea } from './Textarea.jsx'
// Select CANONICO do kit = VitraSelect (acessivel: role=listbox, teclado, aria). Unifica a entrada de
// "select" do design system; o select.form-input nativo deve migrar para ca ao longo da adocao.
export { default as Select } from '../VitraSelect.jsx'
export { default as Modal } from './Modal.jsx'
export { default as ConfirmModal } from './ConfirmModal.jsx'
export { default as Drawer } from './Drawer.jsx'
export { ToastProvider, useToast } from './Toast.jsx'
