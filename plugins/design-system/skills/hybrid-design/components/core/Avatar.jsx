import React from 'react';

/**
 * Avatar — identity chip. Image with monospace-initials fallback. Square by
 * default (technical, on-brand); pass `round` for a circle. Optional status dot.
 */
export function Avatar({ src, name = '', size = 32, status, round = false, style = {} }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const dotColor = {
    online: 'var(--success)',
    busy: 'var(--danger)',
    away: 'var(--warning)',
    offline: 'var(--text-muted)',
  }[status];
  const dotSize = Math.max(8, Math.round(size * 0.28));
  return (
    <span style={{ position: 'relative', display: 'inline-flex', flex: '0 0 auto', width: size, height: size, ...style }}>
      <span
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          borderRadius: round ? 999 : 'var(--radius-md)',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          fontSize: Math.max(10, Math.round(size * 0.38)),
          fontWeight: 'var(--weight-medium)',
          lineHeight: 1,
        }}
      >
        {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
      </span>
      {dotColor && (
        <span
          style={{
            position: 'absolute',
            right: -1,
            bottom: -1,
            width: dotSize,
            height: dotSize,
            borderRadius: 999,
            background: dotColor,
            border: '2px solid var(--surface-canvas)',
          }}
        />
      )}
    </span>
  );
}
