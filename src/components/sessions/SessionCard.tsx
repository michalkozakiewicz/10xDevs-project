import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CardsBadge } from "./CardsBadge";
import type { SessionListItemDTO } from "@/types";

interface SessionCardProps {
  session: SessionListItemDTO;
  onClick: (sessionId: string) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onClick }) => {
  const handleClick = () => {
    onClick(session.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(session.id);
    }
  };

  // Skrócenie UUID do pierwszych 8 znaków dla lepszej czytelności
  const shortId = session.id.split("-")[0];

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Otwórz sesję ${shortId}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="relative hover:border-primary hover:shadow-lg hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200 cursor-pointer group min-h-[140px]"
    >
      <CardHeader className="pb-12">
        <CardTitle className="text-lg font-mono group-hover:text-primary transition-colors">{shortId}</CardTitle>
      </CardHeader>
      <div className="absolute bottom-4 right-4">
        <CardsBadge count={session.cards_count} />
      </div>
    </Card>
  );
};
