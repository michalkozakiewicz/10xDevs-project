import { useSessions } from "@/components/hooks/useSessions";
import { PageHeader } from "./PageHeader";
import { SessionGrid } from "./SessionGrid";
import { SessionCardSkeleton } from "./SessionCardSkeleton";
import { ErrorDisplay } from "./ErrorDisplay";

export const SessionsDashboard: React.FC = () => {
  const { sessions, isLoading, isCreating, error, fetchSessions, createSession, clearError } = useSessions();

  /**
   * Obsługa nawigacji do wybranej sesji
   */
  const handleSessionClick = (sessionId: string) => {
    window.location.href = `/sessions/${sessionId}`;
  };

  /**
   * Obsługa tworzenia nowej sesji
   */
  const handleCreateSession = async () => {
    const newSession = await createSession();

    if (newSession) {
      // Przekierowanie do nowo utworzonej sesji
      window.location.href = `/sessions/${newSession.id}`;
    }
    // Jeśli błąd, zostanie wyświetlony przez ErrorDisplay
  };

  /**
   * Obsługa ponownego pobierania sesji po błędzie
   */
  const handleRetry = () => {
    clearError();
    fetchSessions();
  };

  // Stan ładowania - wyświetl skeletony
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Twoje sesje planowania" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <SessionCardSkeleton />
          <SessionCardSkeleton />
          <SessionCardSkeleton />
          <SessionCardSkeleton />
        </div>
      </div>
    );
  }

  // Stan błędu - wyświetl komunikat
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="Twoje sesje planowania" />
        <ErrorDisplay message={error} onRetry={handleRetry} />
      </div>
    );
  }

  // Stan danych - wyświetl sesje
  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Twoje sesje planowania" />
      <SessionGrid
        sessions={sessions}
        onSessionClick={handleSessionClick}
        onCreateSession={handleCreateSession}
        isCreating={isCreating}
      />
    </div>
  );
};
