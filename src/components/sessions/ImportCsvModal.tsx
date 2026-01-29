import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { CardImportCommand, CardImportResultDTO } from "@/types";
import type { CsvRow } from "@/lib/types/session-view.types";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CardImportCommand) => Promise<CardImportResultDTO>;
  sessionId: string;
  currentCardsCount: number;
}

/**
 * Modal for importing tasks from CSV file
 * Supports drag-and-drop, CSV parsing, validation, and results display
 */
export function ImportCsvModal({ isOpen, onClose, onSubmit, sessionId, currentCardsCount }: ImportCsvModalProps) {
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvContent, setCsvContent] = useState<string>("");
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<CardImportResultDTO | null>(null);

  // Check if limit would be exceeded
  const wouldExceedLimit = currentCardsCount + csvData.length > 50;

  /**
   * Parse CSV file
   */
  const parseCsvFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const rows: CsvRow[] = [];

        // Validate CSV structure
        if (!results.data || results.data.length === 0) {
          setParseErrors(["Plik CSV jest pusty"]);
          return;
        }

        // Check for required columns
        const firstRow = results.data[0] as any;
        if (!firstRow.id && !firstRow.external_id) {
          errors.push("Brak wymaganej kolumny 'id' lub 'external_id'");
        }
        if (!firstRow.title) {
          errors.push("Brak wymaganej kolumny 'title'");
        }

        if (errors.length > 0) {
          setParseErrors(errors);
          return;
        }

        // Parse rows
        results.data.forEach((row: any, index) => {
          const externalId = row.id || row.external_id;
          const title = row.title;

          if (!externalId || !title) {
            errors.push(`Wiersz ${index + 1}: Brak wymaganych pól (id, title)`);
            return;
          }

          rows.push({
            id: String(externalId).trim(),
            title: String(title).trim(),
            description: row.description ? String(row.description).trim() : undefined,
          });
        });

        setCsvData(rows);
        setParseErrors(errors);

        // Store raw CSV content for API
        Papa.unparse(
          rows.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description || "",
          }))
        );

        // Read file as text for API
        const reader = new FileReader();
        reader.onload = (e) => {
          setCsvContent(e.target?.result as string);
        };
        reader.readAsText(file);
      },
      error: (error) => {
        setParseErrors([`Błąd parsowania CSV: ${error.message}`]);
      },
    });
  }, []);

  /**
   * Handle file drop
   */
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        return;
      }

      const file = acceptedFiles[0];

      // Validate file type
      if (!file.name.endsWith(".csv")) {
        toast.error("Nieprawidłowy format pliku. Wybierz plik CSV.");
        return;
      }

      // Parse file
      parseCsvFile(file);
    },
    [parseCsvFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    maxFiles: 1,
  });

  /**
   * Handle import submission
   */
  const handleImport = async () => {
    if (!csvContent) {
      toast.error("Brak danych do importu");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit({ csv_content: csvContent });
      setImportResult(result);

      if (result.data.failed === 0) {
        toast.success(`Zaimportowano ${result.data.imported} zadań`);
      } else {
        toast.warning(`Zaimportowano ${result.data.imported} zadań, niepowodzeń: ${result.data.failed}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes("limit") || errorMessage.includes("422")) {
          toast.error(`Import przekroczyłby limit 50 zadań. Obecna liczba: ${currentCardsCount}`);
        } else if (errorMessage.includes("invalid") || errorMessage.includes("400")) {
          toast.error("Nieprawidłowy format CSV. Sprawdź czy plik zawiera kolumny: id, title");
        } else {
          toast.error(error.message || "Wystąpił błąd podczas importu");
        }
      } else {
        toast.error("Wystąpił nieoczekiwany błąd");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    setCsvData([]);
    setCsvContent("");
    setParseErrors([]);
    setImportResult(null);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Importuj zadania z CSV</DialogTitle>
          <DialogDescription>
            Prześlij plik CSV z kolumnami: <code className="rounded bg-muted px-1">id</code>,{" "}
            <code className="rounded bg-muted px-1">title</code>,{" "}
            <code className="rounded bg-muted px-1">description</code> (opcjonalnie)
          </DialogDescription>
        </DialogHeader>

        {/* Import results */}
        {importResult && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Import zakończony</p>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Zaimportowano: {importResult.data.imported}
                    </span>
                    {importResult.data.failed > 0 && (
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-600" />
                        Niepowodzeń: {importResult.data.failed}
                      </span>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Import errors */}
            {importResult.data.errors.length > 0 && (
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-semibold">Błędy importu:</p>
                <div className="space-y-1">
                  {importResult.data.errors.map((err, idx) => (
                    <div key={idx} className="flex gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">Wiersz {err.row}:</span>
                      <span>{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>Zamknij</Button>
            </DialogFooter>
          </div>
        )}

        {/* Upload area (show only if no results yet) */}
        {!importResult && (
          <>
            {/* Drag-drop zone */}
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                {csvData.length === 0 ? (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {isDragActive ? "Upuść plik tutaj..." : "Przeciągnij plik CSV lub kliknij aby wybrać"}
                    </p>
                    <p className="text-xs text-muted-foreground">Maksymalnie 50 zadań w sesji</p>
                  </>
                ) : (
                  <>
                    <FileText className="h-8 w-8 text-green-600" />
                    <p className="text-sm font-medium">
                      Wczytano {csvData.length} {csvData.length === 1 ? "zadanie" : "zadań"}
                    </p>
                    <p className="text-xs text-muted-foreground">Kliknij aby wybrać inny plik</p>
                  </>
                )}
              </div>
            </div>

            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="mb-2 font-semibold">Błędy parsowania CSV:</p>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {parseErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Limit warning */}
            {wouldExceedLimit && csvData.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Import przekroczyłby limit 50 zadań. Obecna liczba: {currentCardsCount}, próba importu:{" "}
                  {csvData.length}
                </AlertDescription>
              </Alert>
            )}

            {/* Preview table */}
            {csvData.length > 0 && parseErrors.length === 0 && (
              <div className="rounded-lg border">
                <div className="border-b bg-muted/50 px-4 py-2">
                  <p className="text-sm font-semibold">Podgląd ({csvData.length} zadań)</p>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">ID</TableHead>
                        <TableHead>Tytuł</TableHead>
                        <TableHead className="w-[200px]">Opis</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 10).map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">{row.id}</TableCell>
                          <TableCell className="text-sm">{row.title}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {row.description || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {csvData.length > 10 && (
                    <div className="border-t bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground">
                      ... i {csvData.length - 10} więcej
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Anuluj
              </Button>
              <Button
                onClick={handleImport}
                disabled={csvData.length === 0 || parseErrors.length > 0 || wouldExceedLimit || isSubmitting}
              >
                {isSubmitting ? "Importowanie..." : `Importuj ${csvData.length} zadań`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
