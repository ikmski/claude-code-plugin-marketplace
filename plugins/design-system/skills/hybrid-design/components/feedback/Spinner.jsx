import React from 'react';

/**
 * Spinner — indeterminate loading indicator. SVG-driven rotation (no global
 * keyframes), so it is fully self-contained. Functional, not decorative.
 */
export function Spinner({ size = 18, stroke = 2, color = 'var(--accent)', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
      style={{ display: 'inline-block', ...style }}
    >
      <circle cx="12" cy="12" r="9" stroke="var(--border-strong)" strokeWidth={stroke} />
      <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth={stroke} strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}
