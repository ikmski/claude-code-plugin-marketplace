import React from 'react';

export interface CheckboxProps {
  checked?: boolean;
  /** Mixed/indeterminate state (shows a dash). */
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
  label?: React.ReactNode;
  style?: React.CSSProperties;
}

/** Square checkbox with accent fill and indeterminate support. */
export function Checkbox(props: CheckboxProps): JSX.Element;
