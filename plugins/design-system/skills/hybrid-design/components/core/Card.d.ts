import React from 'react';

export interface CardProps {
  children?: React.ReactNode;
  /** Optional header title (monospace). */
  title?: React.ReactNode;
  /** Muted meta text beside the title. */
  meta?: React.ReactNode;
  /** Right-aligned header actions (buttons/icons). */
  actions?: React.ReactNode;
  /** Pad the body. @default true */
  padded?: boolean;
  style?: React.CSSProperties;
}

/**
 * Elevated panel surface with optional header.
 */
export function Card(props: CardProps): JSX.Element;
