import React from 'react';

export interface SelectOption {
  value: string;
  label?: React.ReactNode;
}

export interface SelectProps {
  label?: React.ReactNode;
  value?: string;
  options?: (string | SelectOption)[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  style?: React.CSSProperties;
}

/** Native dropdown styled to the Hybrid well, with custom chevron. */
export function Select(props: SelectProps): JSX.Element;
