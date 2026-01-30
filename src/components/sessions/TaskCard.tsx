import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CardDTO } from "@/types";
import { GripVertical } from "lucide-react";

interface TaskCardProps {
  card: CardDTO;
  onClick: (card: CardDTO) => void;
  isDragging?: boolean;
}

/**
 * Draggable task card component
 * Displays external_id, title (truncated with tooltip)
 * Click opens TaskDetailModal, drag moves card between buckets
 */
export function TaskCard({ card, onClick, isDragging = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingFromKit,
  } = useDraggable({
    id: card.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const isBeingDragged = isDragging || isDraggingFromKit;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group cursor-pointer transition-all hover:shadow-md ${
        isBeingDragged ? "opacity-50 shadow-lg" : "opacity-100"
      }`}
      onClick={() => !isBeingDragged && onClick(card)}
    >
      <div className="flex items-start gap-2 p-3">
        {/* Drag handle */}
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 active:cursor-grabbing"
          aria-label="Przeciągnij kartę"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex-1 space-y-2">
          {/* External ID */}
          <Badge variant="outline" className="text-xs font-mono">
            {card.external_id}
          </Badge>

          {/* Title with tooltip for full text */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="line-clamp-2 text-sm font-medium leading-snug">{card.title}</p>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">{card.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Description indicator */}
          {card.description && <p className="line-clamp-1 text-xs text-muted-foreground">{card.description}</p>}
        </div>
      </div>
    </Card>
  );
}
