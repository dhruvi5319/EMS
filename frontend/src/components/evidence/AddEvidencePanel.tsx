import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useEvidenceCoverage } from '@/hooks/useEvidence';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { EvidenceFileUpload } from './EvidenceFileUpload';
import { useToast } from '@/components/ui/use-toast';

const schema = z.object({
  evidence_type: z.string().min(1, 'Required'),
  source: z.string().min(1, 'Required').max(500, 'Max 500 characters'),
  date_received: z.date().refine((d) => !!d, { message: 'Required' }),
  custodian: z.string().max(255, 'Max 255 characters').optional(),
  description: z.string().optional(),
  sensitivity: z.enum(['standard', 'restricted']),
  linked_objectives: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddEvidencePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  onSuccess: () => void;
}

export const AddEvidencePanel: React.FC<AddEvidencePanelProps> = ({
  open,
  onOpenChange,
  engagementId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { coverage } = useEvidenceCoverage(engagementId);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      sensitivity: 'standard',
      linked_objectives: [],
    },
  });

  useEffect(() => {
    if (!open) {
      reset({ sensitivity: 'standard', linked_objectives: [] });
      setQueuedFiles([]);
    }
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      // Step 1: Create evidence item
      const createResult = await api.post<{ evidence: { id: string } }>(
        `/engagements/${engagementId}/evidence`,
        {
          evidence_type: values.evidence_type,
          source: values.source,
          date_received: format(values.date_received, 'yyyy-MM-dd'),
          custodian: values.custodian || null,
          description: values.description || null,
          sensitivity: values.sensitivity,
          objective_ids: values.linked_objectives ?? [],
        }
      );

      if (!createResult.ok) {
        toast({ title: 'Failed to save evidence.', description: createResult.error, variant: 'destructive' });
        setSaving(false);
        return;
      }

      const evidenceId = createResult.data.evidence.id;

      // Step 2: Upload queued files
      for (const file of queuedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        await fetch(`/api/engagements/${engagementId}/evidence/${evidenceId}/files`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
      }

      toast({ title: 'Evidence item saved.' });
      onSuccess();
      onOpenChange(false);
    } catch {
      toast({ title: 'An error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (queuedFiles.length > 0) {
      // Show inline warning but still allow discard
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[640px] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Add Evidence Item"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>Add Evidence Item</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {/* EVIDENCE METADATA section */}
          <div className="space-y-1">
            <p className="text-[12px] font-normal uppercase tracking-wide text-slate-500">Evidence Metadata</p>
            <Separator className="my-2" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="evidence_type">Evidence Type <span className="text-red-600">*</span></Label>
            <Controller
              name="evidence_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="evidence_type" className={cn(errors.evidence_type && isSubmitted ? 'border-red-500' : '')}>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="dataset">Dataset</SelectItem>
                    <SelectItem value="interview_note">Interview Note</SelectItem>
                    <SelectItem value="meeting_note">Meeting Note</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.evidence_type && isSubmitted && (
              <p className="text-xs text-red-600">Required</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="source">Source <span className="text-red-600">*</span></Label>
            <Input
              id="source"
              placeholder="e.g., Agency Budget Office, Staff Interview"
              className={cn(errors.source && isSubmitted ? 'border-red-500' : '')}
              {...register('source')}
            />
            {errors.source && isSubmitted && (
              <p className="text-xs text-red-600">Required</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="date_received">Date Received <span className="text-red-600">*</span></Label>
            <Controller
              name="date_received"
              control={control}
              render={({ field }) => (
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="date_received"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                        errors.date_received && isSubmitted ? 'border-red-500' : ''
                      )}
                      type="button"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'MM/dd/yyyy') : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setCalendarOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <p className="text-[12px] text-slate-400">ℹ Date evidence was received, not date of event</p>
            {errors.date_received && isSubmitted && (
              <p className="text-xs text-red-600">Required</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="custodian">Custodian / Provider</Label>
            <Input
              id="custodian"
              placeholder="e.g., Director Jane Smith"
              {...register('custodian')}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the evidence item..."
              rows={3}
              {...register('description')}
            />
          </div>

          <div className="space-y-1">
            <Label>Sensitivity <span className="text-red-600">*</span></Label>
            <Controller
              name="sensitivity"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="standard" id="sens-standard" />
                    <Label htmlFor="sens-standard" className="font-normal cursor-pointer">
                      Standard <span className="text-slate-400 text-xs">(visible to all engagement team members)</span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="restricted" id="sens-restricted" />
                    <Label htmlFor="sens-restricted" className="font-normal cursor-pointer">
                      Restricted <span className="text-slate-400 text-xs">(visible to AN, EM, QA, IR, PC, Admin only)</span>
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          {/* LINK TO OBJECTIVES section */}
          <div className="space-y-1">
            <p className="text-[12px] font-normal uppercase tracking-wide text-slate-500">Link to Objectives (optional — can link after saving)</p>
            <Separator className="my-2" />
          </div>

          <div className="space-y-2">
            <Controller
              name="linked_objectives"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {coverage?.objectives && coverage.objectives.length > 0 ? (
                    coverage.objectives.map((obj) => {
                      const truncatedText = obj.objective_text.length > 40
                        ? obj.objective_text.slice(0, 40) + '…'
                        : obj.objective_text;
                      const checked = (field.value ?? []).includes(obj.id);
                      return (
                        <div key={obj.id} className="flex items-start gap-2">
                          <Checkbox
                            id={`obj-${obj.id}`}
                            checked={checked}
                            aria-label={`Link evidence to: ${truncatedText}`}
                            onCheckedChange={(chk) => {
                              const current = field.value ?? [];
                              if (chk) {
                                field.onChange([...current, obj.id]);
                              } else {
                                field.onChange(current.filter((id) => id !== obj.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`obj-${obj.id}`}
                            className="font-normal cursor-pointer text-sm"
                          >
                            {truncatedText}
                          </Label>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-400">No objectives found for this engagement.</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* UPLOAD FILES section */}
          <div className="space-y-1">
            <p className="text-[12px] font-normal uppercase tracking-wide text-slate-500">Upload Files</p>
            <Separator className="my-2" />
          </div>

          <EvidenceFileUpload
            engagementId={engagementId}
            onFilesChange={setQueuedFiles}
          />

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDiscard}
              disabled={saving}
            >
              Discard Evidence
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="min-w-[160px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Evidence Item'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};
