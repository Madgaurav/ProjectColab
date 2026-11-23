function Arrow() {
  return <span aria-hidden="true">↗</span>
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  busy = false,
}) {
  if (!isOpen) return null

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="dialog-card">
        <p className="eyebrow">{isDestructive ? 'Confirmation required' : 'Please confirm'}</p>
        <h2 id="dialog-title">{title}</h2>
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button
            type="button"
            className="outline-button"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={isDestructive ? 'destructive-button' : 'primary-button'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Processing...' : <>{confirmLabel} <Arrow /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
