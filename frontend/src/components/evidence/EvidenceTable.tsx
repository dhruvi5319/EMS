import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Archive, SearchX } from 'lucide-react';
import { EvidenceTypeBadge } from './EvidenceTypeBadge';
import { SensitivityBadge } from './SensitivityBadge';
import type { EvidenceItem } from '@/hooks/useEvidence';

type SortField = 'id' | 'evidence_type' | 'source' | 'date_received' | 'sensitivity';
type SortDir = 'asc' | 'desc';

interface EvidenceTableProps {
  engagementId: string;
  evidence: EvidenceItem[];
  loading: boolean;
  hasFilters: boolean;
  canAddEvidence?: boolean;
  sortField?: SortField;
  sortDir?: SortDir;
  onSort?: (field: SortField) => void;
  onAddEvidence?: () => void;
  onClearFilters?: () => void;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

export const EvidenceTable: React.FC<EvidenceTableProps> = ({
  engagementId,
  evidence,
  loading,
  hasFilters,
  canAddEvidence,
  onAddEvidence,
  onClearFilters,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="border border-slate-200 rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">ID</TableHead>
              <TableHead scope="col">Type</TableHead>
              <TableHead scope="col">Source</TableHead>
              <TableHead scope="col">Date</TableHead>
              <TableHead scope="col">Sensitivity</TableHead>
              <TableHead scope="col">Obj</TableHead>
              <TableHead scope="col">Files</TableHead>
              <TableHead scope="col">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[0, 1, 2, 3, 4].map((i) => (
              <TableRow key={i} className="h-12">
                <TableCell colSpan={8}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (evidence.length === 0 && !hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-slate-200 rounded-md bg-white">
        <Archive size={32} className="text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-700 mb-1">No evidence items yet.</h3>
        <p className="text-sm text-slate-500 mb-4 max-w-sm">
          Add your first evidence item to begin building the evidence record for this engagement.
        </p>
        {canAddEvidence && (
          <Button size="sm" onClick={onAddEvidence}>
            + Add Evidence
          </Button>
        )}
      </div>
    );
  }

  if (evidence.length === 0 && hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-slate-200 rounded-md bg-white">
        <SearchX size={32} className="text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-700 mb-1">No evidence matches your filters.</h3>
        <p className="text-sm text-slate-500 mb-4">Try different filters or clear them to see all evidence.</p>
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">ID</TableHead>
            <TableHead scope="col">Type</TableHead>
            <TableHead scope="col">Source</TableHead>
            <TableHead scope="col">Date Received</TableHead>
            <TableHead scope="col">Sensitivity</TableHead>
            <TableHead scope="col">Obj</TableHead>
            <TableHead scope="col">Files</TableHead>
            <TableHead scope="col">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evidence.map((item, idx) => (
            <TableRow
              key={item.id}
              className="cursor-pointer hover:bg-slate-50 h-12"
              onClick={() => navigate(`/engagements/${engagementId}/evidence/${item.id}`)}
            >
              <TableCell className="font-mono text-sm font-normal">
                E-{String(idx + 1).padStart(3, '0')}
              </TableCell>
              <TableCell>
                <EvidenceTypeBadge type={item.evidence_type} />
              </TableCell>
              <TableCell
                className="text-sm max-w-[180px] truncate"
                title={item.source}
              >
                {truncate(item.source, 40)}
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {formatDate(item.date_received)}
              </TableCell>
              <TableCell>
                <SensitivityBadge sensitivity={item.sensitivity} />
              </TableCell>
              <TableCell className="text-sm text-center">
                {item.objective_count === 0 ? (
                  <span className="text-red-600 font-medium" title="No objectives linked">
                    🔴 0
                  </span>
                ) : (
                  item.objective_count
                )}
              </TableCell>
              <TableCell className="text-sm text-center">{item.file_count}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/engagements/${engagementId}/evidence/${item.id}`);
                  }}
                >
                  View →
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="px-4 py-2 text-sm text-slate-500 border-t border-slate-100">
        Showing {evidence.length} of {evidence.length} items
      </div>
    </div>
  );
};
