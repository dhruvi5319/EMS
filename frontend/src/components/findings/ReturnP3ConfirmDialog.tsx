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

interface ReturnP3ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: string;
  comment: string;
  onDecisionMade: () => void;
}

export const ReturnP3ConfirmDialog: React.FC<ReturnP3ConfirmDialogProps> = ({
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
        { decision: 'returned', comment }
      );
      if (result.ok) {
        onOpenChange(false);
        onDecisionMade();
        navigate('/review-queue');
        toast({ title: 'P3 review returned for revision.' });
      } else {
        const errorResult = result as { error: string; ok: false; status: number };
        onOpenChange(false);
        toast({
          title: errorResult.error ?? 'Failed to return P3 review.',
          variant: 'destructive',
        });
      }
    } catch {
      onOpenChange(false);
      toast({ title: 'Failed to return P3 review.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent style={{ maxWidth: 480 }}>
        <AlertDialogHeader>
          <AlertDialogTitle style={{ fontSize: 20, fontWeight: 600 }}>
            Return for Revision?
          </AlertDialogTitle>
          <AlertDialogDescription>
            The P3 review will be returned to the team with your comments. They will need to
            address all prerequisites before resubmitting.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Keep in Review
          </Button>
          <Button
            variant="outline"
            onClick={handleConfirm}
            disabled={loading}
            style={{
              borderColor: 'hsl(25 90% 52%)',
              color: 'hsl(25 90% 52%)',
              minWidth: 140,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ marginRight: 6 }} />
                Processing...
              </>
            ) : (
              'Confirm Return'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
