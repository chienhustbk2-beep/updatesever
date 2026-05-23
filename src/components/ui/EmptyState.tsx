'use client';
import { Package } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-hover">
        {icon || <Package className="h-8 w-8 text-muted" />}
      </div>
      <p className="text-sm font-medium text-main">{title}</p>
      {description && <p className="mt-1 text-xs text-muted max-w-xs text-center">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
