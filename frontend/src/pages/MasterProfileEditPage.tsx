import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User, Globe, Clock, FileText, AlignLeft, Phone, Building2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMyProfessionalProfile, useUpdateProfessionalProfile, useAttachToProvider } from "@/hooks/useMaster";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { NationalitySelect } from "@/components/ui/NationalitySelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";
import { statusColorMap, statusLabel } from "@/utils/formatters";
import { providersApi } from "@/api/salons";
import { Provider } from "@/types";

export function MasterProfileEditPage() {
  const { data: professional, isLoading } = useMyProfessionalProfile();
  const updateProfessional = useUpdateProfessionalProfile();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    bio: "",
    description: "",
    nationality: "",
    experience_years: "",
  });

  useEffect(() => {
    if (professional) {
      setForm({
        name: professional.name ?? "",
        phone: professional.phone ?? "",
        bio: professional.bio ?? "",
        description: professional.description ?? "",
        nationality: professional.nationality ?? "",
        experience_years: professional.experience_years != null ? String(professional.experience_years) : "",
      });
    }
  }, [professional]);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfessional.mutateAsync({
        name: form.name || undefined,
        phone: form.phone || undefined,
        bio: form.bio || undefined,
        description: form.description || undefined,
        nationality: form.nationality || undefined,
        experience_years: form.experience_years ? Number(form.experience_years) : undefined,
      });
      toast({ title: "Profile updated", variant: "success" });
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  void qc;

  const attachToProvider = useAttachToProvider();
  const [providerSearch, setProviderSearch] = useState("");
  const [showProviderPicker, setShowProviderPicker] = useState(false);

  const { data: allProviders = [] } = useQuery<Provider[]>({
    queryKey: ["providers", "public"],
    queryFn: () => providersApi.listPublic(),
    enabled: showProviderPicker,
  });

  const attachedProviderIds = new Set(
    professional?.professional_providers?.map((pp) => pp.provider_id) ?? []
  );

  const filteredProviders = allProviders.filter(
    (p) => !attachedProviderIds.has(p.id) &&
      p.name.toLowerCase().includes(providerSearch.toLowerCase())
  );

  const handleAttach = async (providerId: number) => {
    try {
      await attachToProvider.mutateAsync(providerId);
      toast({ title: "Request sent — awaiting owner approval", variant: "success" });
      setShowProviderPicker(false);
    } catch {
      toast({ title: "Failed to send request", variant: "destructive" });
    }
  };

  if (isLoading) return <Spinner className="mx-auto mt-20" />;

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">My Profile</h1>

      {/* Avatar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Avatar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            currentUrl={professional?.avatar_url ?? undefined}
            onUpload={(url) =>
              updateProfessional.mutate(
                { avatar_url: url || undefined },
                { onSuccess: () => toast({ title: "Avatar updated", variant: "success" }) }
              )
            }
            shape="circle"
            size={80}
            label="Avatar"
          />
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Full Name
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Nationality
                </Label>
                <NationalitySelect
                  value={form.nationality}
                  onChange={(val) => setForm((prev) => ({ ...prev, nationality: val }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="experience_years" className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Years of Experience
                </Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={form.experience_years}
                  onChange={handleChange("experience_years")}
                  placeholder="e.g. 5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Bio
              </Label>
              <textarea
                id="bio"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                rows={2}
                value={form.bio}
                onChange={handleChange("bio")}
                placeholder="Short bio about yourself"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="flex items-center gap-1.5">
                <AlignLeft className="h-3.5 w-3.5" /> Description
              </Label>
              <textarea
                id="description"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                rows={4}
                value={form.description}
                onChange={handleChange("description")}
                placeholder="Detailed description of your skills and services"
              />
            </div>

            <Button
              type="submit"
              className="w-full md:w-auto bg-pink-600 hover:bg-pink-700"
              disabled={updateProfessional.isPending}
            >
              {updateProfessional.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Providers */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> My Providers
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowProviderPicker((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Join Provider
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Provider picker */}
          {showProviderPicker && (
            <div className="border rounded-md p-3 space-y-2 bg-muted/30">
              <Input
                placeholder="Search providers…"
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredProviders.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No providers found</p>
                )}
                {filteredProviders.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted">
                    <span className="text-sm">{p.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      disabled={attachToProvider.isPending}
                      onClick={() => handleAttach(p.id)}
                    >
                      Request
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attached providers list */}
          {(professional?.professional_providers ?? []).length === 0 && !showProviderPicker && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Not attached to any provider yet.
            </p>
          )}
          {(professional?.professional_providers ?? []).map((pp) => (
            <div key={pp.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">
                  {pp.provider?.name ?? `Provider #${pp.provider_id}`}
                </p>
                {pp.payment_amount && (
                  <p className="text-xs text-muted-foreground">${pp.payment_amount}/session</p>
                )}
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  statusColorMap[pp.status]
                )}
              >
                {statusLabel[pp.status]}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
