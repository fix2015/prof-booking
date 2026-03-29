import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, MapPin, Phone, Mail, AlignLeft, Plus } from "lucide-react";
import { providersApi } from "@/api/salons";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { AddressAutocomplete } from "@/components/ui/AddressAutocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/useToast";

export function SalonProfileEditPage() {
  const qc = useQueryClient();

  const { data: provider, isLoading } = useQuery({
    queryKey: ["providers", "my"],
    queryFn: () => providersApi.getMy(),
    retry: false,
  });

  const providerId = provider?.id;

  const updateProvider = useMutation({
    mutationFn: (data: Parameters<typeof providersApi.update>[1]) =>
      providersApi.update(providerId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["providers", "my"] }),
  });

  const createProvider = useMutation({
    mutationFn: (data: Parameters<typeof providersApi.create>[0]) =>
      providersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers", "my"] });
      toast({ title: "Provider created", variant: "success" });
    },
  });

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const [createForm, setCreateForm] = useState({ name: "", address: "" });

  useEffect(() => {
    if (provider) {
      setForm({
        name: provider.name ?? "",
        address: provider.address ?? "",
        phone: provider.phone ?? "",
        email: provider.email ?? "",
        description: provider.description ?? "",
        latitude: provider.latitude ?? undefined,
        longitude: provider.longitude ?? undefined,
      });
    }
  }, [provider]);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) return;
    try {
      await updateProvider.mutateAsync({
        name: form.name || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        description: form.description || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
      });
      toast({ title: "Provider updated", variant: "success" });
    } catch {
      toast({ title: "Failed to update provider", variant: "destructive" });
    }
  };

  if (isLoading) return <Spinner className="mx-auto mt-20" />;

  if (!provider) {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-4">
        <h1 className="text-xl font-bold text-center">Create Your Provider</h1>
        <p className="text-sm text-muted-foreground text-center">
          You don't have a provider yet. Create one to get started.
        </p>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Provider Name *</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Luxe Nail Studio"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-address">Address</Label>
              <Input
                id="create-address"
                value={createForm.address}
                onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="e.g. 123 High Street, London"
              />
            </div>
            <Button
              className="w-full bg-ds-interactive hover:bg-ds-interactive-hover"
              disabled={!createForm.name || createProvider.isPending}
              onClick={() => createProvider.mutate({ name: createForm.name, address: createForm.address })}
            >
              <Plus className="h-4 w-4 mr-2" />
              {createProvider.isPending ? "Creating…" : "Create Provider"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Provider Settings</h1>

      {/* Logo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Provider Logo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            currentUrl={provider.logo_url ?? undefined}
            onUpload={(url) =>
              updateProvider.mutate(
                { logo_url: url || undefined },
                { onSuccess: () => toast({ title: "Logo updated", variant: "success" }) }
              )
            }
            shape="square"
            size={80}
            label="Logo"
            maxSize={256}
          />
        </CardContent>
      </Card>

      {/* Provider info form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Provider Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Provider Name
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="Provider name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Address
              </Label>
              <AddressAutocomplete
                id="address"
                value={form.address}
                onChange={(val) => setForm((f) => ({ ...f, address: val }))}
                onSelect={({ address, lat, lng }) =>
                  setForm((f) => ({ ...f, address, latitude: lat, longitude: lng }))
                }
                placeholder="Start typing address or postcode…"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="provider@example.com"
                />
              </div>
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
                placeholder="Describe your provider, services, and specialties"
              />
            </div>

            <Button
              type="submit"
              className="w-full md:w-auto bg-ds-interactive hover:bg-ds-interactive-hover"
              disabled={updateProvider.isPending || !providerId}
            >
              {updateProvider.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
