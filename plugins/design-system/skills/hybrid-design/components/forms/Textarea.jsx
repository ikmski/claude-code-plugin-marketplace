import React from 'react';

/**
 * Textarea — multi-line monospace field. Sunken well, blue focus glow,
 * error state. Vertically resizable.
 */
export function Textarea({ label, value, placeholder, rows = 4, error = false, disabled = false, onChange, style = {}, ...rest }) {
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
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error || undefined}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          resize: 'vertical',
          padding: '8px 10px',
          background: 'var(--surface-sunken)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-sm)',
          boxShadow: focused ? '0 0 0 3px var(--accent-tint)' : 'none',
          opacity: disabled ? 0.5 : 1,
          color: 'var(--text-bright)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          lineHeight: 'var(--leading-code)',
          outline: 'none',
          transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
        }}
        {...rest}
      />
    </label>
  );
}
