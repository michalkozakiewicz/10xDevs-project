import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { AIEstimateCommand, AIEstimateResultDTO } from "@/types";
import { Sparkles, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AiEstimationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AIEstimateCommand) => Promise<AIEstimateResultDTO>;
  sessionId: string;
  cardsCount: number;
}

/**
 * Zod schema for AI estimation form validation
 */
const aiEstimateSchema = z.object({
  context: z.string().optional(),
  confirm_override: z.boolean().refine((val) => val === true, {
    message: "Musisz potwierdzić nadpisanie obecnego układu kart",
  }),
});

type AiEstimateFormValues = z.infer<typeof aiEstimateSchema>;

/**
 * Modal for running AI estimation on all cards in the session
 * Requires user confirmation before overriding current card positions
 */
export function AiEstimationModal({ isOpen, onClose, onSubmit, sessionId, cardsCount }: AiEstimationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const form = useForm<AiEstimateFormValues>({
    resolver: zodResolver(aiEstimateSchema),
    defaultValues: {
      context: "",
      confirm_override: false,
    },
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setRetryCount(0);
    }
  }, [isOpen, form]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (values: AiEstimateFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        confirm_override: values.confirm_override,
      });

      toast.success(`Estymacja zakończona: ${result.data.estimated_cards} zadań oszacowanych`);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // 400 Bad Request - no cards
        if (errorMessage.includes("no cards") || errorMessage.includes("400")) {
          toast.error("Brak zadań do estymacji");
          onClose();
          return;
        }

        // 503 Service Unavailable - AI service down
        if (errorMessage.includes("503") || errorMessage.includes("unavailable")) {
          setRetryCount((prev) => prev + 1);
          toast.error("Usługa AI jest tymczasowo niedostępna", {
            description: "Spróbuj ponownie za chwilę",
            action: {
              label: "Spróbuj ponownie",
              onClick: () => form.handleSubmit(handleSubmit)(),
            },
          });
          return;
        }

        // 429 Too Many Requests - rate limit
        if (errorMessage.includes("429") || errorMessage.includes("rate limit") || errorMessage.includes("too many")) {
          toast.error("Przekroczono limit zapytań do AI", {
            description: "Spróbuj ponownie za kilka minut",
          });
          return;
        }

        // Generic error
        toast.error(error.message || "Wystąpił błąd podczas estymacji AI");
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Automatyczna estymacja przez AI
          </DialogTitle>
          <DialogDescription>
            Sztuczna inteligencja oszacuje wszystkie zadania w sesji na podstawie ich tytułów i opisów.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Warning alert */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Uwaga!</AlertTitle>
              <AlertDescription>
                Estymacja AI nadpisze obecny układ kart w kubełkach. Wszystkie ręczne zmiany zostaną utracone. Ta
                operacja jest nieodwracalna.
              </AlertDescription>
            </Alert>

            {/* Cards count info */}
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <p className="font-medium">Do oszacowania:</p>
              <p className="mt-1 text-muted-foreground">
                {cardsCount} {cardsCount === 1 ? "zadanie" : "zadań"}
              </p>
            </div>

            {/* Context textarea (optional) */}
            <FormField
              control={form.control}
              name="context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kontekst projektu (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="np. Aplikacja webowa w React, średnia złożoność zespołu, krótkie sprinty..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Dodatkowy kontekst pomoże AI lepiej oszacować zadania. Możesz opisać specyfikę projektu, zespołu
                    lub technologii.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirmation checkbox */}
            <FormField
              control={form.control}
              name="confirm_override"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">Potwierdzam nadpisanie obecnego układu kart</FormLabel>
                    <FormDescription>
                      Rozumiem, że obecne estymacje zostaną zastąpione przez AI i nie będzie można ich przywrócić.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {/* Retry count indicator */}
            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground">Próba: {retryCount + 1}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Anuluj
              </Button>
              <Button type="submit" disabled={!form.watch("confirm_override") || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Estymowanie...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Estymuj
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
