import React from 'react';

export interface CalloutProps {
  children?: React.ReactNode;
  /** @default 'info' */
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Inline status banner with accent bar + glyph + tinted fill. */
export function Callout(props: CalloutProps): JSX.Element;
