import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CardDTO, CardBatchUpdateItem } from "@/types";
import type { TabValue } from "@/lib/types/session-view.types";
import { EstimationBoard } from "./EstimationBoard";
import { SummaryTable } from "./SummaryTable";

interface SessionTabsProps {
  value: TabValue;
  onValueChange: (value: TabValue) => void;
  cards: CardDTO[];
  sessionId: string;
  onCardClick: (card: CardDTO) => void;
  onCardsUpdate: (updates: CardBatchUpdateItem[]) => void;
}

/**
 * Tabs component for switching between Estimation and Summary views
 * Uses Shadcn/ui Tabs component
 */
export function SessionTabs({ value, onValueChange, cards, sessionId, onCardClick, onCardsUpdate }: SessionTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <div className="border-b bg-background">
        <div className="container mx-auto px-6">
          <TabsList className="h-auto border-b-0 bg-transparent p-0">
            <TabsTrigger
              value="estimation"
              className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Estymacja
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Podsumowanie
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <TabsContent value="estimation" className="mt-0">
          <EstimationBoard
            cards={cards}
            sessionId={sessionId}
            onCardsUpdate={onCardsUpdate}
            onCardClick={onCardClick}
          />
        </TabsContent>

        <TabsContent value="summary" className="mt-0">
          <SummaryTable cards={cards} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
