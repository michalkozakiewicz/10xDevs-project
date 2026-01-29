import { Toaster } from "@/components/ui/sonner";

/**
 * Toast notifications provider
 * Renders Sonner Toaster component for displaying toast messages
 */
export function ToasterProvider() {
  return <Toaster position="bottom-right" richColors closeButton />;
}
