import { useState } from "react";
import type {
  SessionDTO,
  CardDTO,
  CardBatchUpdateItem,
  CardCreateCommand,
  CardImportCommand,
  AIEstimateCommand,
} from "@/types";
import type { TabValue } from "@/lib/types/session-view.types";
import { useSessionCards } from "@/components/hooks/useSessionCards";
import { useModals } from "@/components/hooks/useModals";
import { SessionHeader } from "./SessionHeader";
import { SessionTabs } from "./SessionTabs";
import { EmptyBoardState } from "./EmptyBoardState";
import { AddTaskModal } from "./AddTaskModal";
import { ImportCsvModal } from "./ImportCsvModal";
import { AiEstimationModal } from "./AiEstimationModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { toast } from "sonner";

interface SessionClientProps {
  sessionId: string;
  initialCards: CardDTO[];
  sessionData: SessionDTO;
}

/**
 * Main client component for the session view
 * Orchestrates all interactions, state management, and API communication
 */
export function SessionClient({ sessionId, initialCards, sessionData }: SessionClientProps) {
  // Hooks
  const { cards, loading, error, addCard, deleteCard, batchUpdateCards, importCards, runAiEstimation } =
    useSessionCards(sessionId, initialCards);
  const {
    modals,
    openAddTask,
    closeAddTask,
    openImportCsv,
    closeImportCsv,
    openAiEstimate,
    closeAiEstimate,
    openTaskDetail,
    closeTaskDetail,
  } = useModals();

  // Local state
  const [activeTab, setActiveTab] = useState<TabValue>("estimation");

  // Handlers
  const handleCardsUpdate = async (updates: CardBatchUpdateItem[]) => {
    try {
      await batchUpdateCards(updates);
      toast.success("Zmiany zapisane");
    } catch (err) {
      console.error("Error updating cards:", err);
      toast.error("Błąd podczas zapisywania zmian");
    }
  };

  const handleCardClick = (card: CardDTO) => {
    openTaskDetail(card);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
  };

  const handleAddCard = async (data: CardCreateCommand) => {
    await addCard(data);
  };

  const handleImportCards = async (data: CardImportCommand) => {
    return await importCards(data);
  };

  const handleAiEstimation = async (data: AIEstimateCommand) => {
    return await runAiEstimation(data);
  };

  const handleDeleteCard = async (cardId: string) => {
    await deleteCard(cardId);
  };

  // Loading state
  if (loading && cards.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Ładowanie sesji...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && cards.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-lg font-semibold text-destructive">Wystąpił błąd</p>
          <p className="mb-4 text-sm text-muted-foreground">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Odśwież stronę
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with actions */}
      <SessionHeader
        sessionId={sessionId}
        cardsCount={cards.length}
        onAddTask={openAddTask}
        onImportCsv={openImportCsv}
        onAiEstimate={openAiEstimate}
      />

      {/* Main content */}
      {cards.length === 0 ? (
        <div className="container mx-auto px-6 py-12">
          <EmptyBoardState onAddTask={openAddTask} onImportCsv={openImportCsv} />
        </div>
      ) : (
        <SessionTabs
          value={activeTab}
          onValueChange={handleTabChange}
          cards={cards}
          sessionId={sessionId}
          onCardClick={handleCardClick}
          onCardsUpdate={handleCardsUpdate}
        />
      )}

      {/* Modals */}
      <AddTaskModal
        isOpen={modals.addTask}
        onClose={closeAddTask}
        onSubmit={handleAddCard}
        sessionId={sessionId}
        currentCardsCount={cards.length}
      />

      <ImportCsvModal
        isOpen={modals.importCsv}
        onClose={closeImportCsv}
        onSubmit={handleImportCards}
        sessionId={sessionId}
        currentCardsCount={cards.length}
      />

      <AiEstimationModal
        isOpen={modals.aiEstimate}
        onClose={closeAiEstimate}
        onSubmit={handleAiEstimation}
        sessionId={sessionId}
        cardsCount={cards.length}
      />

      <TaskDetailModal
        isOpen={modals.taskDetail}
        onClose={closeTaskDetail}
        card={modals.selectedCard}
        onDelete={handleDeleteCard}
        sessionId={sessionId}
      />
    </div>
  );
}
