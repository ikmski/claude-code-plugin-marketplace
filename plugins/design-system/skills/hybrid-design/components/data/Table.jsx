import React from 'react';

/**
 * Table — dense data grid. `columns` is a list of strings or
 * { key, label, align, render }. `rows` is a list of objects keyed by column.
 * Hairline rows, monospace cells, uppercase header, hover row wash.
 */
export function Table({ columns = [], rows = [], style = {} }) {
  const cols = columns.map((c) => (typeof c === 'string' ? { key: c, label: c } : c));
  return (
    <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
        <thead>
          <tr>
            {cols.map((col, i) => (
              <th
                key={col.key || i}
                style={{
                  textAlign: col.align || 'left',
                  padding: '9px 14px',
                  background: 'var(--surface-panel)',
                  borderBottom: '1px solid var(--border-default)',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 'var(--weight-medium)',
                  letterSpacing: 'var(--tracking-caps)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label != null ? col.label : col.key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr
              key={ri}
              style={{ transition: 'background var(--dur-fast) var(--ease-standard)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {cols.map((col, ci) => (
                <td
                  key={col.key || ci}
                  style={{
                    textAlign: col.align || 'left',
                    padding: '9px 14px',
                    borderTop: ri > 0 ? '1px solid var(--border-subtle)' : 'none',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.render ? col.render(r[col.key], r) : r[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
