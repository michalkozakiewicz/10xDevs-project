import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/services/ai-estimate.service";
import type { CardDTO } from "@/types";

/**
 * Testy jednostkowe dla AI Estimate Service
 *
 * Testujemy funkcje budujące prompty dla AI estymacji zadań
 */

describe("AI Estimate Service", () => {
  describe("buildSystemPrompt", () => {
    it("powinno zwrócić system prompt bez kontekstu", () => {
      const result = buildSystemPrompt(null);

      expect(result).toHaveProperty("role", "system");
      expect(result).toHaveProperty("content");
      expect(result.content).toContain("Jesteś ekspertem w estymacji zadań programistycznych");
      expect(result.content).toContain("Bucket System");
    });

    it("powinno zawierać zasady estymacji", () => {
      const result = buildSystemPrompt(null);

      expect(result.content).toContain("ZASADY ESTYMACJI");
      expect(result.content).toContain("1, 2, 3, 5, 8, 13, 21");
    });

    it("powinno opisywać znaczenie każdej wartości Fibonacciego", () => {
      const result = buildSystemPrompt(null);

      // Sprawdź czy opisane są wszystkie wartości
      expect(result.content).toContain("1: Trywialne");
      expect(result.content).toContain("2: Bardzo proste");
      expect(result.content).toContain("3: Proste");
      expect(result.content).toContain("5: Średnie");
      expect(result.content).toContain("8: Złożone");
      expect(result.content).toContain("13: Bardzo złożone");
      expect(result.content).toContain("21: Ekstremalne złożone");
    });

    it("powinno zawierać instrukcje formatowania odpowiedzi", () => {
      const result = buildSystemPrompt(null);

      expect(result.content).toContain("JSON");
      expect(result.content).toContain("Oceń każde zadanie niezależnie");
    });

    it("powinno dodać kontekst projektu gdy jest podany", () => {
      const context = "Projekt e-commerce w React i TypeScript";
      const result = buildSystemPrompt(context);

      expect(result.content).toContain("KONTEKST PROJEKTU:");
      expect(result.content).toContain(context);
      expect(result.content).toContain("Uwzględnij powyższy kontekst");
    });

    it("nie powinno dodawać sekcji kontekstu gdy jest null", () => {
      const result = buildSystemPrompt(null);

      expect(result.content).not.toContain("KONTEKST PROJEKTU:");
      expect(result.content).not.toContain("Uwzględnij powyższy kontekst");
    });

    it("powinno poprawnie obsłużyć pusty string jako kontekst", () => {
      const result = buildSystemPrompt("");

      // Pusty string jest falsy, więc nie powinien dodać kontekstu
      expect(result.content).not.toContain("KONTEKST PROJEKTU:");
    });

    it("powinno zachować strukturę ChatMessage", () => {
      const result = buildSystemPrompt("Test context");

      expect(result).toEqual({
        role: "system",
        content: expect.any(String),
      });
    });
  });

  describe("buildUserPrompt", () => {
    it("powinno zwrócić user prompt dla pustej tablicy kart", () => {
      const result = buildUserPrompt([]);

      expect(result).toHaveProperty("role", "user");
      expect(result).toHaveProperty("content");
      expect(result.content).toContain("Oszacuj następujące zadania");
      expect(result.content).toContain("1, 2, 3, 5, 8, 13, 21");
    });

    it("powinno sformatować pojedynczą kartę bez opisu", () => {
      const cards: CardDTO[] = [
        {
          id: "card-1",
          session_id: "session-1",
          external_id: "TASK-123",
          title: "Implementacja logowania użytkownika",
          description: null,
          bucket_value: null,
          has_embedding: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const result = buildUserPrompt(cards);

      expect(result.content).toContain("ID: card-1");
      expect(result.content).toContain("Tytuł: Implementacja logowania użytkownika");
      expect(result.content).not.toContain("Opis:");
    });

    it("powinno sformatować pojedynczą kartę z opisem", () => {
      const cards: CardDTO[] = [
        {
          id: "card-2",
          session_id: "session-1",
          external_id: "TASK-124",
          title: "Dodanie walidacji formularza",
          description: "Dodać walidację email i hasła zgodnie z OWASP",
          bucket_value: null,
          has_embedding: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const result = buildUserPrompt(cards);

      expect(result.content).toContain("ID: card-2");
      expect(result.content).toContain("Tytuł: Dodanie walidacji formularza");
      expect(result.content).toContain("Opis: Dodać walidację email i hasła zgodnie z OWASP");
    });

    it("powinno sformatować wiele kart z separatorami", () => {
      const cards: CardDTO[] = [
        {
          id: "card-1",
          session_id: "session-1",
          external_id: "TASK-1",
          title: "Zadanie 1",
          description: "Opis 1",
          bucket_value: null,
          has_embedding: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "card-2",
          session_id: "session-1",
          external_id: "TASK-2",
          title: "Zadanie 2",
          description: null,
          bucket_value: null,
          has_embedding: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "card-3",
          session_id: "session-1",
          external_id: "TASK-3",
          title: "Zadanie 3",
          description: "Opis 3",
          bucket_value: null,
          has_embedding: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const result = buildUserPrompt(cards);

      // Sprawdź czy wszystkie karty są w prompcie
      expect(result.content).toContain("ID: card-1");
      expect(result.content).toContain("ID: card-2");
      expect(result.content).toContain("ID: card-3");

      // Sprawdź separatory między kartami
      const separatorCount = (result.content.match(/---/g) || []).length;
      expect(separatorCount).toBe(2); // N-1 separatorów dla N kart
    });

    it("powinno zawierać instrukcje dla AI", () => {
      const cards: CardDTO[] = [];
      const result = buildUserPrompt(cards);

      expect(result.content).toContain("Oszacuj następujące zadania");
      expect(result.content).toContain("sekwencji Fibonacciego");
      expect(result.content).toContain("Zwróć JSON z estymacjami");
    });

    it("powinno zachować strukturę ChatMessage", () => {
      const cards: CardDTO[] = [];
      const result = buildUserPrompt(cards);

      expect(result).toEqual({
        role: "user",
        content: expect.any(String),
      });
    });

    it("powinno poprawnie obsłużyć karty z różnymi długościami opisów", () => {
      const cards: CardDTO[] = [
        {
          id: "card-1",
          session_id: "session-1",
          external_id: "TASK-1",
          title: "Zadanie z długim opisem",
          description: "To jest bardzo długi opis zadania, który zawiera wiele szczegółów i informacji".repeat(5),
          bucket_value: null,
          has_embedding: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const result = buildUserPrompt(cards);

      expect(result.content).toContain("ID: card-1");
      expect(result.content).toContain("Opis:");
      expect(result.content.length).toBeGreaterThan(500); // Długi opis powinien zwiększyć długość
    });

    it("powinno poprawnie escapować znaki specjalne w tytule i opisie", () => {
      const cards: CardDTO[] = [
        {
          id: "card-1",
          session_id: "session-1",
          external_id: "TASK-1",
          title: 'Zadanie z "cudzysłowami" i innymi znakami: <>&',
          description: "Opis z 'apostrofami' i \n nową linią",
          bucket_value: null,
          has_embedding: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const result = buildUserPrompt(cards);

      expect(result.content).toContain('Zadanie z "cudzysłowami"');
      expect(result.content).toContain("Opis z 'apostrofami'");
    });
  });
});
