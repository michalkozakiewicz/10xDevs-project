import { useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { CardCreateCommand } from "@/types";
import { toast } from "sonner";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CardCreateCommand) => Promise<void>;
  sessionId: string;
  currentCardsCount: number;
}

/**
 * Zod schema for add task form validation
 */
const addTaskSchema = z.object({
  external_id: z.string().min(1, "ID zadania jest wymagane"),
  title: z.string().min(1, "Tytuł jest wymagany"),
  description: z.string().optional(),
});

type AddTaskFormValues = z.infer<typeof addTaskSchema>;

/**
 * Modal for adding a single task manually
 * Uses react-hook-form with Zod validation
 */
export function AddTaskModal({ isOpen, onClose, onSubmit, sessionId, currentCardsCount }: AddTaskModalProps) {
  const form = useForm<AddTaskFormValues>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      external_id: "",
      title: "",
      description: "",
    },
  });

  // Check if limit is reached
  const isLimitReached = currentCardsCount >= 50;

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  // Handle form submission
  const handleSubmit = async (values: AddTaskFormValues) => {
    try {
      await onSubmit({
        external_id: values.external_id,
        title: values.title,
        description: values.description || null,
      });

      toast.success("Zadanie dodane pomyślnie");
      onClose();
    } catch (error) {
      // Handle specific error codes
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // 409 Conflict - duplicate external_id
        if (errorMessage.includes("duplicate") || errorMessage.includes("conflict")) {
          form.setError("external_id", {
            type: "manual",
            message: "Zadanie o tym ID już istnieje w sesji",
          });
          return;
        }

        // 422 Unprocessable Entity - limit exceeded
        if (errorMessage.includes("limit") || errorMessage.includes("422")) {
          toast.error("Osiągnięto limit 50 zadań");
          onClose();
          return;
        }

        // Generic error
        toast.error(error.message || "Wystąpił błąd podczas dodawania zadania");
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj zadanie</DialogTitle>
          <DialogDescription>Wprowadź szczegóły zadania do estymacji.</DialogDescription>
        </DialogHeader>

        {isLimitReached ? (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            Osiągnięto maksymalny limit 50 zadań w sesji.
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* External ID */}
              <FormField
                control={form.control}
                name="external_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID zadania *</FormLabel>
                    <FormControl>
                      <Input placeholder="np. TASK-123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tytuł *</FormLabel>
                    <FormControl>
                      <Input placeholder="np. Implementacja widoku użytkownika" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opis (opcjonalnie)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Szczegółowy opis zadania..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={form.formState.isSubmitting}>
                  Anuluj
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Dodawanie..." : "Dodaj zadanie"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
