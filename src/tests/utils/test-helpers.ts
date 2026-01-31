/**
 * Pomocnicze funkcje dla testów
 */

/**
 * Formatuje cenę z PLN
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(amount);
}

/**
 * Sprawdza czy email jest poprawny
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Zwraca inicjały użytkownika
 */
export function getUserInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
