import { CheckCircle, XCircle } from 'lucide-react';
import type { Blocker } from '@/lib/engagements.api';

interface BlockerPanelProps {
  blockers: Blocker[];
}

export function BlockerPanel({ blockers }: BlockerPanelProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="border border-slate-200 rounded-lg p-4"
    >
      {blockers.length === 0 ? (
        <div className="flex items-center gap-2 bg-green-100 text-green-800 rounded-md px-3 py-2">
          <CheckCircle size={16} className="flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium">No open blockers</span>
        </div>
      ) : (
        <ul className="space-y-2">
          {blockers.map((blocker, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <XCircle
                size={16}
                className="text-red-600 flex-shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span className="text-sm text-foreground flex-1">{blocker.message}</span>
              {blocker.link && (
                <a
                  href={blocker.link}
                  className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                >
                  View →
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
