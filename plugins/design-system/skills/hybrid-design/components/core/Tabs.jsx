import React from 'react';

/**
 * Tabs — underline navigation. `tabs` is a list of strings or
 * { value, label, badge, disabled }. Controlled via value/onChange.
 * Arrow-key roving focus; accent underline marks the active tab.
 */
export function Tabs({ tabs = [], value, onChange, style = {} }) {
  const refs = React.useRef([]);
  const idx = tabs.findIndex((t) => (typeof t === 'string' ? t : t.value) === value);

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    let n = idx < 0 ? 0 : idx;
    for (let i = 0; i < tabs.length; i++) {
      n = (n + dir + tabs.length) % tabs.length;
      const t = tabs[n];
      if (!(typeof t === 'object' && t.disabled)) break;
    }
    const t = tabs[n];
    onChange && onChange(typeof t === 'string' ? t : t.value);
    refs.current[n] && refs.current[n].focus();
  };

  return (
    <div role="tablist" onKeyDown={onKeyDown} style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-default)', ...style }}>
      {tabs.map((t, i) => {
        const tab = typeof t === 'string' ? { value: t, label: t } : t;
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(el) => (refs.current[i] = el)}
            role="tab"
            aria-selected={active}
            disabled={tab.disabled}
            tabIndex={active ? 0 : -1}
            onClick={() => !tab.disabled && onChange && onChange(tab.value)}
            onMouseEnter={(e) => !active && !tab.disabled && (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={(e) => !active && (e.currentTarget.style.color = 'var(--text-muted)')}
            onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) e.currentTarget.style.boxShadow = 'var(--ring)'; }}
            onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
            style={{
              appearance: 'none',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
              marginBottom: -1,
              padding: '8px 12px',
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
              opacity: tab.disabled ? 0.45 : 1,
              color: active ? 'var(--text-bright)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              borderRadius: 'var(--radius-xs)',
              outline: 'none',
              transition: 'color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
            }}
          >
            {tab.label}
            {tab.badge != null && (
              <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontSize: 'var(--text-2xs)' }}>{tab.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
