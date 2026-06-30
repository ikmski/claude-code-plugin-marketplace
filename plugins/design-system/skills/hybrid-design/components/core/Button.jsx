import React from 'react';

/**
 * Hybrid Button — the primary action control.
 * Variants map to the syntax palette: solid (blue), success (green),
 * danger (red), secondary (panel), ghost (transparent).
 */
export function Button({
  children,
  variant = 'solid',
  size = 'md',
  disabled = false,
  iconLeft = null,
  iconRight = null,
  type = 'button',
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { height: 28, padding: '0 10px', font: 'var(--text-xs)', gap: 6 },
    md: { height: 34, padding: '0 14px', font: 'var(--text-sm)', gap: 8 },
    lg: { height: 42, padding: '0 20px', font: 'var(--text-base)', gap: 8 },
  };
  const s = sizes[size] || sizes.md;

  const variants = {
    solid: {
      background: 'var(--accent)',
      color: 'var(--text-on-accent)',
      border: '1px solid var(--accent)',
    },
    success: {
      background: 'var(--success)',
      color: 'var(--text-on-accent)',
      border: '1px solid var(--success)',
    },
    danger: {
      background: 'var(--danger)',
      color: 'var(--text-on-accent)',
      border: '1px solid var(--danger)',
    },
    secondary: {
      background: 'var(--surface-raised)',
      color: 'var(--text-bright)',
      border: '1px solid var(--border-strong)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
  };
  const v = variants[variant] || variants.solid;

  const [focusRing, setFocusRing] = React.useState(false);

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        height: s.height,
        padding: s.padding,
        fontFamily: 'var(--font-mono)',
        fontSize: s.font,
        fontWeight: 'var(--weight-medium)',
        letterSpacing: 'var(--tracking-normal)',
        lineHeight: 1,
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        outline: 'none',
        boxShadow: focusRing ? 'var(--ring)' : 'none',
        transition: 'filter var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
        whiteSpace: 'nowrap',
        ...v,
        ...style,
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.filter = 'brightness(1.12)')}
      onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(1px)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
      onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) setFocusRing(true); }}
      onBlur={() => setFocusRing(false)}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
