import React from 'react';

/**
 * Input — single-line text field. Monospace, sunken well, blue focus ring.
 * Supports label, optional prefix/suffix adornments, and error state.
 */
export function Input({
  label,
  value,
  placeholder,
  prefix = null,
  suffix = null,
  error = false,
  disabled = false,
  type = 'text',
  onChange,
  style = {},
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const borderColor = error
    ? 'var(--danger)'
    : focused
    ? 'var(--accent)'
    : 'var(--border-default)';

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 34,
          padding: '0 10px',
          background: 'var(--surface-sunken)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-sm)',
          boxShadow: focused ? '0 0 0 3px var(--accent-tint)' : 'none',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
        }}
      >
        {prefix && <span style={{ color: 'var(--text-muted)', display: 'flex' }}>{prefix}</span>}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error || undefined}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-bright)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
          }}
          {...rest}
        />
        {suffix && <span style={{ color: 'var(--text-muted)', display: 'flex' }}>{suffix}</span>}
      </div>
    </label>
  );
}
