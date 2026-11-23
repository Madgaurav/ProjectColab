import React from 'react'

/**
 * Static symbol component matching the uploaded ProjectCollab logo.
 */
export function ProjectCollabSymbol({
  size = 28,
  className = '',
  style = {}
}) {
  const baseSize = typeof size === 'number' ? `${size}px` : size

  return (
    <img
      src="/projectcollab-symbol.png"
      alt=""
      aria-hidden="true"
      className={`projectcollab-symbol ${className}`}
      style={{
        display: 'inline-block',
        width: baseSize,
        height: 'auto',
        verticalAlign: 'middle',
        objectFit: 'contain',
        pointerEvents: 'none',
        userSelect: 'none',
        ...style
      }}
    />
  )
}

export default ProjectCollabSymbol
