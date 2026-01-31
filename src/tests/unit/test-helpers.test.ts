import { describe, it, expect } from "vitest";
import { formatPrice, isValidEmail, getUserInitials } from "../utils/test-helpers";

describe("formatPrice", () => {
  it("poprawnie formatuje cenę w PLN", () => {
    // Intl.NumberFormat używa nierozdzielnej spacji (\u00A0) między liczbą a symbolem waluty
    expect(formatPrice(100)).toBe("100,00\u00A0zł");
    expect(formatPrice(1234.56)).toBe("1234,56\u00A0zł");
  });

  it("obsługuje zero i liczby ujemne", () => {
    expect(formatPrice(0)).toBe("0,00\u00A0zł");
    expect(formatPrice(-50)).toBe("-50,00\u00A0zł");
  });
});

describe("isValidEmail", () => {
  it("zwraca true dla poprawnych adresów email", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    expect(isValidEmail("user+tag@example.com")).toBe(true);
  });

  it("zwraca false dla niepoprawnych adresów email", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("user @example.com")).toBe(false);
  });
});

describe("getUserInitials", () => {
  it("zwraca poprawne inicjały", () => {
    expect(getUserInitials("Jan", "Kowalski")).toBe("JK");
    expect(getUserInitials("Anna", "Nowak")).toBe("AN");
  });

  it("konwertuje na wielkie litery", () => {
    expect(getUserInitials("jan", "kowalski")).toBe("JK");
    expect(getUserInitials("anna", "nowak")).toBe("AN");
  });

  it("obsługuje imiona wieloczłonowe", () => {
    expect(getUserInitials("Jan-Piotr", "Kowalski")).toBe("JK");
  });
});
