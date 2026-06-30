import React from 'react';

export interface AvatarProps {
  src?: string;
  /** Full name; initials are derived for the fallback. */
  name?: string;
  /** Pixel size (width = height). @default 32 */
  size?: number;
  status?: 'online' | 'busy' | 'away' | 'offline';
  /** Circle instead of the default square. */
  round?: boolean;
  style?: React.CSSProperties;
}

/** Identity chip — image with monospace-initials fallback + status dot. */
export function Avatar(props: AvatarProps): JSX.Element;
