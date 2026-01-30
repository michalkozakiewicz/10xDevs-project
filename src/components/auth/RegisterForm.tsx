import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy format adresu email"),
    password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła nie są zgodne",
    path: ["passwordConfirm"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      // TODO: Implementacja wywołania API /api/auth/register
      console.log("Rejestracja użytkownika:", data);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay

      // Po sukcesie przekierowanie do logowania z komunikatem
      // window.location.href = "/auth/login?registered=true";
    } catch (error) {
      setApiError("Wystąpił błąd podczas rejestracji. Spróbuj ponownie.");
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utwórz konto</CardTitle>
        <CardDescription>Wprowadź swoje dane, aby utworzyć nowe konto</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potwierdź hasło</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {apiError && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{apiError}</div>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Rejestrowanie..." : "Utwórz konto"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-sm text-muted-foreground text-center">
          Masz już konto?{" "}
          <a href="/auth/login" className="text-primary hover:underline font-medium">
            Zaloguj się
          </a>
        </div>
      </CardFooter>
    </Card>
  );
};
