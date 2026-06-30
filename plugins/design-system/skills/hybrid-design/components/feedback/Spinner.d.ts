import React from 'react';

export interface SpinnerProps {
  /** Pixel diameter. @default 18 */
  size?: number;
  stroke?: number;
  color?: string;
  style?: React.CSSProperties;
}

/** Indeterminate loading spinner (SVG-driven rotation). */
export function Spinner(props: SpinnerProps): JSX.Element;
