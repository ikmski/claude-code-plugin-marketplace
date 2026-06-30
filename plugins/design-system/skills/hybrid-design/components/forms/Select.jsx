import React from 'react';

/**
 * Select — native dropdown styled to the Hybrid well. `options` is a list of
 * strings or { value, label }. Custom chevron; native menu for accessibility.
 */
export function Select({ label, value, options = [], placeholder, disabled = false, error = false, onChange, style = {}, ...rest }) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error ? 'var(--danger)' : focused ? 'var(--accent)' : 'var(--border-default)';
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-2xs)',
            letterSpacing: 'var(--tracking-caps)',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </span>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <select
          value={value}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            width: '100%',
            height: 34,
            padding: '0 30px 0 10px',
            background: 'var(--surface-sunken)',
            border: `1px solid ${borderColor}`,
            borderRadius: 'var(--radius-sm)',
            boxShadow: focused ? '0 0 0 3px var(--accent-tint)' : 'none',
            opacity: disabled ? 0.5 : 1,
            color: 'var(--text-bright)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
          }}
          {...rest}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
        <span style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: 'var(--text-muted)', display: 'flex' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </label>
  );
}
