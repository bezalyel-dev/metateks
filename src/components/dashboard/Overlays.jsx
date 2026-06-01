export function RedFlashOverlay({ active }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.6) 0%, rgba(153,27,27,0.4) 40%, rgba(100,0,0,0.2) 70%, transparent 100%)',
        opacity: active ? 1 : 0,
        transition: active
          ? 'opacity 0.05s ease-in'
          : 'opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    />
  )
}