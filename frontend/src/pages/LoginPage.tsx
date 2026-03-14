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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-2 text-4xl">💅</div>
          <CardTitle className="text-2xl">NailSalon Platform</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit((data) => login.mutate(data))}>
          <CardContent className="space-y-4">
            {login.isError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                Invalid email or password
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
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
              Sign In
            </Button>
            <p className="text-sm text-muted-foreground">
              New salon owner?{" "}
              <Link to="/register" className="text-pink-600 hover:underline font-medium">
                Register your salon
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              Client booking?{" "}
              <Link to="/salons" className="text-pink-600 hover:underline font-medium">
                Book appointment
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
