import React from 'react';

export interface InputProps {
  label?: React.ReactNode;
  value?: string;
  placeholder?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  error?: boolean;
  disabled?: boolean;
  type?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
}

/** Single-line monospace text field with optional label and adornments. */
export function Input(props: InputProps): JSX.Element;
