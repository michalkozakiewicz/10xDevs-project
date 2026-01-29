import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CardDTO } from "@/types";
import { BUCKET_CONFIGS } from "@/lib/types/session-view.types";
import { Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardDTO | null;
  onDelete: (cardId: string) => Promise<void>;
  sessionId: string;
}

/**
 * Modal displaying full task details with delete action
 * Uses AlertDialog for delete confirmation
 * Implements optimistic UI update for deletion
 */
export function TaskDetailModal({ isOpen, onClose, card, onDelete, sessionId }: TaskDetailModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!card) {
    return null;
  }

  // Get bucket config for color and label
  const bucketConfig = BUCKET_CONFIGS.find((config) => config.value === card.bucket_value);

  // Get badge variant based on bucket value
  const getBadgeVariant = (bucketValue: CardDTO["bucket_value"]) => {
    if (bucketValue === null) return "outline";
    if (bucketValue <= 2) return "default";
    if (bucketValue <= 5) return "secondary";
    return "destructive";
  };

  /**
   * Handle delete confirmation
   */
  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // Optimistic UI - close modal immediately
      onClose();
      setShowDeleteDialog(false);

      // Show success toast
      toast.success("Zadanie usunięte");

      // Call API
      await onDelete(card.id);
    } catch (error) {
      // Error handling - card stays deleted (no rollback)
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes("404")) {
          toast.error("Zadanie nie znalezione");
        } else {
          toast.error("Błąd podczas usuwania zadania");
        }
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
      console.error("Error deleting card:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <DialogTitle className="text-xl">{card.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {card.external_id}
                </Badge>
                <Badge variant={getBadgeVariant(card.bucket_value)} className="font-semibold">
                  {bucketConfig?.label || "?"}
                  {card.bucket_value !== null && " SP"}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Opis</h4>
            {card.description ? (
              <p className="text-sm leading-relaxed">{card.description}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground">Brak opisu</p>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-2 rounded-lg border bg-muted/50 p-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Utworzono:</span>
              <span className="font-medium text-foreground">{formatDate(card.created_at)}</span>
            </div>
            {card.updated_at !== card.created_at && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Zaktualizowano:</span>
                <span className="font-medium text-foreground">{formatDate(card.updated_at)}</span>
              </div>
            )}
            {card.has_embedding && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>✓ Embedding wygenerowany</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          {/* Delete button with AlertDialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2 sm:mr-auto" disabled={isDeleting}>
                <Trash2 className="h-4 w-4" />
                Usuń zadanie
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Czy na pewno chcesz usunąć to zadanie?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ta operacja jest nieodwracalna. Zadanie <strong>{card.external_id}</strong> zostanie trwale
                  usunięte z sesji.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Usuń
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Close button */}
          <Button variant="outline" onClick={onClose}>
            Zamknij
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
