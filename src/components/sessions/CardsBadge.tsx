import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Layers } from "lucide-react";

interface CardsBadgeProps {
  count: number;
}

export const CardsBadge: React.FC<CardsBadgeProps> = ({ count }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
            <Layers className="h-3 w-3" />
            <span className="tabular-nums">{count}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Liczba kart w sesji</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
