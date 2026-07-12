import type { HTMLAttributes, KeyboardEvent } from 'react';
import clsx from 'clsx';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  onClick?: () => void;
}

export function Card({ className, onClick, ...props }: CardProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <div
      className={clsx('rounded-2xl bg-surface border border-line p-4', onClick && 'cursor-pointer', className)}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    />
  );
}
