import { CheckCircle } from 'lucide-react';

export interface DraftStatusStepperProps {
  currentStatus: 'drafting' | 'under_review' | 'ready_for_ref_check' | 'ready_for_final_review';
}

const STEPS = [
  { label: 'Drafting', status: 'drafting' },
  { label: 'Under Review', status: 'under_review' },
  { label: 'Ready for Ref. Check', status: 'ready_for_ref_check' },
  { label: 'Ready for Final Review', status: 'ready_for_final_review' },
] as const;

const STATUS_INDEX: Record<DraftStatusStepperProps['currentStatus'], number> = {
  drafting: 0,
  under_review: 1,
  ready_for_ref_check: 2,
  ready_for_final_review: 3,
};

export function DraftStatusStepper({ currentStatus }: DraftStatusStepperProps) {
  const activeIndex = STATUS_INDEX[currentStatus];

  return (
    <div aria-live="polite">
      <ol
        role="list"
        className="flex items-start w-full"
        aria-label="Draft product status"
      >
        {STEPS.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isLast = index === STEPS.length - 1;

          let stateLabel: string;
          if (isCompleted) stateLabel = 'completed';
          else if (isActive) stateLabel = 'active';
          else stateLabel = 'upcoming';

          return (
            <li
              key={step.status}
              role="listitem"
              className="flex flex-col items-center flex-1"
              aria-label={`Step ${index + 1} of 4: ${step.label} — ${stateLabel}`}
              {...(isActive ? { 'aria-current': 'step' as const } : {})}
            >
              {/* Node + connector row */}
              <div className="flex items-center w-full">
                {/* Left connector (not for first item) */}
                {index > 0 && (
                  <div
                    className={`flex-1 h-0.5 ${isCompleted || isActive ? 'bg-blue-600' : 'bg-gray-200'}`}
                  />
                )}

                {/* Step node */}
                <div
                  className={
                    isCompleted
                      ? 'w-6 h-6 rounded-full bg-blue-600 border-blue-600 flex items-center justify-center'
                      : isActive
                      ? 'w-6 h-6 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center'
                      : 'w-6 h-6 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center'
                  }
                >
                  {isCompleted ? (
                    <CheckCircle size={14} className="text-white" aria-hidden="true" />
                  ) : (
                    <span
                      className={
                        isActive
                          ? 'text-xs font-semibold text-blue-600'
                          : 'text-xs font-normal text-muted-foreground'
                      }
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Right connector (not for last item) */}
                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`}
                  />
                )}
              </div>

              {/* Step label */}
              <span
                className={`mt-1 text-center text-xs leading-tight ${
                  isActive
                    ? 'font-semibold text-blue-600'
                    : 'font-normal text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
