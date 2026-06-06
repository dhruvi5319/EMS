import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SufficiencyChip } from '@/components/evidence/SufficiencyChip';
import type { SufficiencyStatus } from '@/components/evidence/SufficiencyChip';
import { SufficiencyStatusSelect } from './SufficiencyStatusSelect';

export interface ObjectiveRow {
  id: string;
  objective_text: string;
  evidence_count: number;
  sufficiency_status: SufficiencyStatus;
}

interface ObjectiveSufficiencyTableProps {
  engagementId: string;
  objectives: ObjectiveRow[];
  loading?: boolean;
  canEdit: boolean;
  onStatusChanged?: (objectiveId: string, newStatus: SufficiencyStatus) => void;
}

/** Truncate objective text to 60 chars */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

export const ObjectiveSufficiencyTable: React.FC<ObjectiveSufficiencyTableProps> = ({
  engagementId,
  objectives,
  loading = false,
  canEdit,
  onStatusChanged,
}) => {
  return (
    <TooltipProvider>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" style={{ width: '50%' }}>
                Objective
              </TableHead>
              <TableHead scope="col" style={{ width: '25%' }}>
                Evidence
              </TableHead>
              <TableHead scope="col" style={{ width: '25%' }}>
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // 3 skeleton rows
              [0, 1, 2].map((i) => (
                <TableRow key={i} style={{ height: 48 }}>
                  <TableCell><Skeleton style={{ height: 16, width: '80%' }} /></TableCell>
                  <TableCell><Skeleton style={{ height: 16, width: 60 }} /></TableCell>
                  <TableCell><Skeleton style={{ height: 24, width: 120 }} /></TableCell>
                </TableRow>
              ))
            ) : (
              objectives.map((objective, index) => {
                const hasEvidence = objective.evidence_count >= 1;
                return (
                  <TableRow key={objective.id} style={{ height: 48 }}>
                    {/* Objective text — truncated with tooltip */}
                    <TableCell>
                      {objective.objective_text.length > 60 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span style={{ fontSize: 14, cursor: 'default' }}>
                              Obj {index + 1}: {truncate(objective.objective_text, 60)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent style={{ maxWidth: 320 }}>
                            {objective.objective_text}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span style={{ fontSize: 14 }}>
                          Obj {index + 1}: {objective.objective_text}
                        </span>
                      )}
                    </TableCell>

                    {/* Evidence count badge */}
                    <TableCell>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 400,
                          background: hasEvidence
                            ? 'hsl(142 71% 88%)'
                            : 'hsl(0 72% 93%)',
                          color: hasEvidence
                            ? 'hsl(142 70% 28%)'
                            : 'hsl(0 72% 38%)',
                        }}
                        aria-label={`${objective.evidence_count} evidence items`}
                      >
                        {hasEvidence ? (
                          <CheckCircle
                            size={16}
                            style={{ color: 'hsl(142 71% 45%)' }}
                          />
                        ) : (
                          <XCircle
                            size={16}
                            style={{ color: 'hsl(0 72% 51%)' }}
                          />
                        )}
                        {objective.evidence_count} items
                      </span>
                    </TableCell>

                    {/* Status — editable Select or read-only chip */}
                    <TableCell>
                      {canEdit ? (
                        <SufficiencyStatusSelect
                          engagementId={engagementId}
                          objectiveId={objective.id}
                          objectiveIndex={index + 1}
                          evidenceCount={objective.evidence_count}
                          currentStatus={objective.sufficiency_status}
                          canEdit={canEdit}
                          onStatusChanged={(newStatus) => {
                            onStatusChanged?.(objective.id, newStatus);
                          }}
                        />
                      ) : (
                        <SufficiencyChip status={objective.sufficiency_status} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Note below table */}
        <p
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: 'hsl(215 16% 47%)',
            marginTop: 8,
          }}
        >
          Cannot mark In Review or Sufficient if evidence count = 0.
        </p>
      </div>
    </TooltipProvider>
  );
};
