import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Users, Star, Settings, Trash2, Eye, EyeOff, Activity } from "lucide-react";
import { adminApi } from "@/api/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { toast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";

type Tab = "providers" | "professionals" | "reviews" | "services";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "providers", label: "Providers", icon: Building2 },
  { key: "professionals", label: "Professionals", icon: Users },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "services", label: "Services", icon: Settings },
];

export function AdminPanelPage() {
  const [tab, setTab] = useState<Tab>("providers");
  const qc = useQueryClient();

  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["admin", "providers"],
    queryFn: () => adminApi.listProviders(),
  });

  const { data: professionals = [], isLoading: professionalsLoading } = useQuery({
    queryKey: ["admin", "professionals"],
    queryFn: () => adminApi.listUsers("professional"),
    enabled: tab === "professionals",
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => adminApi.listReviews(),
    enabled: tab === "reviews",
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: () => adminApi.listServices(),
    enabled: tab === "services",
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.listUsers(),
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const toggleProvider = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      adminApi.toggleProvider(id, is_active),
    onSuccess: (_, { is_active }) => {
      qc.invalidateQueries({ queryKey: ["admin", "providers"] });
      toast({ title: is_active ? "Provider activated" : "Provider frozen", variant: "success" });
    },
    onError: () => toast({ title: "Action failed", variant: "destructive" }),
  });

  const deleteProvider = useMutation({
    mutationFn: (id: number) => adminApi.deleteProvider(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "providers"] });
      toast({ title: "Provider deleted", variant: "success" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const toggleUser = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      adminApi.toggleUser(id, is_active),
    onSuccess: (_, { is_active }) => {
      qc.invalidateQueries({ queryKey: ["admin", "professionals"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: is_active ? "User activated" : "User frozen", variant: "success" });
    },
    onError: () => toast({ title: "Action failed", variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "professionals"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "User deleted", variant: "success" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const toggleReview = useMutation({
    mutationFn: ({ id, is_published }: { id: number; is_published: boolean }) =>
      adminApi.toggleReview(id, is_published),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast({ title: "Review updated", variant: "success" });
    },
  });

  const deleteReview = useMutation({
    mutationFn: (id: number) => adminApi.deleteReview(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast({ title: "Review deleted", variant: "success" });
    },
  });

  const toggleService = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      adminApi.toggleService(id, is_active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "services"] });
      toast({ title: "Service updated", variant: "success" });
    },
  });

  const deleteService = useMutation({
    mutationFn: (id: number) => adminApi.deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "services"] });
      toast({ title: "Service deleted", variant: "success" });
    },
  });

  const confirmDelete = (label: string, fn: () => void) => {
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) fn();
  };

  const ownerCount = allUsers.filter((u) => u.role === "provider_owner").length;
  const professionalCount = allUsers.filter((u) => u.role === "professional").length;

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Platform Administration</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatsCard title="Total Providers" value={providers.length} icon={Building2} color="slate" />
        <StatsCard title="Total Users" value={allUsers.length} icon={Users} color="blue" />
        <StatsCard title="Provider Owners" value={ownerCount} icon={Users} color="purple" />
        <StatsCard title="Professionals" value={professionalCount} icon={Activity} color="green" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === key
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Providers tab ─────────────────────────────────────────────────────── */}
      {tab === "providers" && (
        <Card>
          <CardHeader>
            <CardTitle>All Providers ({providers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {providersLoading ? <Spinner className="mx-auto" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">ID</th>
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Address</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {providers.map((p) => (
                      <tr key={p.id} className={cn(!p.is_active && "opacity-50")}>
                        <td className="py-2 text-muted-foreground">#{p.id}</td>
                        <td className="py-2 font-medium">{p.name}</td>
                        <td className="py-2 text-muted-foreground text-xs">{p.address || "—"}</td>
                        <td className="py-2">
                          <Badge variant={p.is_active ? "success" : "secondary"}>
                            {p.is_active ? "Active" : "Frozen"}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              disabled={toggleProvider.isPending}
                              onClick={() => toggleProvider.mutate({ id: p.id, is_active: !p.is_active })}
                            >
                              {p.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              {p.is_active ? "Freeze" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              disabled={deleteProvider.isPending}
                              onClick={() => confirmDelete(p.name, () => deleteProvider.mutate(p.id))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {providers.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No providers</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Professionals tab ─────────────────────────────────────────────────── */}
      {tab === "professionals" && (
        <Card>
          <CardHeader>
            <CardTitle>All Professionals ({professionals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {professionalsLoading ? <Spinner className="mx-auto" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">ID</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {professionals.map((u) => (
                      <tr key={u.id} className={cn(!u.is_active && "opacity-50")}>
                        <td className="py-2 text-muted-foreground">#{u.id}</td>
                        <td className="py-2">{u.email}</td>
                        <td className="py-2">
                          <Badge variant={u.is_active ? "success" : "secondary"}>
                            {u.is_active ? "Active" : "Frozen"}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              disabled={toggleUser.isPending}
                              onClick={() => toggleUser.mutate({ id: u.id, is_active: !u.is_active })}
                            >
                              {u.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              {u.is_active ? "Freeze" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              disabled={deleteUser.isPending}
                              onClick={() => confirmDelete(u.email, () => deleteUser.mutate(u.id))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {professionals.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No professionals</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Reviews tab ───────────────────────────────────────────────────────── */}
      {tab === "reviews" && (
        <Card>
          <CardHeader>
            <CardTitle>All Reviews ({reviews.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {reviewsLoading ? <Spinner className="mx-auto" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">ID</th>
                      <th className="pb-2 font-medium">Client</th>
                      <th className="pb-2 font-medium">Rating</th>
                      <th className="pb-2 font-medium">Comment</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reviews.map((r) => (
                      <tr key={r.id} className={cn(!r.is_published && "opacity-50")}>
                        <td className="py-2 text-muted-foreground">#{r.id}</td>
                        <td className="py-2 font-medium">{r.client_name}</td>
                        <td className="py-2">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                        <td className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                          {r.comment || "—"}
                        </td>
                        <td className="py-2">
                          <Badge variant={r.is_published ? "success" : "secondary"}>
                            {r.is_published ? "Published" : "Hidden"}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              disabled={toggleReview.isPending}
                              onClick={() => toggleReview.mutate({ id: r.id, is_published: !r.is_published })}
                            >
                              {r.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              {r.is_published ? "Hide" : "Show"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              disabled={deleteReview.isPending}
                              onClick={() => confirmDelete(`review #${r.id}`, () => deleteReview.mutate(r.id))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {reviews.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No reviews</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Services tab ──────────────────────────────────────────────────────── */}
      {tab === "services" && (
        <Card>
          <CardHeader>
            <CardTitle>All Services ({services.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {servicesLoading ? <Spinner className="mx-auto" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">ID</th>
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Provider</th>
                      <th className="pb-2 font-medium">Price</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {services.map((s) => (
                      <tr key={s.id} className={cn(!s.is_active && "opacity-50")}>
                        <td className="py-2 text-muted-foreground">#{s.id}</td>
                        <td className="py-2 font-medium">{s.name}</td>
                        <td className="py-2 text-muted-foreground">Provider #{s.provider_id}</td>
                        <td className="py-2">${s.price}</td>
                        <td className="py-2">
                          <Badge variant={s.is_active ? "success" : "secondary"}>
                            {s.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              disabled={toggleService.isPending}
                              onClick={() => toggleService.mutate({ id: s.id, is_active: !s.is_active })}
                            >
                              {s.is_active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              {s.is_active ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs"
                              disabled={deleteService.isPending}
                              onClick={() => confirmDelete(s.name, () => deleteService.mutate(s.id))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {services.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No services</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
