import React from 'react';

/**
 * Switch — binary toggle. Track fills with accent when on.
 * Mechanical slide, no bounce.
 */
export function Switch({ checked = false, disabled = false, onChange, label, style = {} }) {
  const [focusRing, setFocusRing] = React.useState(false);
  const toggle = () => !disabled && onChange && onChange(!checked);
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
      <span
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
        }}
        onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) setFocusRing(true); }}
        onBlur={() => setFocusRing(false)}
        style={{
          position: 'relative',
          width: 34,
          height: 20,
          flex: '0 0 auto',
          borderRadius: 999,
          background: checked ? 'var(--accent)' : 'var(--surface-raised)',
          border: `1px solid ${checked ? 'var(--accent)' : 'var(--border-strong)'}`,
          outline: 'none',
          boxShadow: focusRing ? 'var(--ring)' : 'none',
          transition: 'background var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 16 : 2,
            width: 14,
            height: 14,
            borderRadius: 999,
            background: checked ? 'var(--text-on-accent)' : 'var(--text-secondary)',
            transition: 'left var(--dur-base) var(--ease-standard)',
          }}
        />
      </span>
      {label && (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
          {label}
        </span>
      )}
    </label>
  );
}
