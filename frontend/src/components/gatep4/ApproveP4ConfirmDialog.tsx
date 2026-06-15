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

interface ApproveP4ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  jobCode: string;
  outcome: 'ready_for_issuance' | 'closed';
  comment: string;
  onDecisionMade: () => void;
}

export const ApproveP4ConfirmDialog: React.FC<ApproveP4ConfirmDialogProps> = ({
  open,
  onOpenChange,
  engagementId,
  jobCode,
  outcome,
  comment,
  onDecisionMade,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await api.post(`/api/engagements/${engagementId}/gate/p4`, {
        decision: 'approved',
        outcome,
        comment,
      });

      if (result.ok) {
        onOpenChange(false);
        toast({ title: `Gate P4 approved.` });
        onDecisionMade();
        // Navigate to engagement shell with p4Approved state
        navigate(`/engagements/${engagementId}`, {
          state: { p4Approved: true, p4Outcome: outcome, p4JobCode: jobCode },
        });
      } else {
        const errorResult = result as { error: string; ok: false; status: number };
        onOpenChange(false);
        toast({
          title: errorResult.error ?? 'Failed to approve Gate P4.',
          variant: 'destructive',
        });
      }
    } catch {
      onOpenChange(false);
      toast({ title: 'Failed to approve Gate P4.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const descriptionText =
    outcome === 'ready_for_issuance'
      ? `This will mark ${jobCode} as Ready for Issuance and set the engagement to read-only. This action creates a permanent gate decision record.`
      : `This will close ${jobCode} and set the engagement to read-only. This action creates a permanent gate decision record.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent style={{ maxWidth: 520 }}>
        <AlertDialogHeader>
          <AlertDialogTitle style={{ fontSize: 20, fontWeight: 600 }}>
            Approve Final Readiness (Gate P4)?
          </AlertDialogTitle>
          <AlertDialogDescription>{descriptionText}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Keep Reviewing
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            style={{ minWidth: 200 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ marginRight: 6 }} />
                Processing...
              </>
            ) : (
              'Confirm Approve P4 ✓'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
