import React from 'react';

export interface TabItem {
  value: string;
  label?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs?: (string | TabItem)[];
  value?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}

/**
 * Underline tab bar with roving arrow-key focus.
 */
export function Tabs(props: TabsProps): JSX.Element;
