import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  // Formatowanie daty utworzenia w polskim formacie
  const createdDate = new Date(session.created_at);
  const formattedDate = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(createdDate);

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Otwórz sesję ${shortId}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="relative hover:border-primary hover:shadow-lg hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200 cursor-pointer group min-h-[140px]"
    >
      <CardHeader className="pb-12 space-y-3">
        <Badge variant="outline" className="w-fit text-xs font-mono">
          {shortId}
        </Badge>
        <CardTitle className="text-base font-medium group-hover:text-primary transition-colors">
          Sesja planowania {formattedDate}
        </CardTitle>
      </CardHeader>
      <div className="absolute bottom-4 right-4">
        <CardsBadge count={session.cards_count} />
      </div>
    </Card>
  );
};
