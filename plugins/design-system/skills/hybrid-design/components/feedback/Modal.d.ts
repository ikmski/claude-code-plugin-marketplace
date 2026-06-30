import React from 'react';

export interface ModalProps {
  open?: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Footer actions row (right-aligned). */
  actions?: React.ReactNode;
  /** Max width in px. @default 440 */
  width?: number;
  style?: React.CSSProperties;
}

/** Centered dialog over a dim scrim; Esc and backdrop-click close. */
export function Modal(props: ModalProps): JSX.Element;
