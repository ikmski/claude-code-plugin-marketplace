import React from 'react';

export interface ProgressBarProps {
  /** 0–100. Omit or null for an indeterminate sweep. */
  value?: number | null;
  height?: number;
  color?: string;
  style?: React.CSSProperties;
}

/** Slim progress track — determinate or indeterminate. */
export function ProgressBar(props: ProgressBarProps): JSX.Element;
