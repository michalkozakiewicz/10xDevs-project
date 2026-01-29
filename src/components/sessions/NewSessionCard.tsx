import { Card } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";

interface NewSessionCardProps {
  onClick: () => void;
  isLoading: boolean;
}

export const NewSessionCard: React.FC<NewSessionCardProps> = ({ onClick, isLoading }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isLoading) {
        onClick();
      }
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label="Utwórz nową sesję"
      aria-busy={isLoading}
      onClick={isLoading ? undefined : onClick}
      onKeyDown={handleKeyDown}
      className="border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200 cursor-pointer flex items-center justify-center min-h-[200px] dark:border-muted-foreground/20 dark:hover:bg-accent/50"
    >
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        {isLoading ? (
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        ) : (
          <Plus className="h-12 w-12 text-green-700 hover:text-green-600 transition-colors dark:text-green-600 dark:hover:text-green-500" />
        )}
        <p className="text-lg font-medium text-muted-foreground">{isLoading ? "Tworzenie..." : "Utwórz sesję"}</p>
      </div>
    </Card>
  );
};
