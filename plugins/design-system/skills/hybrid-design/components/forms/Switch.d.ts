import React from 'react';

export interface SwitchProps {
  checked?: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
  label?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Binary toggle; track fills with accent blue when on. */
export function Switch(props: SwitchProps): JSX.Element;
