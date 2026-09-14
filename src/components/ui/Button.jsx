const VARIANTS = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-strong active:scale-[0.98] shadow-card-2 disabled:opacity-50 disabled:pointer-events-none',
  secondary:
    'bg-secondary-container/15 text-primary hover:bg-secondary-container/25 active:scale-[0.98] disabled:opacity-50',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-low active:scale-[0.98]',
  danger: 'bg-error/10 text-error hover:bg-error/15 active:scale-[0.98]',
  outline: 'bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container-low active:scale-[0.98]',
}

const SIZES = {
  sm: 'h-9 px-3 text-label-md rounded-md gap-1',
  md: 'h-11 px-4 text-body-md font-semibold rounded-md gap-1.5',
  lg: 'h-14 px-6 text-body-lg font-semibold rounded-lg gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  icon,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-display transition-all duration-150 select-none ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
