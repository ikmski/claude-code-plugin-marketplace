import React from 'react';

/**
 * CodeBlock — the signature Hybrid surface. A window-chrome code/terminal
 * panel with traffic-light dots, optional filename tab, and syntax-tinted
 * tokens. Pass either `lines` (array of token-segment rows) or plain `code`.
 *
 * A token segment is { t: string, c?: paletteKey }. Palette keys map to the
 * hybrid syntax hues: 'kw' purple, 'fn' blue, 'str' green, 'num' orange,
 * 'cls' yellow, 'esc' cyan, 'com' muted, 'err' red.
 */
const SYNTAX = {
  kw:  'var(--hy-purple)',
  fn:  'var(--hy-blue)',
  str: 'var(--hy-green)',
  num: 'var(--hy-orange)',
  cls: 'var(--hy-yellow)',
  esc: 'var(--hy-cyan)',
  com: 'var(--text-muted)',
  err: 'var(--hy-red)',
  pun: 'var(--text-secondary)',
};

export function CodeBlock({ filename, lines, code, showGutter = true, style = {} }) {
  const rows = lines || (code || '').split('\n').map((l) => [{ t: l }]);
  return (
    <div
      style={{
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        fontFamily: 'var(--font-mono)',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'var(--surface-panel)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ display: 'flex', gap: 6 }}>
          {['#cc6666', '#f0c674', '#b5bd68'].map((c) => (
            <span key={c} style={{ width: 11, height: 11, borderRadius: 999, background: c, opacity: 0.85 }} />
          ))}
        </span>
        {filename && (
          <span style={{ marginLeft: 4, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{filename}</span>
        )}
      </div>
      <div style={{ padding: '12px 4px', overflowX: 'auto' }}>
        {rows.map((segs, i) => (
          <div key={i} style={{ display: 'flex', lineHeight: 'var(--leading-code)', fontSize: 'var(--text-sm)' }}>
            {showGutter && (
              <span
                style={{
                  flex: '0 0 auto',
                  width: 38,
                  paddingRight: 14,
                  textAlign: 'right',
                  color: 'var(--border-strong)',
                  userSelect: 'none',
                }}
              >
                {i + 1}
              </span>
            )}
            <span style={{ whiteSpace: 'pre', color: 'var(--text-primary)' }}>
              {segs.map((s, j) => (
                <span key={j} style={{ color: s.c ? SYNTAX[s.c] : 'var(--text-primary)' }}>
                  {s.t}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
