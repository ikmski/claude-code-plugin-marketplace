import React from 'react';

/**
 * Radio — single circular option. Use directly, or via RadioGroup for a
 * managed set. Keyboard + AT accessible.
 */
export function Radio({ checked = false, disabled = false, onChange, label, name, value, style = {} }) {
  const [focusRing, setFocusRing] = React.useState(false);
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
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => !disabled && onChange && onChange(value)}
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
          borderRadius: 999,
          background: 'var(--surface-sunken)',
          border: `1px solid ${checked ? 'var(--accent)' : 'var(--border-strong)'}`,
          boxShadow: focusRing ? 'var(--ring)' : 'none',
          transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
        }}
      >
        {checked && <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }} />}
      </span>
      {label && (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{label}</span>
      )}
    </label>
  );
}

/**
 * RadioGroup — managed set of Radios. `options` is a list of strings or
 * { value, label, disabled }. Calls onChange(value).
 */
export function RadioGroup({ options = [], value, onChange, name = 'radiogroup', direction = 'column', style = {} }) {
  return (
    <div
      role="radiogroup"
      style={{ display: 'flex', flexDirection: direction, gap: direction === 'row' ? 16 : 10, ...style }}
    >
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o;
        return (
          <Radio
            key={opt.value}
            name={name}
            value={opt.value}
            label={opt.label}
            disabled={opt.disabled}
            checked={value === opt.value}
            onChange={onChange}
          />
        );
      })}
    </div>
  );
}
