import { useState, useCallback } from "react";
import type { CardDTO } from "@/types";
import type { ModalState } from "@/lib/types/session-view.types";

/**
 * Return type for useModals hook
 */
interface UseModalsReturn {
  modals: ModalState;
  openAddTask: () => void;
  closeAddTask: () => void;
  openImportCsv: () => void;
  closeImportCsv: () => void;
  openAiEstimate: () => void;
  closeAiEstimate: () => void;
  openTaskDetail: (card: CardDTO) => void;
  closeTaskDetail: () => void;
}

/**
 * Custom hook for managing modal states in the session view
 *
 * @returns Modal states and open/close functions
 */
export function useModals(): UseModalsReturn {
  const [modals, setModals] = useState<ModalState>({
    addTask: false,
    importCsv: false,
    aiEstimate: false,
    taskDetail: false,
    selectedCard: null,
  });

  /**
   * Open Add Task modal
   */
  const openAddTask = useCallback(() => {
    setModals((prev) => ({
      ...prev,
      addTask: true,
    }));
  }, []);

  /**
   * Close Add Task modal
   */
  const closeAddTask = useCallback(() => {
    setModals((prev) => ({
      ...prev,
      addTask: false,
    }));
  }, []);

  /**
   * Open Import CSV modal
   */
  const openImportCsv = useCallback(() => {
    setModals((prev) => ({
      ...prev,
      importCsv: true,
    }));
  }, []);

  /**
   * Close Import CSV modal
   */
  const closeImportCsv = useCallback(() => {
    setModals((prev) => ({
      ...prev,
      importCsv: false,
    }));
  }, []);

  /**
   * Open AI Estimate modal
   */
  const openAiEstimate = useCallback(() => {
    setModals((prev) => ({
      ...prev,
      aiEstimate: true,
    }));
  }, []);

  /**
   * Close AI Estimate modal
   */
  const closeAiEstimate = useCallback(() => {
    setModals((prev) => ({
      ...prev,
      aiEstimate: false,
    }));
  }, []);

  /**
   * Open Task Detail modal with selected card
   */
  const openTaskDetail = useCallback((card: CardDTO) => {
    setModals((prev) => ({
      ...prev,
      taskDetail: true,
      selectedCard: card,
    }));
  }, []);

  /**
   * Close Task Detail modal and clear selected card
   */
  const closeTaskDetail = useCallback(() => {
    setModals((prev) => ({
      ...prev,
      taskDetail: false,
      selectedCard: null,
    }));
  }, []);

  return {
    modals,
    openAddTask,
    closeAddTask,
    openImportCsv,
    closeImportCsv,
    openAiEstimate,
    closeAiEstimate,
    openTaskDetail,
    closeTaskDetail,
  };
}
