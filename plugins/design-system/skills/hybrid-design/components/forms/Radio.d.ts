import React from 'react';

export interface RadioOption {
  value: string;
  label?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioProps {
  checked?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
  label?: React.ReactNode;
  name?: string;
  value?: string;
  style?: React.CSSProperties;
}

export interface RadioGroupProps {
  options?: (string | RadioOption)[];
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  direction?: 'row' | 'column';
  style?: React.CSSProperties;
}

/** Single circular radio option. */
export function Radio(props: RadioProps): JSX.Element;
/** Managed set of radios; calls onChange(value). */
export function RadioGroup(props: RadioGroupProps): JSX.Element;
