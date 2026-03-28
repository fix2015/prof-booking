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

type FormState = {
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  provider_ids: number[];
};

const emptyForm: FormState = { name: "", description: "", duration_minutes: 60, price: 0, provider_ids: [] };

export function ServicesPage() {
  const qc = useQueryClient();
  const { role } = useAuthContext();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

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

  const linkedProviders = myProfessional?.professional_providers ?? [];

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services", "my"],
    queryFn: () => servicesApi.listMy(),
    enabled: role === "professional" || role === "provider_owner",
  });

  const openAdd = () => {
    const defaultIds =
      role === "provider_owner" && myProvider
        ? [myProvider.id]
        : linkedProviders.length === 1
          ? [linkedProviders[0].provider_id]
          : [];
    setForm({ ...emptyForm, provider_ids: defaultIds });
    setShowForm(true);
    setEditing(null);
  };

  const toggleProvider = (pid: number) => {
    setForm((f) => ({
      ...f,
      provider_ids: f.provider_ids.includes(pid)
        ? f.provider_ids.filter((id) => id !== pid)
        : [...f.provider_ids, pid],
    }));
  };

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form };
      if (role === "provider_owner" && myProvider && payload.provider_ids.length === 0) {
        payload.provider_ids = [myProvider.id];
      }
      return servicesApi.createForUser(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "my"] });
      setShowForm(false);
      toast({ title: "Service created", variant: "success" });
    },
    onError: () => toast({ title: "Failed to create service", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (id: number) => servicesApi.update(id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "my"] });
      setEditing(null);
      toast({ title: "Service updated", variant: "success" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => servicesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "my"] });
      toast({ title: "Service removed" });
    },
  });

  const openEdit = (service: Service) => {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description || "",
      duration_minutes: service.duration_minutes,
      price: service.price,
      provider_ids: service.provider_ids ?? [],
    });
    setShowForm(false);
  };

  // Label for provider badges on a service card
  const providerLabel = (pid: number) => {
    if (role === "provider_owner") return myProvider?.name ?? `Provider #${pid}`;
    const link = linkedProviders.find((pp) => pp.provider_id === pid);
    return (link as any)?.provider?.name ?? `Provider #${pid}`;
  };

  // Available providers for the checkbox list (professionals see their linked providers)
  const availableProviders =
    role === "provider_owner" && myProvider
      ? [{ id: myProvider.id, name: myProvider.name }]
      : linkedProviders.map((pp) => ({
          id: pp.provider_id,
          name: (pp as any)?.provider?.name ?? `Provider #${pp.provider_id}`,
        }));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl md:text-2xl font-bold">{t("services.title")}</h1>
        <Button onClick={openAdd}>
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
                <Label>Price (£) *</Label>
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

            {/* Provider multi-select — professionals only; owners see single implicit provider */}
            {role === "professional" && availableProviders.length > 0 && (
              <div className="space-y-2">
                <Label>Providers (optional — select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {availableProviders.map((p) => {
                    const checked = form.provider_ids.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProvider(p.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                          checked
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                        }`}
                      >
                        {checked && <span className="text-xs">✓</span>}
                        {p.name}
                      </button>
                    );
                  })}
                </div>
                {form.provider_ids.length === 0 && (
                  <p className="text-xs text-muted-foreground">No provider selected — this will be a personal service</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
              <Button
                onClick={() => editing ? updateMutation.mutate(editing.id) : createMutation.mutate()}
                disabled={!form.name || createMutation.isPending || updateMutation.isPending}
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
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{service.name}</p>
                    {service.description && <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>}
                    <p className="mt-2 text-lg font-bold text-gray-700">{formatCurrency(service.price)}</p>
                    <p className="text-xs text-muted-foreground">{service.duration_minutes} min</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {service.provider_ids?.length > 0
                        ? service.provider_ids.map((pid) => (
                            <span key={pid} className="inline-block text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                              {providerLabel(pid)}
                            </span>
                          ))
                        : <span className="text-xs text-purple-600">Personal service</span>
                      }
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
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
