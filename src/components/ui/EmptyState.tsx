import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-14 w-14 rounded-2xl bg-surface-hover flex items-center justify-center mb-4">
        <Icon size={26} className="text-ink-faint" />
      </div>
      <h3 className="text-ink font-medium mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-ink-soft max-w-xs mb-4">{subtitle}</p>}
      {action}
    </div>
  );
}
