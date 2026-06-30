import React from 'react';

export interface TableColumn {
  key: string;
  label?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: Record<string, any>) => React.ReactNode;
}

export interface TableProps {
  columns?: (string | TableColumn)[];
  rows?: Record<string, any>[];
  style?: React.CSSProperties;
}

/**
 * Dense data grid with hairline rows and hover wash.
 */
export function Table(props: TableProps): JSX.Element;
