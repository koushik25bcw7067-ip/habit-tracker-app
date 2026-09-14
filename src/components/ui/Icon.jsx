export default function Icon({ name, size = 20, className = '', filled = false, style = {} }) {
  return (
    <span
      className={`material-symbols-outlined leading-none select-none ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
        ...style,
      }}
    >
      {name}
    </span>
  )
}
