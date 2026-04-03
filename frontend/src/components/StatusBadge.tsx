import { cn } from '../utils/cn';

type StatusType = 'fulfilled' | 'partial' | 'unfulfilled' | 'ongoing' | 'completed';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  fulfilled: {
    label: 'Fulfilled',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  partial: {
    label: 'Partial',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  unfulfilled: {
    label: 'Unfulfilled',
    className: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  ongoing: {
    label: 'Ongoing',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.ongoing;
  
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
