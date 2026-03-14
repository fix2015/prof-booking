import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, MapPin, Phone, Mail, AlignLeft } from "lucide-react";
import { salonsApi } from "@/api/salons";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/useToast";

export function SalonProfileEditPage() {
  const qc = useQueryClient();

  const { data: salons, isLoading } = useQuery({
    queryKey: ["salons", "all"],
    queryFn: () => salonsApi.listPublic(),
  });

  const salon = salons?.[0];
  const salonId = salon?.id;

  const updateSalon = useMutation({
    mutationFn: (data: Parameters<typeof salonsApi.update>[1]) =>
      salonsApi.update(salonId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salons"] }),
  });

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
  });

  useEffect(() => {
    if (salon) {
      setForm({
        name: salon.name ?? "",
        address: salon.address ?? "",
        phone: salon.phone ?? "",
        email: salon.email ?? "",
        description: salon.description ?? "",
      });
    }
  }, [salon]);

  const handleChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonId) return;
    try {
      await updateSalon.mutateAsync({
        name: form.name || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        description: form.description || undefined,
      });
      toast({ title: "Salon updated", variant: "success" });
    } catch {
      toast({ title: "Failed to update salon", variant: "destructive" });
    }
  };

  if (isLoading) return <Spinner className="mx-auto mt-20" />;

  if (!salon) {
    return (
      <p className="text-center py-20 text-muted-foreground">No salon found.</p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Salon Settings</h1>

      {/* Logo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Salon Logo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            currentUrl={salon.logo_url ?? undefined}
            onUpload={(url) =>
              updateSalon.mutate(
                { logo_url: url || undefined },
                { onSuccess: () => toast({ title: "Logo updated", variant: "success" }) }
              )
            }
            shape="square"
            size={80}
            label="Logo"
          />
        </CardContent>
      </Card>

      {/* Salon info form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Salon Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Salon Name
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="Salon name"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Address
              </Label>
              <Input
                id="address"
                value={form.address}
                onChange={handleChange("address")}
                placeholder="123 Main St, City"
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
                  placeholder="salon@example.com"
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
                placeholder="Describe your salon, services, and specialties"
              />
            </div>

            <Button
              type="submit"
              className="w-full md:w-auto bg-pink-600 hover:bg-pink-700"
              disabled={updateSalon.isPending || !salonId}
            >
              {updateSalon.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
