import React from 'react';

/**
 * Badge — compact status/label chip. Tinted fill + accent text,
 * keyed to the syntax palette. Solid (dot) and soft (tint) tones.
 */
export function Badge({ children, tone = 'neutral', dot = false, style = {}, ...rest }) {
  const tones = {
    neutral: { bg: 'var(--surface-raised)', fg: 'var(--text-secondary)', dotc: 'var(--text-muted)' },
    blue:    { bg: 'var(--accent-tint)',    fg: 'var(--accent)',  dotc: 'var(--accent)' },
    green:   { bg: 'var(--success-tint)',   fg: 'var(--success)', dotc: 'var(--success)' },
    yellow:  { bg: 'var(--warning-tint)',   fg: 'var(--warning)', dotc: 'var(--warning)' },
    red:     { bg: 'var(--danger-tint)',    fg: 'var(--danger)',  dotc: 'var(--danger)' },
    cyan:    { bg: 'var(--info-tint)',      fg: 'var(--info)',    dotc: 'var(--info)' },
    purple:  { bg: 'var(--hy-purple-tint)', fg: 'var(--hy-purple)', dotc: 'var(--hy-purple)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 20,
        padding: '0 8px',
        background: t.bg,
        color: t.fg,
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 'var(--weight-medium)',
        letterSpacing: 'var(--tracking-wide)',
        borderRadius: 'var(--radius-sm)',
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: 999, background: t.dotc, flex: '0 0 auto' }} />
      )}
      {children}
    </span>
  );
}
