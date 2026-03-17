import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate } from "react-router-dom";
import { useLogin } from "@/hooks/useAuth";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { CalendarCheck, Building2, Scissors } from "lucide-react";
import { t } from "@/i18n";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { isAuthenticated } = useAuthContext();
  const login = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Sign-in card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mb-2 text-4xl">✨</div>
            <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
            <CardDescription>{t("login.sign_in")}</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit((data) => login.mutate(data))}>
            <CardContent className="space-y-4">
              {login.isError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {t("login.invalid_credentials")}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="email">{t("login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">{t("login.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? <Spinner size="sm" className="mr-2" /> : null}
                {t("login.sign_in")}
              </Button>
              <Link to="/" className="w-full">
                <Button variant="outline" className="w-full gap-2">
                  <CalendarCheck className="h-4 w-4" />
                  {t("login.book_appointment")}
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Card>

        {/* Register section */}
        <div className="text-center text-xs text-muted-foreground font-medium uppercase tracking-wide">
          New here? Create an account
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/register">
            <Card className="cursor-pointer hover:shadow-md hover:border-gray-400 transition-all h-full">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-5 px-3 text-center">
                <div className="rounded-full bg-gray-100 p-3">
                  <Building2 className="h-6 w-6 text-gray-700" />
                </div>
                <p className="font-semibold text-sm text-gray-800">Register Business</p>
                <p className="text-xs text-muted-foreground">Salon, spa or studio owner</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/register/professional">
            <Card className="cursor-pointer hover:shadow-md hover:border-gray-400 transition-all h-full">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-5 px-3 text-center">
                <div className="rounded-full bg-pink-50 p-3">
                  <Scissors className="h-6 w-6 text-pink-600" />
                </div>
                <p className="font-semibold text-sm text-gray-800">Join as Professional</p>
                <p className="text-xs text-muted-foreground">Nail artist, stylist or specialist</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
