import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface EvidenceOption {
  id: string;
  source: string;
  evidence_type: string;
}

interface AddStatementFormProps {
  engagementId: string;
  open: boolean;
  onSave: (statementText: string, evidenceIds: string[]) => Promise<void>;
  onCancel: () => void;
}

export function AddStatementForm({
  engagementId,
  open,
  onSave,
  onCancel,
}: AddStatementFormProps) {
  const [statementText, setStatementText] = useState('');
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [evidenceOptions, setEvidenceOptions] = useState<EvidenceOption[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ text?: string; evidence?: string }>({});
  const [evidencePickerOpen, setEvidencePickerOpen] = useState(false);

  // Fetch evidence list when dialog opens
  useEffect(() => {
    if (!open) return;
    setLoadingEvidence(true);
    api
      .get<{ evidence: EvidenceOption[] }>(`/api/engagements/${engagementId}/evidence`)
      .then((res) => {
        if (res.ok) setEvidenceOptions(res.data.evidence);
      })
      .finally(() => setLoadingEvidence(false));
  }, [open, engagementId]);

  function handleToggleEvidence(id: string) {
    setSelectedEvidenceIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleRemoveEvidence(id: string) {
    setSelectedEvidenceIds((prev) => prev.filter((i) => i !== id));
  }

  function validate() {
    const errs: { text?: string; evidence?: string } = {};
    if (!statementText.trim()) {
      errs.text = 'Statement text is required.';
    }
    if (selectedEvidenceIds.length === 0) {
      errs.evidence = 'At least one evidence item must be linked to a statement.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(statementText.trim(), selectedEvidenceIds);
      // Reset on success
      setStatementText('');
      setSelectedEvidenceIds([]);
      setErrors({});
    } catch (e: unknown) {
      setErrors({ text: e instanceof Error ? e.message : 'Failed to save statement.' });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setStatementText('');
    setSelectedEvidenceIds([]);
    setErrors({});
    onCancel();
  }

  const selectedEvidence = evidenceOptions.filter((e) => selectedEvidenceIds.includes(e.id));

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) handleCancel(); }}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add Statement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statement Text */}
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Statement Text <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={statementText}
              onChange={(e) => setStatementText(e.target.value)}
              placeholder="Enter the statement text..."
              rows={4}
              className={errors.text ? 'border-destructive' : ''}
              disabled={saving}
            />
            {errors.text && (
              <p className="text-xs text-destructive mt-1">{errors.text}</p>
            )}
          </div>

          {/* Evidence Multi-Select */}
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Evidence Items <span className="text-destructive">*</span>
            </label>

            <Popover open={evidencePickerOpen} onOpenChange={setEvidencePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={evidencePickerOpen}
                  className={cn(
                    'w-full justify-between',
                    errors.evidence ? 'border-destructive' : ''
                  )}
                  disabled={saving || loadingEvidence}
                >
                  {loadingEvidence
                    ? 'Loading evidence...'
                    : selectedEvidenceIds.length === 0
                    ? 'Select evidence items...'
                    : `${selectedEvidenceIds.length} selected`}
                  <ChevronsUpDown size={14} className="ml-2 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[460px] p-0">
                <Command>
                  <CommandInput placeholder="Search evidence..." />
                  <CommandList>
                    <CommandEmpty>No evidence found.</CommandEmpty>
                    <CommandGroup>
                      {evidenceOptions.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.id}
                          onSelect={() => handleToggleEvidence(item.id)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <Check
                            size={14}
                            className={cn(
                              'mr-2',
                              selectedEvidenceIds.includes(item.id)
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm">{item.source}</span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {item.evidence_type.replace('_', ' ')}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {errors.evidence && (
              <p className="text-xs text-destructive mt-1">{errors.evidence}</p>
            )}

            {/* Selected evidence chips */}
            {selectedEvidence.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedEvidence.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-blue-50 text-blue-800 border border-blue-200"
                  >
                    {item.source}
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidence(item.id)}
                      className="text-blue-400 hover:text-blue-700"
                      disabled={saving}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={14} className="mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Statement'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
