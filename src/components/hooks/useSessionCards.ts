import { useState, useCallback } from "react";
import type {
  CardDTO,
  CardCreateCommand,
  CardUpdateCommand,
  CardBatchUpdateItem,
  CardImportCommand,
  AIEstimateCommand,
  CardResponseDTO,
  CardsListResponseDTO,
  CardBatchUpdateResponseDTO,
  CardImportResultDTO,
  AIEstimateResultDTO,
} from "@/types";

/**
 * State for useSessionCards hook
 */
interface UseSessionCardsState {
  cards: CardDTO[];
  loading: boolean;
  error: Error | null;
}

/**
 * Return type for useSessionCards hook
 */
interface UseSessionCardsReturn {
  cards: CardDTO[];
  loading: boolean;
  error: Error | null;

  // CRUD operations
  fetchCards: () => Promise<void>;
  addCard: (data: CardCreateCommand) => Promise<CardDTO>;
  updateCard: (id: string, data: CardUpdateCommand) => Promise<CardDTO>;
  deleteCard: (id: string) => Promise<void>;
  batchUpdateCards: (updates: CardBatchUpdateItem[]) => Promise<void>;

  // Import & AI
  importCards: (data: CardImportCommand) => Promise<CardImportResultDTO>;
  runAiEstimation: (data: AIEstimateCommand) => Promise<AIEstimateResultDTO>;
}

/**
 * Custom hook for managing session cards state and API communication
 *
 * @param sessionId - The ID of the current session
 * @param initialCards - Initial cards data from server-side fetch
 * @returns Cards state and CRUD operations
 */
export function useSessionCards(sessionId: string, initialCards: CardDTO[] = []): UseSessionCardsReturn {
  const [cards, setCards] = useState<CardDTO[]>(initialCards);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch all cards for the session
   */
  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${sessionId}/cards`);

      if (!response.ok) {
        // TODO: Re-enable authentication handling later
        // if (response.status === 401) {
        //   window.location.href = "/login";
        //   return;
        // }
        throw new Error(`Failed to fetch cards: ${response.statusText}`);
      }

      const result: CardsListResponseDTO = await response.json();
      setCards(result.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error occurred");
      setError(error);
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  /**
   * Add a new card to the session
   */
  const addCard = useCallback(
    async (data: CardCreateCommand): Promise<CardDTO> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sessions/${sessionId}/cards`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to add card: ${response.statusText}`);
        }

        const result: CardResponseDTO = await response.json();
        const newCard = result.data;

        // Update local state
        setCards((prev) => [...prev, newCard]);

        return newCard;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  /**
   * Update a single card
   */
  const updateCard = useCallback(
    async (id: string, data: CardUpdateCommand): Promise<CardDTO> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sessions/${sessionId}/cards/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to update card: ${response.statusText}`);
        }

        const result: CardResponseDTO = await response.json();
        const updatedCard = result.data;

        // Update local state
        setCards((prev) => prev.map((card) => (card.id === id ? updatedCard : card)));

        return updatedCard;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  /**
   * Delete a card (optimistic UI update)
   */
  const deleteCard = useCallback(
    async (id: string): Promise<void> => {
      // Optimistic update - remove from UI immediately
      setCards((prev) => prev.filter((card) => card.id !== id));

      try {
        const response = await fetch(`/api/sessions/${sessionId}/cards/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          // If delete fails, we don't rollback - user needs to refresh manually
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to delete card: ${response.statusText}`);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        console.error("Error deleting card:", error);
        throw error;
      }
    },
    [sessionId]
  );

  /**
   * Batch update multiple cards (for drag-and-drop)
   */
  const batchUpdateCards = useCallback(
    async (updates: CardBatchUpdateItem[]): Promise<void> => {
      // Optimistic update
      setCards((prev) =>
        prev.map((card) => {
          const update = updates.find((u) => u.id === card.id);
          return update ? { ...card, bucket_value: update.bucket_value } : card;
        })
      );

      try {
        const response = await fetch(`/api/sessions/${sessionId}/cards`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cards: updates }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to update cards: ${response.statusText}`);
        }

        const result: CardBatchUpdateResponseDTO = await response.json();
        console.log(`Batch updated ${result.data.updated} cards`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        console.error("Error batch updating cards:", error);
        throw error;
      }
    },
    [sessionId]
  );

  /**
   * Import cards from CSV
   */
  const importCards = useCallback(
    async (data: CardImportCommand): Promise<CardImportResultDTO> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sessions/${sessionId}/cards/import`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to import cards: ${response.statusText}`);
        }

        const result: CardImportResultDTO = await response.json();

        // Refresh cards after import
        await fetchCards();

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [sessionId, fetchCards]
  );

  /**
   * Run AI estimation for all cards in the session
   */
  const runAiEstimation = useCallback(
    async (data: AIEstimateCommand): Promise<AIEstimateResultDTO> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/sessions/${sessionId}/ai/estimate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Failed to run AI estimation: ${response.statusText}`);
        }

        const result: AIEstimateResultDTO = await response.json();

        // Refresh cards after estimation
        await fetchCards();

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [sessionId, fetchCards]
  );

  return {
    cards,
    loading,
    error,
    fetchCards,
    addCard,
    updateCard,
    deleteCard,
    batchUpdateCards,
    importCards,
    runAiEstimation,
  };
}
