export function Field({ label, hint, error, children, required }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <span className="font-display text-headline-sm text-[14px] font-semibold text-on-surface">
          {label}
          {required && <span className="text-error"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="text-body-sm text-on-surface-variant">{hint}</span>}
      {error && <span className="text-body-sm text-error">{error}</span>}
    </label>
  )
}

const baseInput =
  'w-full h-12 rounded-md bg-surface-container-low border border-outline-variant/70 px-3.5 text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors'

export function Input({ className = '', error, ...props }) {
  return <input className={`${baseInput} ${error ? 'border-error focus:ring-error/30' : ''} ${className}`} {...props} />
}

export function Textarea({ className = '', error, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`${baseInput} h-auto py-2.5 resize-none ${error ? 'border-error focus:ring-error/30' : ''} ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', error, children, ...props }) {
  return (
    <select className={`${baseInput} appearance-none pr-8 bg-no-repeat ${error ? 'border-error' : ''} ${className}`} {...props}>
      {children}
    </select>
  )
}
