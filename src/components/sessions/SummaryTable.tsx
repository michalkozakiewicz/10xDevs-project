import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { CardDTO } from "@/types";
import { BUCKET_CONFIGS } from "@/lib/types/session-view.types";

interface SummaryTableProps {
  cards: CardDTO[];
}

/**
 * Summary table displaying all cards with their estimations
 * Columns: ID, Title, Estimation (bucket_value)
 * Sorted by: bucket_value ASC (null first), then external_id ASC
 */
export function SummaryTable({ cards }: SummaryTableProps) {
  // Sort cards: bucket_value ASC (null first), external_id ASC
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => {
      // Sort by bucket_value first (null < numbers)
      if (a.bucket_value === null && b.bucket_value !== null) return -1;
      if (a.bucket_value !== null && b.bucket_value === null) return 1;
      if (a.bucket_value !== null && b.bucket_value !== null) {
        if (a.bucket_value !== b.bucket_value) {
          return a.bucket_value - b.bucket_value;
        }
      }

      // Then sort by external_id
      return a.external_id.localeCompare(b.external_id);
    });
  }, [cards]);

  // Get bucket config for styling
  const getBucketConfig = (bucketValue: CardDTO["bucket_value"]) => {
    return BUCKET_CONFIGS.find((config) => config.value === bucketValue);
  };

  // Get badge variant based on bucket value
  const getBadgeVariant = (bucketValue: CardDTO["bucket_value"]) => {
    if (bucketValue === null) return "outline";
    if (bucketValue <= 2) return "default";
    if (bucketValue <= 5) return "secondary";
    return "destructive";
  };

  // Empty state
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="mb-2 text-lg font-semibold">Brak zadań w sesji</p>
        <p className="text-sm text-muted-foreground">Dodaj zadania, aby zobaczyć podsumowanie.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">ID</TableHead>
            <TableHead>Tytuł</TableHead>
            <TableHead className="w-[150px] text-right">Wycena</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCards.map((card) => {
            const config = getBucketConfig(card.bucket_value);
            return (
              <TableRow key={card.id}>
                {/* External ID */}
                <TableCell className="font-mono text-sm">{card.external_id}</TableCell>

                {/* Title */}
                <TableCell>
                  <div>
                    <p className="font-medium">{card.title}</p>
                    {card.description && <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>}
                  </div>
                </TableCell>

                {/* Bucket Value with color */}
                <TableCell className="text-right">
                  <Badge variant={getBadgeVariant(card.bucket_value)} className="font-semibold">
                    {config?.label || "?"}
                    {card.bucket_value !== null && " SP"}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Summary statistics */}
      <div className="border-t bg-muted/50 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Łącznie zadań:</span>
          <span className="font-semibold">{cards.length}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="font-medium">Oszacowane:</span>
          <span className="font-semibold">{cards.filter((c) => c.bucket_value !== null).length}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="font-medium">Nieokreślone:</span>
          <span className="font-semibold">{cards.filter((c) => c.bucket_value === null).length}</span>
        </div>
      </div>
    </div>
  );
}
