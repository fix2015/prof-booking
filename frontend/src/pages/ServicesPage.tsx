import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "@/api/services";
import { providersApi } from "@/api/salons";
import { professionalsApi } from "@/api/masters";
import { useAuthContext } from "@/context/AuthContext";
import { Service } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/utils/formatters";
import { toast } from "@/hooks/useToast";
import { t } from "@/i18n";

export function ServicesPage() {
  const qc = useQueryClient();
  const { role } = useAuthContext();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", description: "", duration_minutes: 60, price: 0 });

  // Owner: use their own provider. Professional: use their linked provider.
  const { data: myProvider } = useQuery({
    queryKey: ["providers", "my"],
    queryFn: () => providersApi.getMy(),
    enabled: role === "provider_owner",
  });
  const { data: myProfessional } = useQuery({
    queryKey: ["professionals", "me"],
    queryFn: () => professionalsApi.getMe(),
    enabled: role === "professional",
  });

  const providerId =
    role === "provider_owner"
      ? myProvider?.id
      : myProfessional?.professional_providers?.[0]?.provider_id;

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", providerId],
    queryFn: () => servicesApi.listByProvider(providerId!),
    enabled: !!providerId,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      if (!providerId) throw new Error("Provider not loaded yet");
      return servicesApi.create(providerId, form);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); setShowForm(false); toast({ title: "Service created", variant: "success" }); },
    onError: () => toast({ title: "Failed to create service", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) => servicesApi.update(id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); setEditing(null); toast({ title: "Service updated", variant: "success" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => servicesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); toast({ title: "Service removed" }); },
  });

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({ name: service.name, description: service.description || "", duration_minutes: service.duration_minutes, price: service.price });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-bold">{t("services.title")}</h1>
        <Button disabled={!providerId} onClick={() => { setShowForm(true); setForm({ name: "", description: "", duration_minutes: 60, price: 0 }); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t("services.add")}
        </Button>
      </div>

      {/* Form */}
      {(showForm || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit Service" : "New Service"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Service name" />
              </div>
              <div className="space-y-1">
                <Label>Price ($) *</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Duration (minutes) *</Label>
                <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              <Button
                onClick={() => editing ? updateMutation.mutate(editing.id) : createMutation.mutate()}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? <Spinner size="sm" className="mr-2" /> : null}
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services list */}
      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{service.name}</p>
                    {service.description && <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>}
                    <p className="mt-2 text-lg font-bold text-gray-700">{formatCurrency(service.price)}</p>
                    <p className="text-xs text-muted-foreground">{service.duration_minutes} min</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(service)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(service.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {services.length === 0 && (
            <p className="col-span-full text-center py-8 text-muted-foreground">
              {t("services.no_services")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
