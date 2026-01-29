import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import type { CardDTO } from "@/types";
import type { BucketConfig } from "@/lib/types/session-view.types";
import { TaskCard } from "./TaskCard";

interface BucketProps {
  config: BucketConfig;
  cards: CardDTO[];
  onCardClick: (card: CardDTO) => void;
  isOver?: boolean;
}

/**
 * Droppable bucket for estimation cards
 * Displays bucket value, cards count, and all cards in this bucket
 * Accepts drag-and-drop of cards from other buckets
 */
export function Bucket({ config, cards, onCardClick, isOver = false }: BucketProps) {
  const { setNodeRef } = useDroppable({
    id: String(config.value),
  });

  return (
    <div className="flex min-w-[280px] flex-col" ref={setNodeRef}>
      {/* Sticky header */}
      <div
        className={`sticky top-0 z-10 mb-3 rounded-t-lg border-2 p-3 transition-all ${config.colorClass} ${
          isOver ? "border-primary ring-2 ring-primary ring-offset-2" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Value label */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{config.label}</span>
            {config.value !== null && <span className="text-sm text-muted-foreground">Story Points</span>}
          </div>

          {/* Cards count */}
          <Badge variant="secondary" className="text-xs">
            {cards.length}
          </Badge>
        </div>
      </div>

      {/* Cards container - scrollable */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pb-4">
        {cards.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 text-xs text-muted-foreground">
            Przeciągnij tutaj
          </div>
        ) : (
          cards.map((card) => <TaskCard key={card.id} card={card} onClick={onCardClick} />)
        )}
      </div>
    </div>
  );
}
