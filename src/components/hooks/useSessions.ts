import { useState, useEffect } from "react";
import type {
  SessionListItemDTO,
  PaginationDTO,
  SessionsListResponseDTO,
  SessionsQueryParams,
  SessionCreateCommand,
  SessionDTO,
  SessionResponseDTO,
  APIErrorDTO,
} from "@/types";

interface SessionsViewState {
  sessions: SessionListItemDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
}

interface UseSessionsReturn {
  // Stan
  sessions: SessionListItemDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;

  // Akcje
  fetchSessions: (params?: SessionsQueryParams) => Promise<void>;
  createSession: (command?: SessionCreateCommand) => Promise<SessionDTO | null>;
  clearError: () => void;
}

const initialState: SessionsViewState = {
  sessions: [],
  pagination: null,
  isLoading: true, // true przy pierwszym renderze
  isCreating: false,
  error: null,
};

export const useSessions = (): UseSessionsReturn => {
  const [state, setState] = useState<SessionsViewState>(initialState);

  const fetchSessions = async (params?: SessionsQueryParams): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const searchParams = new URLSearchParams();
      if (params?.is_active !== undefined) {
        searchParams.set("is_active", String(params.is_active));
      }
      if (params?.limit) {
        searchParams.set("limit", String(params.limit));
      }
      if (params?.offset) {
        searchParams.set("offset", String(params.offset));
      }

      const response = await fetch(`/api/sessions?${searchParams}`);

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error("Nie udało się pobrać sesji");
      }

      const data: SessionsListResponseDTO = await response.json();

      setState((prev) => ({
        ...prev,
        sessions: data.data,
        pagination: data.pagination,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Wystąpił nieznany błąd",
      }));
    }
  };

  const createSession = async (command?: SessionCreateCommand): Promise<SessionDTO | null> => {
    setState((prev) => ({ ...prev, isCreating: true, error: null }));

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command ?? {}),
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return null;
      }

      if (!response.ok) {
        const errorData: APIErrorDTO = await response.json();
        throw new Error(errorData.message || "Nie udało się utworzyć sesji");
      }

      const data: SessionResponseDTO = await response.json();

      setState((prev) => ({ ...prev, isCreating: false }));

      return data.data as SessionDTO;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isCreating: false,
        error: error instanceof Error ? error.message : "Wystąpił nieznany błąd",
      }));
      return null;
    }
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  // Pobierz sesje przy montowaniu komponentu
  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions: state.sessions,
    pagination: state.pagination,
    isLoading: state.isLoading,
    isCreating: state.isCreating,
    error: state.error,
    fetchSessions,
    createSession,
    clearError,
  };
};
