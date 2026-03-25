import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Phone, Mail, Calendar, TrendingUp } from "lucide-react";
import { clientsApi } from "@/api/clients";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import type { ClientListItem } from "@/types";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ClientCard({ client, onClick }: { client: ClientListItem; onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4 flex gap-4 items-start">
        {/* Avatar */}
        <div className="shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          {client.avatar_url ? (
            <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm truncate">{client.name}</h3>
            {client.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>{client.phone}</span>
          </div>
          {client.email && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="w-3 h-3" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="shrink-0 text-right space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
            <TrendingUp className="w-3 h-3" />
            <span>{client.total_visits} visit{client.total_visits !== 1 ? "s" : ""}</span>
          </div>
          {client.last_visit_at && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(client.last_visit_at)}</span>
            </div>
          )}
          {client.total_spent > 0 && (
            <div className="text-xs font-medium">${client.total_spent.toFixed(2)}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // If opened with ?phone=xxx (from calendar), look up and redirect to detail
  useEffect(() => {
    const phone = searchParams.get("phone");
    if (!phone) return;
    clientsApi.lookup(phone)
      .then((client) => navigate(`/clients/${client.id}`, { replace: true }))
      .catch(() => {
        // Profile lookup failed; show list with phone pre-filled in search
        setSearch(phone);
        setDebouncedSearch(phone);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__clientSearchTimer);
    (window as any).__clientSearchTimer = setTimeout(() => setDebouncedSearch(val), 300);
  };

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", debouncedSearch],
    queryFn: () => clientsApi.list({ search: debouncedSearch || undefined }),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Clients</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Manage client profiles and view their history
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by name or phone…"
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <Spinner className="mx-auto mt-12" />
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {debouncedSearch ? "No clients found matching your search." : "No clients yet. They'll appear here after their first booking."}
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => navigate(`/clients/${client.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
