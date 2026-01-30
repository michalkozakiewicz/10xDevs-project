import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // Sprawdź, czy użytkownik został przekierowany po rejestracji
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("registered") === "true") {
      setSuccessMessage("Konto zostało utworzone. Możesz się teraz zalogować.");
    }
  }, []);

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Niepoprawny email lub hasło");
      }

      // Po sukcesie przekierowanie do strony głównej
      // Używamy window.location.href dla pełnego przeładowania,
      // aby middleware mógł wykryć nową sesję i wstrzyknąć user do locals

      // Sprawdź czy jest parametr redirect w URL (ustawiony przez middleware)
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPath = urlParams.get("redirect");

      // Przekieruj do oryginalnej ścieżki lub domyślnie do /sessions
      window.location.href = redirectPath || "/sessions";
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Niepoprawny email lub hasło");
      console.error("Login error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logowanie</CardTitle>
        <CardDescription>Wprowadź swoje dane, aby się zalogować</CardDescription>
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
                    <Input type="email" placeholder="twoj@email.pl" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {apiError && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{apiError}</div>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logowanie..." : "Zaloguj się"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-sm text-muted-foreground text-center">
          <a href="/auth/reset-password" className="text-primary hover:underline">
            Zapomniałeś hasła?
          </a>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Nie masz konta?{" "}
          <a href="/auth/register" className="text-primary hover:underline font-medium">
            Zarejestruj się
          </a>
        </div>
      </CardFooter>
    </Card>
  );
};
