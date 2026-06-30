import React from 'react';

/**
 * Callout — inline message banner. Left accent bar + tinted fill,
 * keyed to status. The system's note/warn/error/success block.
 */
export function Callout({ children, tone = 'info', title, style = {} }) {
  const tones = {
    info:    { fg: 'var(--info)',    bg: 'var(--info-tint)',    glyph: 'i' },
    success: { fg: 'var(--success)', bg: 'var(--success-tint)', glyph: '\u2713' },
    warning: { fg: 'var(--warning)', bg: 'var(--warning-tint)', glyph: '!' },
    danger:  { fg: 'var(--danger)',  bg: 'var(--danger-tint)',  glyph: '\u00d7' },
  };
  const t = tones[tone] || tones.info;
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 14px',
        background: t.bg,
        borderLeft: `3px solid ${t.fg}`,
        borderRadius: 'var(--radius-sm)',
        ...style,
      }}
    >
      <span
        style={{
          flex: '0 0 auto',
          width: 18,
          height: 18,
          marginTop: 1,
          borderRadius: 999,
          background: t.fg,
          color: 'var(--text-on-accent)',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-2xs)',
          fontWeight: 'var(--weight-bold)',
          lineHeight: 1,
        }}
      >
        {t.glyph}
      </span>
      <div style={{ minWidth: 0 }}>
        {title && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              color: t.fg,
              marginBottom: 2,
            }}
          >
            {title}
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', lineHeight: 'var(--leading-snug)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
