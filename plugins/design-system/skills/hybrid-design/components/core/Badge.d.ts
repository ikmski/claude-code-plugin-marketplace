import React from 'react';

export interface BadgeProps {
  children?: React.ReactNode;
  /** Palette key. @default 'neutral' */
  tone?: 'neutral' | 'blue' | 'green' | 'yellow' | 'red' | 'cyan' | 'purple';
  /** Show a leading status dot. @default false */
  dot?: boolean;
  style?: React.CSSProperties;
}

/** Compact status/label chip keyed to the syntax palette. */
export function Badge(props: BadgeProps): JSX.Element;
