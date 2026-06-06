import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { SufficiencyChip } from '@/components/evidence/SufficiencyChip';
import type { SufficiencyStatus } from '@/components/evidence/SufficiencyChip';
import { api } from '@/lib/api';

type Props = {
  engagementId: string;
  objectiveId: string;
  objectiveIndex: number;
  evidenceCount: number;
  currentStatus: SufficiencyStatus;
  canEdit: boolean;
  onStatusChanged: (newStatus: SufficiencyStatus) => void;
};

export const SufficiencyStatusSelect: React.FC<Props> = ({
  engagementId,
  objectiveId,
  objectiveIndex,
  evidenceCount,
  currentStatus,
  canEdit,
  onStatusChanged,
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  if (!canEdit) {
    return <SufficiencyChip status={currentStatus} />;
  }

  const handleChange = async (value: string) => {
    const newStatus = value as SufficiencyStatus;
    setSaving(true);
    try {
      const result = await api.put(
        `/engagements/${engagementId}/objectives/sufficiency`,
        [{ objective_id: objectiveId, sufficiency: newStatus }]
      );
      if (result.ok) {
        toast({ title: 'Objective status updated.' });
        onStatusChanged(newStatus);
      } else {
        toast({
          title: (result as { error: string; ok: false; status: number }).error ?? 'Failed to update status.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: 'Failed to update status.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const isBlockedOption = (status: SufficiencyStatus) =>
    evidenceCount === 0 && (status === 'in_review' || status === 'sufficient');

  return (
    <TooltipProvider>
      <Select
        value={currentStatus}
        onValueChange={handleChange}
        disabled={saving}
      >
        <SelectTrigger
          aria-label={`Set evidence sufficiency for Objective ${objectiveIndex}`}
          style={{ minWidth: 160 }}
        >
          {saving ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </span>
          ) : (
            <SelectValue>
              <SufficiencyChip status={currentStatus} />
            </SelectValue>
          )}
        </SelectTrigger>
        <SelectContent>
          {/* Evidence Needed — always enabled */}
          <SelectItem value="evidence_needed">
            <SufficiencyChip status="evidence_needed" />
          </SelectItem>

          {/* In Review — disabled if no evidence */}
          {isBlockedOption('in_review') ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SelectItem
                    value="in_review"
                    aria-disabled="true"
                    style={{ pointerEvents: 'none', opacity: 0.5 }}
                  >
                    <SufficiencyChip status="in_review" />
                  </SelectItem>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Requires at least 1 linked evidence item
              </TooltipContent>
            </Tooltip>
          ) : (
            <SelectItem value="in_review">
              <SufficiencyChip status="in_review" />
            </SelectItem>
          )}

          {/* Sufficient — disabled if no evidence */}
          {isBlockedOption('sufficient') ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <SelectItem
                    value="sufficient"
                    aria-disabled="true"
                    style={{ pointerEvents: 'none', opacity: 0.5 }}
                  >
                    <SufficiencyChip status="sufficient" />
                  </SelectItem>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                Requires at least 1 linked evidence item
              </TooltipContent>
            </Tooltip>
          ) : (
            <SelectItem value="sufficient">
              <SufficiencyChip status="sufficient" />
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </TooltipProvider>
  );
};
