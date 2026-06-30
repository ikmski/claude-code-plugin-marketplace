import React from 'react';

/**
 * Card — elevated panel surface. Optional header (title + meta/actions).
 * The default container for grouped content on a Hybrid canvas.
 */
export function Card({ children, title, meta, actions, padded = true, style = {}, ...rest }) {
  return (
    <div
      style={{
        background: 'var(--surface-panel)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        ...style,
      }}
      {...rest}
    >
      {(title || actions) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 14px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--text-bright)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </span>
            {meta && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                {meta}
              </span>
            )}
          </div>
          {actions && <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>{actions}</div>}
        </div>
      )}
      <div style={{ padding: padded ? 'var(--space-4)' : 0, color: 'var(--text-primary)' }}>{children}</div>
    </div>
  );
}
