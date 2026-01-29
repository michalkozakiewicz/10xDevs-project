import { Inbox, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyBoardStateProps {
  onAddTask: () => void;
  onImportCsv: () => void;
}

/**
 * Empty state displayed when there are no cards in the session
 * Provides CTA buttons to add tasks or import from CSV
 */
export function EmptyBoardState({ onAddTask, onImportCsv }: EmptyBoardStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-6 rounded-full bg-muted p-6">
        <Inbox className="h-12 w-12 text-muted-foreground" />
      </div>

      <h3 className="mb-2 text-xl font-semibold">Brak zadań w sesji</h3>

      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        Rozpocznij estymację dodając pierwsze zadanie lub zaimportuj listę zadań z pliku CSV.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onAddTask} className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj zadanie
        </Button>

        <Button onClick={onImportCsv} variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importuj CSV
        </Button>
      </div>
    </div>
  );
}
