import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { EvidenceFilters } from '@/hooks/useEvidence';

interface EvidenceFilterBarProps {
  filters: EvidenceFilters;
  onFilterChange: (filters: EvidenceFilters) => void;
}

export const EvidenceFilterBar: React.FC<EvidenceFilterBarProps> = ({ filters, onFilterChange }) => {
  const activeCount = Object.values(filters).filter((v) => v != null && v !== '').length;

  const handleTypeChange = (value: string) => {
    onFilterChange({ ...filters, evidence_type: value === 'all' ? undefined : value });
  };

  const handleSensitivityChange = (value: string) => {
    onFilterChange({ ...filters, sensitivity: value === 'all' ? undefined : value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value || undefined });
  };

  const handleClearAll = () => {
    onFilterChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.evidence_type ?? 'all'}
        onValueChange={handleTypeChange}
      >
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="document">Document</SelectItem>
          <SelectItem value="dataset">Dataset</SelectItem>
          <SelectItem value="interview_note">Interview Note</SelectItem>
          <SelectItem value="meeting_note">Meeting Note</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.sensitivity ?? 'all'}
        onValueChange={handleSensitivityChange}
      >
        <SelectTrigger className="w-36 h-8 text-sm">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sensitivity</SelectItem>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="restricted">Restricted</SelectItem>
        </SelectContent>
      </Select>

      <Input
        className="w-56 h-8 text-sm"
        placeholder="Search evidence..."
        value={filters.search ?? ''}
        onChange={handleSearchChange}
      />

      {activeCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5">
            {activeCount} active
          </span>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleClearAll}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
};
