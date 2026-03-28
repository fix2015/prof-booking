import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate } from "react-router-dom";
import { AxiosError } from "axios";
import { useRegisterOwner } from "@/hooks/useAuth";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/i18n";

const schema = z.object({
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(8, "Password must be at least 8 characters"),
  provider_name: z.string().min(2, "Business name is required"),
  provider_address: z.string().min(5, "Address is required"),
  worker_payment_amount: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { isAuthenticated } = useAuthContext();
  const register_ = useRegisterOwner();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { worker_payment_amount: 0 },
  });

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-2 text-4xl">✨</div>
          <CardTitle className="text-2xl">{t("register.title")}</CardTitle>
          <CardDescription>Create your provider owner account</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit((data) => register_.mutate(data))}>
          <CardContent className="space-y-4">
            {register_.isError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {(register_.error as AxiosError<{ detail: string }>)?.response?.data?.detail ?? "Registration failed. Please try again."}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="email">{t("register.email")} *</Label>
                <Input id="email" type="email" {...register("email")} placeholder="owner@business.com" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>{t("register.phone")} *</Label>
                <Input type="tel" {...register("phone")} placeholder="+1 (555) 000-0000" />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label>{t("register.password")} *</Label>
              <Input type="password" {...register("password")} placeholder="At least 8 characters" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="provider_name">{t("register.business_name")} *</Label>
              <Input id="provider_name" {...register("provider_name")} placeholder="My Business" />
              {errors.provider_name && <p className="text-xs text-destructive">{errors.provider_name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Business Address *</Label>
              <Input {...register("provider_address")} placeholder="123 Main Street, City, State" />
              {errors.provider_address && <p className="text-xs text-destructive">{errors.provider_address.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Default Worker Payment ($)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("worker_payment_amount")}
                placeholder="0.00"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={register_.isPending}>
              {register_.isPending ? <Spinner size="sm" className="mr-2" /> : null}
              {t("register.submit")}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-gray-700 hover:underline font-medium">
                {t("register.sign_in")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
