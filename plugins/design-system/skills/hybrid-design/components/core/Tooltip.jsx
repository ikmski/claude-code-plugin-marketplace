import React from 'react';

/**
 * Tooltip — hover/focus hint on a raised surface. Wrap any element; pass
 * `content` and an optional `side` (top | bottom | left | right).
 */
export function Tooltip({ children, content, side = 'top', style = {} }) {
  const [open, setOpen] = React.useState(false);
  const pos = {
    top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 },
    bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 },
    left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 },
    right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 },
  }[side] || {};
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', ...style }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && content && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 50,
            ...pos,
            whiteSpace: 'nowrap',
            background: 'var(--surface-raised)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            padding: '5px 8px',
            color: 'var(--text-bright)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-2xs)',
            lineHeight: 1.3,
            pointerEvents: 'none',
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
