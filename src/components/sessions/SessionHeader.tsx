import { ArrowLeft, Plus, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SessionHeaderProps {
  sessionId: string;
  cardsCount: number;
  onAddTask: () => void;
  onImportCsv: () => void;
  onAiEstimate: () => void;
}

/**
 * Header for the session view with navigation and action buttons
 * Displays session ID, cards count, and provides actions for adding tasks, importing CSV, and AI estimation
 */
export function SessionHeader({ sessionId, cardsCount, onAddTask, onImportCsv, onAiEstimate }: SessionHeaderProps) {
  const isAiEstimateDisabled = cardsCount === 0;

  return (
    <div className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-4">
        {/* Left: Back button and session info */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <a href="/sessions" aria-label="Wróć do listy sesji">
              <ArrowLeft className="h-5 w-5" />
            </a>
          </Button>

          <div>
            <h1 className="text-lg font-semibold">Sesja Estymacji</h1>
            <p className="text-sm text-muted-foreground">
              ID: {sessionId.slice(0, 8)}... • {cardsCount} {cardsCount === 1 ? "zadanie" : "zadań"}
            </p>
          </div>
        </div>

        {/* Right: Action buttons */}
        <div className="flex items-center gap-2">
          <Button onClick={onAddTask} variant="default" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Dodaj zadanie</span>
          </Button>

          <Button onClick={onImportCsv} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importuj CSV</span>
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    onClick={onAiEstimate}
                    variant="secondary"
                    disabled={isAiEstimateDisabled}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">Estymuj przez AI</span>
                  </Button>
                </span>
              </TooltipTrigger>
              {isAiEstimateDisabled && (
                <TooltipContent>
                  <p>Brak zadań do estymacji</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
