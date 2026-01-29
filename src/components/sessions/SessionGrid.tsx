import { NewSessionCard } from "./NewSessionCard";
import { SessionCard } from "./SessionCard";
import type { SessionListItemDTO } from "@/types";

interface SessionGridProps {
  sessions: SessionListItemDTO[];
  onSessionClick: (sessionId: string) => void;
  onCreateSession: () => void;
  isCreating: boolean;
}

export const SessionGrid: React.FC<SessionGridProps> = ({ sessions, onSessionClick, onCreateSession, isCreating }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <NewSessionCard onClick={onCreateSession} isLoading={isCreating} />
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} onClick={onSessionClick} />
      ))}
    </div>
  );
};
