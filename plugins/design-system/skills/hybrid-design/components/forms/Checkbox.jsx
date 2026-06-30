import React from 'react';

/**
 * Checkbox — square control, 2px radius. Fills accent when checked.
 * Supports an indeterminate (mixed) state. Keyboard + AT accessible.
 */
export function Checkbox({ checked = false, indeterminate = false, disabled = false, onChange, label, style = {} }) {
  const ref = React.useRef(null);
  const [focusRing, setFocusRing] = React.useState(false);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  const on = checked || indeterminate;
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => !disabled && onChange && onChange(e.target.checked)}
        onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) setFocusRing(true); }}
        onBlur={() => setFocusRing(false)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, margin: 0 }}
      />
      <span
        style={{
          flex: '0 0 auto',
          width: 16,
          height: 16,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 'var(--radius-xs)',
          background: on ? 'var(--accent)' : 'var(--surface-sunken)',
          border: `1px solid ${on ? 'var(--accent)' : 'var(--border-strong)'}`,
          color: 'var(--text-on-accent)',
          boxShadow: focusRing ? 'var(--ring)' : 'none',
          transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
        }}
      >
        {indeterminate && !checked ? (
          <span style={{ width: 8, height: 2, borderRadius: 1, background: 'var(--text-on-accent)' }} />
        ) : checked ? (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.4l2.2 2.2L9.5 3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      {label && (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{label}</span>
      )}
    </label>
  );
}
