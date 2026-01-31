import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSession, updateSession, getSessionById } from "@/lib/services/session.service";
import type { SessionCreateCommand, SessionUpdateCommand } from "@/types";

/**
 * Testy jednostkowe dla SessionService
 *
 * Testujemy logikę biznesową serwisu z zamockowanym klientem Supabase
 */

describe("SessionService", () => {
  // Mock Supabase client
  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSession", () => {
    it("powinno utworzyć nową sesję z context", async () => {
      const userId = "user-123";
      const command: SessionCreateCommand = {
        context: "Sprint Planning Q1 2024",
      };

      const mockSessionData = {
        id: "session-123",
        user_id: userId,
        is_active: true,
        context: command.context,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Mockowanie chain: from().insert().select().single()
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockSessionData,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await createSession(mockSupabase as any, userId, command);

      expect(mockSupabase.from).toHaveBeenCalledWith("sessions");
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        context: command.context,
        is_active: true,
      });

      expect(result).toEqual({
        id: mockSessionData.id,
        user_id: mockSessionData.user_id,
        is_active: mockSessionData.is_active,
        context: mockSessionData.context,
        created_at: mockSessionData.created_at,
        updated_at: mockSessionData.updated_at,
      });
    });

    it("powinno utworzyć sesję z null context gdy nie podano", async () => {
      const userId = "user-123";
      const command: SessionCreateCommand = {
        context: undefined,
      };

      const mockSessionData = {
        id: "session-123",
        user_id: userId,
        is_active: true,
        context: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockSessionData,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await createSession(mockSupabase as any, userId, command);

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        context: null,
        is_active: true,
      });

      expect(result.context).toBeNull();
    });

    it("powinno rzucić błąd gdy operacja bazy danych się nie powiedzie", async () => {
      const userId = "user-123";
      const command: SessionCreateCommand = {
        context: "Test",
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });

      await expect(createSession(mockSupabase as any, userId, command)).rejects.toThrow(
        "Failed to create session: Database error"
      );
    });
  });

  describe("updateSession", () => {
    it("powinno zaktualizować context sesji", async () => {
      const sessionId = "session-123";
      const command: SessionUpdateCommand = {
        context: "Updated context",
      };

      const mockUpdatedSession = {
        id: sessionId,
        user_id: "user-123",
        is_active: true,
        context: command.context,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T12:00:00Z",
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUpdatedSession,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      const result = await updateSession(mockSupabase as any, sessionId, command);

      expect(mockUpdate).toHaveBeenCalledWith(command);
      expect(mockEq).toHaveBeenCalledWith("id", sessionId);
      expect(result.context).toBe(command.context);
    });

    it("powinno dezaktywować sesję", async () => {
      const sessionId = "session-123";
      const command: SessionUpdateCommand = {
        is_active: false,
      };

      const mockUpdatedSession = {
        id: sessionId,
        user_id: "user-123",
        is_active: false,
        context: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T12:00:00Z",
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: mockUpdatedSession,
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      const result = await updateSession(mockSupabase as any, sessionId, command);

      expect(result.is_active).toBe(false);
    });

    it("powinno rzucić błąd SESSION_NOT_FOUND gdy sesja nie istnieje", async () => {
      const sessionId = "non-existent";
      const command: SessionUpdateCommand = {
        context: "Test",
      };

      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });

      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });

      await expect(updateSession(mockSupabase as any, sessionId, command)).rejects.toThrow("SESSION_NOT_FOUND");
    });
  });

  describe("getSessionById", () => {
    it("powinno zwrócić sesję z licznikiem kart", async () => {
      const sessionId = "session-123";
      const userId = "user-123";

      const mockSession = {
        id: sessionId,
        user_id: userId,
        is_active: true,
        context: "Test session",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Mock dla sessions query
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: mockSession,
        error: null,
      });

      const mockSessionEq = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      const mockUserEq = vi.fn().mockReturnValue({
        eq: mockSessionEq,
      });

      const mockSessionsSelect = vi.fn().mockReturnValue({
        eq: mockUserEq,
      });

      // Mock dla cards count query - .select().eq() zwraca Promise
      const mockCardsSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      });

      // Różne mocki w zależności od tabeli
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "sessions") {
          return { select: mockSessionsSelect };
        } else if (table === "cards") {
          return { select: mockCardsSelect };
        }
      });

      const result = await getSessionById(mockSupabase as any, sessionId, userId);

      expect(result).toEqual({
        ...mockSession,
        cards_count: 5,
      });
    });

    it("powinno zwrócić null gdy sesja nie istnieje", async () => {
      const sessionId = "non-existent";
      const userId = "user-123";

      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const mockSessionEq = vi.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      const mockUserEq = vi.fn().mockReturnValue({
        eq: mockSessionEq,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockUserEq,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });

      const result = await getSessionById(mockSupabase as any, sessionId, userId);

      expect(result).toBeNull();
    });
  });
});
