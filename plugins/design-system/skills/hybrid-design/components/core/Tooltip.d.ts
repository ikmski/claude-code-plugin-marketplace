import React from 'react';

export interface TooltipProps {
  children?: React.ReactNode;
  content?: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  style?: React.CSSProperties;
}

/** Hover/focus hint on a raised surface. */
export function Tooltip(props: TooltipProps): JSX.Element;
