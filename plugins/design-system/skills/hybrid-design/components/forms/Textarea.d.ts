import React from 'react';

export interface TextareaProps {
  label?: React.ReactNode;
  value?: string;
  placeholder?: string;
  rows?: number;
  error?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  style?: React.CSSProperties;
}

/** Multi-line monospace field with label and error state. */
export function Textarea(props: TextareaProps): JSX.Element;
