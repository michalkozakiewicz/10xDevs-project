import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-destructive/10 p-3 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Wystąpił błąd</h3>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" className="w-full">
                Spróbuj ponownie
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
