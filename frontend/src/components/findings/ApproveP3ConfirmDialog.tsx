import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface ApproveP3ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  comment: string;
  onDecisionMade: () => void;
}

export const ApproveP3ConfirmDialog: React.FC<ApproveP3ConfirmDialogProps> = ({
  open,
  onOpenChange,
  engagementId,
  comment,
  onDecisionMade,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await api.post(
        `/engagements/${engagementId}/gate/p3`,
        { decision: 'approved', comment }
      );
      if (result.ok) {
        onOpenChange(false);
        toast({ title: 'Gate P3 approved.' });
        onDecisionMade();
        // Redirect to engagement shell with p3Approved state
        navigate(`/engagements/${engagementId}`, {
          state: { p3Approved: true },
        });
      } else {
        const errorResult = result as { error: string; ok: false; status: number };
        onOpenChange(false);
        toast({
          title: errorResult.error ?? 'Failed to approve Gate P3.',
          variant: 'destructive',
        });
      }
    } catch {
      onOpenChange(false);
      toast({ title: 'Failed to approve Gate P3.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent style={{ maxWidth: 520 }}>
        <AlertDialogHeader>
          <AlertDialogTitle style={{ fontSize: 20, fontWeight: 600 }}>
            Approve Evidence Sufficiency (Gate P3)?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will advance the engagement to the Draft phase. All objectives must be Sufficient
            or In Review. This action creates a permanent gate decision record.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Keep Under Review
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            style={{ minWidth: 180 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ marginRight: 6 }} />
                Processing P3 approval...
              </>
            ) : (
              'Confirm Approve P3 ✓'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
