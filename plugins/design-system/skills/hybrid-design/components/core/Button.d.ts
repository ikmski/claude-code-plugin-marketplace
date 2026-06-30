import React from 'react';

export interface ButtonProps {
  children?: React.ReactNode;
  /** Visual style. @default 'solid' */
  variant?: 'solid' | 'success' | 'danger' | 'secondary' | 'ghost';
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}

/**
 * Primary action button for the Hybrid system.
 */
export function Button(props: ButtonProps): JSX.Element;
