// ─── Subcomponente: Campo de input com label estilizado ───────────────────────

export function Field({ label, hint, children }) {
  return (
    <label className="admin-field">
      <span className="admin-field__label">{label}</span>
      {children}
      {hint && <p className="admin-field__hint">{hint}</p>}
    </label>
  )
}

// ─── Subcomponente: Card de seção ─────────────────────────────────────────────

export function SectionCard({ title, icon, children }) {
  return (
    <div className="admin-card">
      <div className="admin-card__header">
        <span className="admin-card__icon">{icon}</span>
        <h2 className="admin-card__title">{title}</h2>
      </div>
      <div className="admin-card__body">{children}</div>
    </div>
  )
}