import React from 'react';

let injected = false;
function ensureKeyframes() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.textContent = '@keyframes hy-progress-indet{0%{left:-40%}100%{left:100%}}';
  document.head.appendChild(s);
}

/**
 * ProgressBar — slim determinate track. Pass `value` 0–100; omit (or null)
 * for an indeterminate sweep. Accent fill over a sunken track.
 */
export function ProgressBar({ value = null, height = 6, color = 'var(--accent)', style = {} }) {
  const indeterminate = value == null;
  React.useEffect(() => {
    if (indeterminate) ensureKeyframes();
  }, [indeterminate]);
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <div
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : pct}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        position: 'relative',
        width: '100%',
        height,
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border-default)',
        borderRadius: 999,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={
          indeterminate
            ? {
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '40%',
                background: color,
                borderRadius: 999,
                animation: 'hy-progress-indet 1.1s var(--ease-standard) infinite',
              }
            : {
                height: '100%',
                width: pct + '%',
                background: color,
                borderRadius: 999,
                transition: 'width var(--dur-base) var(--ease-standard)',
              }
        }
      />
    </div>
  );
}
