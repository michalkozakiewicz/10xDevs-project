import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const resetPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    setSuccessMessage(null);

    try {
      // TODO: Implementacja wywołania API /api/auth/reset-password
      console.log("Reset hasła dla:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay

      setSuccessMessage(
        "Jeśli podany adres email istnieje w naszej bazie, otrzymasz wiadomość z instrukcjami resetowania hasła."
      );
      form.reset();
    } catch (error) {
      setApiError("Wystąpił błąd podczas wysyłania żądania. Spróbuj ponownie.");
      console.error("Reset password error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resetowanie hasła</CardTitle>
        <CardDescription>Wprowadź swój adres email, aby zresetować hasło</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {successMessage && (
              <div className="rounded-md bg-primary/10 p-3 text-sm text-primary">{successMessage}</div>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="twoj@email.pl"
                      autoComplete="email"
                      disabled={!!successMessage}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {apiError && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{apiError}</div>}

            <Button type="submit" className="w-full" disabled={isSubmitting || !!successMessage}>
              {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-sm text-muted-foreground text-center">
          Pamiętasz hasło?{" "}
          <a href="/auth/login" className="text-primary hover:underline font-medium">
            Zaloguj się
          </a>
        </div>
      </CardFooter>
    </Card>
  );
};
