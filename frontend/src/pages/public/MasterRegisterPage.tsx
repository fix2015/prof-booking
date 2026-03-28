import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { AxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { Building2, X } from "lucide-react";
import { useRegisterProfessional } from "@/hooks/useAuth";
import { useAuthContext as useAuth } from "@/context/AuthContext";
import { providersApi } from "@/api/salons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/i18n";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(6),
  password: z.string().min(8, "Password must be at least 8 characters"),
  instagram: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function MasterRegisterPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite") || undefined;
  const register_ = useRegisterProfessional();

  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>([]);
  const [providerSearch, setProviderSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);

  const { data: providers = [] } = useQuery({
    queryKey: ["providers", "public"],
    queryFn: () => providersApi.listPublic(),
    enabled: !inviteToken,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addProvider = (id: number) => {
    if (!selectedProviderIds.includes(id)) setSelectedProviderIds((prev) => [...prev, id]);
    setProviderSearch("");
    setDropdownOpen(false);
  };

  const removeProvider = (id: number) => {
    setSelectedProviderIds((prev) => prev.filter((s) => s !== id));
  };

  const filteredProviders = providerSearch.trim()
    ? providers.filter(
        (s) =>
          !selectedProviderIds.includes(s.id) &&
          (s.name.toLowerCase().includes(providerSearch.toLowerCase()) ||
            (s.address ?? "").toLowerCase().includes(providerSearch.toLowerCase()))
      )
    : providers.filter((s) => !selectedProviderIds.includes(s.id));

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = (data: FormValues) => {
    register_.mutate({
      email: data.email,
      name: data.name,
      phone: data.phone,
      password: data.password,
      social_links: data.instagram ? { instagram: data.instagram } : undefined,
      invite_token: inviteToken,
      provider_ids: inviteToken ? undefined : selectedProviderIds,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-2 text-4xl">✨</div>
          <CardTitle className="text-2xl">{t("register.pro.title")}</CardTitle>
          <CardDescription>
            {inviteToken
              ? t("register.pro.invite_description")
              : t("register.pro.description")}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {register_.isError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {(register_.error as AxiosError<{ detail: string }>)?.response?.data?.detail ?? t("register.failed")}
              </div>
            )}

            {inviteToken && (
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                {t("register.pro.invite_notice")}
              </div>
            )}

            <div className="space-y-1">
              <Label>{t("register.pro.name")} *</Label>
              <Input {...register("name")} placeholder="Jane Smith" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>{t("register.pro.email")} *</Label>
              <Input type="email" {...register("email")} placeholder="jane@example.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>{t("register.pro.phone")} *</Label>
              <Input type="tel" {...register("phone")} placeholder="+1 (555) 000-0000" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>{t("register.pro.instagram")}</Label>
              <Input {...register("instagram")} placeholder="@yourusername" />
            </div>

            <div className="space-y-1">
              <Label>{t("register.pro.password")} *</Label>
              <Input type="password" {...register("password")} placeholder="At least 8 characters" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* Provider selection — only for self-registration (no invite) */}
            {!inviteToken && providers.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {t("register.pro.apply_providers")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("register.pro.apply_hint")}
                </p>

                {/* Selected provider tags */}
                {selectedProviderIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProviderIds.map((id) => {
                      const s = providers.find((sl) => sl.id === id);
                      return s ? (
                        <span
                          key={id}
                          className="flex items-center gap-1 bg-gray-100 text-gray-800 text-xs font-medium px-2 py-1 rounded-full"
                        >
                          {s.name}
                          <button
                            type="button"
                            onClick={() => removeProvider(id)}
                            className="hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Autocomplete input */}
                <div className="relative" ref={comboRef}>
                  <Input
                    placeholder={t("register.pro.search_provider")}
                    value={providerSearch}
                    onChange={(e) => { setProviderSearch(e.target.value); setDropdownOpen(true); }}
                    onFocus={() => setDropdownOpen(true)}
                  />
                  {dropdownOpen && filteredProviders.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg max-h-48 overflow-y-auto">
                      {filteredProviders.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex flex-col"
                          onMouseDown={(e) => { e.preventDefault(); addProvider(s.id); }}
                        >
                          <span className="font-medium">{s.name}</span>
                          {s.address && (
                            <span className="text-xs text-muted-foreground truncate">{s.address}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {dropdownOpen && filteredProviders.length === 0 && providerSearch.trim() && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg px-3 py-2 text-sm text-muted-foreground">
                      {t("register.pro.no_providers")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={register_.isPending}>
              {register_.isPending ? <Spinner size="sm" className="mr-2" /> : null}
              {t("register.pro.submit")}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t("register.already_have_account")}{" "}
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
