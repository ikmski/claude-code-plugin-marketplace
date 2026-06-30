import React from 'react';

export type TokenKey = 'kw' | 'fn' | 'str' | 'num' | 'cls' | 'esc' | 'com' | 'err' | 'pun';
export interface TokenSeg { t: string; c?: TokenKey; }

export interface CodeBlockProps {
  /** Filename shown in the window tab. */
  filename?: string;
  /** Rows of token segments for syntax-tinted rendering. */
  lines?: TokenSeg[][];
  /** Plain code string (used when `lines` is absent). */
  code?: string;
  /** Show the line-number gutter. @default true */
  showGutter?: boolean;
  style?: React.CSSProperties;
}

/**
 * Signature window-chrome code/terminal panel with hybrid syntax tinting.
 */
export function CodeBlock(props: CodeBlockProps): JSX.Element;
