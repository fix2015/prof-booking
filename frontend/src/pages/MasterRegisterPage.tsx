import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams } from "react-router-dom";
import { useRegisterMaster } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(6),
  password: z.string().min(8, "Password must be at least 8 characters"),
  instagram: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function MasterRegisterPage() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite") || undefined;
  const register_ = useRegisterMaster();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormValues) => {
    register_.mutate({
      email: data.email,
      name: data.name,
      phone: data.phone,
      password: data.password,
      social_links: data.instagram ? { instagram: data.instagram } : undefined,
      invite_token: inviteToken,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-2 text-4xl">✨</div>
          <CardTitle className="text-2xl">Join as a Master</CardTitle>
          <CardDescription>
            {inviteToken
              ? "You've been invited to join a salon"
              : "Create your master account"}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {register_.isError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                Registration failed. Please try again.
              </div>
            )}

            {inviteToken && (
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                You'll be connected to the salon after registration.
              </div>
            )}

            <div className="space-y-1">
              <Label>Full Name *</Label>
              <Input {...register("name")} placeholder="Jane Smith" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" {...register("email")} placeholder="jane@example.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Phone *</Label>
              <Input type="tel" {...register("phone")} placeholder="+1 (555) 000-0000" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Instagram (optional)</Label>
              <Input {...register("instagram")} placeholder="@yourusername" />
            </div>

            <div className="space-y-1">
              <Label>Password *</Label>
              <Input type="password" {...register("password")} placeholder="At least 8 characters" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={register_.isPending}>
              {register_.isPending ? <Spinner size="sm" className="mr-2" /> : null}
              Create Account
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-pink-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
