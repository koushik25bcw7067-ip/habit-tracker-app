import Icon from './Icon'

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-surface-container-lowest rounded-t-xl sm:rounded-xl shadow-popover max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-gutter py-4 border-b border-surface-container-high sticky top-0 bg-surface-container-lowest">
          <h2 className="font-display text-headline-md text-on-surface">{title}</h2>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-low">
            <Icon name="close" />
          </button>
        </div>
        <div className="px-gutter py-4">{children}</div>
        {footer && <div className="px-gutter py-4 border-t border-surface-container-high flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  )
}
