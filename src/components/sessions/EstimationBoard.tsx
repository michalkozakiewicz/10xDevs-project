import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { CardDTO, CardBatchUpdateItem, BucketValue } from "@/types";
import type { CardsByBucket } from "@/lib/types/session-view.types";
import { BUCKET_CONFIGS } from "@/lib/types/session-view.types";
import { Bucket } from "./Bucket";
import { TaskCard } from "./TaskCard";

interface EstimationBoardProps {
  cards: CardDTO[];
  sessionId: string;
  onCardsUpdate: (updates: CardBatchUpdateItem[]) => void;
  onCardClick: (card: CardDTO) => void;
}

/**
 * Main estimation board with drag-and-drop functionality
 * Uses dnd-kit library for dragging cards between buckets
 * Supports mouse, touch, and keyboard interactions
 */
export function EstimationBoard({ cards, sessionId, onCardsUpdate, onCardClick }: EstimationBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay for touch
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group cards by bucket_value
  const cardsByBucket = useMemo(() => {
    const grouped: CardsByBucket = {};

    // Initialize all buckets with empty arrays
    BUCKET_CONFIGS.forEach((config) => {
      grouped[String(config.value)] = [];
    });

    // Group cards
    cards.forEach((card) => {
      const key = String(card.bucket_value);
      if (grouped[key]) {
        grouped[key].push(card);
      }
    });

    return grouped;
  }, [cards]);

  // Find active card being dragged
  const activeCard = activeId ? cards.find((card) => card.id === activeId) : null;

  /**
   * Handle drag start - show visual feedback
   */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  /**
   * Handle drag over - track which bucket is being hovered
   */
  const handleDragOver = (event: { over: { id: string } | null }) => {
    setOverId(event.over ? (event.over.id as string) : null);
  };

  /**
   * Handle drag end - update card bucket_value
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);

    if (!over) {
      return;
    }

    const cardId = active.id as string;
    const newBucketValue = over.id as string;

    // Find the card
    const card = cards.find((c) => c.id === cardId);
    if (!card) {
      return;
    }

    // Check if bucket value actually changed
    if (String(card.bucket_value) === newBucketValue) {
      return;
    }

    // Parse bucket value
    let parsedBucketValue: BucketValue;
    if (newBucketValue === "null") {
      parsedBucketValue = null;
    } else {
      parsedBucketValue = parseInt(newBucketValue, 10) as BucketValue;
    }

    // Update via API
    onCardsUpdate([
      {
        id: cardId,
        bucket_value: parsedBucketValue,
      },
    ]);
  };

  /**
   * Handle drag cancel
   */
  const handleDragCancel = () => {
    setActiveId(null);
    setOverId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* Scrollable container for buckets */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 pb-4">
          {BUCKET_CONFIGS.map((config) => (
            <Bucket
              key={String(config.value)}
              config={config}
              cards={cardsByBucket[String(config.value)] || []}
              onCardClick={onCardClick}
              isOver={overId === String(config.value)}
            />
          ))}
        </div>
      </div>

      {/* Drag overlay - shows dragged card */}
      <DragOverlay>
        {activeCard ? (
          <div className="rotate-3 scale-105">
            <TaskCard card={activeCard} onClick={() => {}} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
