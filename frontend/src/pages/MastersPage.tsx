import { useState } from "react";
import { UserCheck, UserX, Send, UserPlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { professionalsApi } from "@/api/masters";
import { invitesApi } from "@/api/invites";
import { providersApi } from "@/api/salons";
import { ProfessionalProvider } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { statusColorMap, statusLabel } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { toast } from "@/hooks/useToast";

export function MastersPage() {
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [addForm, setAddForm] = useState({
    email: "", name: "", phone: "", password: "",
    bio: "", payment_amount: "",
  });

  const { data: providers } = useQuery({ queryKey: ["providers", "public"], queryFn: () => providersApi.listPublic() });
  const providerId = providers?.[0]?.id;

  const { data: professionalProviders = [], isLoading } = useQuery({
    queryKey: ["professionals", "provider", providerId, statusFilter !== "all" ? statusFilter : undefined],
    queryFn: () => professionalsApi.getProviderProfessionals(providerId!, statusFilter !== "all" ? statusFilter : undefined),
    enabled: !!providerId,
  });

  const approveMutation = useMutation({
    mutationFn: ({ professionalId, status }: { professionalId: number; status: string }) =>
      professionalsApi.approveProfessional(providerId!, professionalId, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["professionals"] }); toast({ title: "Professional status updated", variant: "success" }); },
  });

  const inviteMutation = useMutation({
    mutationFn: () => invitesApi.create(providerId!, inviteEmail),
    onSuccess: () => { setInviteEmail(""); setShowInviteForm(false); toast({ title: "Invitation sent", variant: "success" }); },
    onError: () => toast({ title: "Failed to send invite", variant: "destructive" }),
  });

  const addProfessionalMutation = useMutation({
    mutationFn: () =>
      professionalsApi.createDirect(providerId!, {
        email: addForm.email,
        name: addForm.name,
        phone: addForm.phone,
        password: addForm.password,
        bio: addForm.bio || undefined,
        payment_amount: addForm.payment_amount ? Number(addForm.payment_amount) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["professionals"] });
      setAddForm({ email: "", name: "", phone: "", password: "", bio: "", payment_amount: "" });
      setShowAddForm(false);
      toast({ title: "Professional added successfully", variant: "success" });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? "Failed to add professional";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const statusFilters = ["all", "pending", "active", "inactive", "rejected"];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl md:text-2xl font-bold">Professionals</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => { setShowAddForm(!showAddForm); setShowInviteForm(false); }}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Professional
          </Button>
          <Button onClick={() => { setShowInviteForm(!showInviteForm); setShowAddForm(false); }}>
            <Send className="mr-2 h-4 w-4" />
            Invite Professional
          </Button>
        </div>
      </div>

      {/* Add professional directly form */}
      {showAddForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Create a new professional account — they'll be active immediately.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Full name *"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                type="email"
                placeholder="Email *"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              />
              <Input
                type="tel"
                placeholder="Phone *"
                value={addForm.phone}
                onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <Input
                type="password"
                placeholder="Temporary password *"
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
              />
              <Input
                placeholder="Bio (optional)"
                value={addForm.bio}
                onChange={(e) => setAddForm((f) => ({ ...f, bio: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Payment per session (optional)"
                value={addForm.payment_amount}
                onChange={(e) => setAddForm((f) => ({ ...f, payment_amount: e.target.value }))}
                min={0}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => addProfessionalMutation.mutate()}
                disabled={
                  !addForm.name || !addForm.email || !addForm.phone ||
                  !addForm.password || addProfessionalMutation.isPending
                }
              >
                {addProfessionalMutation.isPending ? <Spinner size="sm" className="mr-2" /> : null}
                Create Professional
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite via email form */}
      {showInviteForm && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Send an invite link — professional registers and you approve them.
            </p>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="professional@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail || inviteMutation.isPending}>
                {inviteMutation.isPending ? <Spinner size="sm" className="mr-2" /> : null}
                Send Invite
              </Button>
              <Button variant="outline" onClick={() => setShowInviteForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((f) => (
          <Button
            key={f}
            variant={statusFilter === f ? "default" : "outline"}
            size="sm"
            className="capitalize"
            onClick={() => setStatusFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Professionals list */}
      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {professionalProviders.map((pp: ProfessionalProvider) => (
            <ProfessionalCard
              key={pp.id}
              professionalProvider={pp}
              onApprove={() => approveMutation.mutate({ professionalId: pp.professional_id, status: "active" })}
              onReject={() => approveMutation.mutate({ professionalId: pp.professional_id, status: "rejected" })}
              onDeactivate={() => approveMutation.mutate({ professionalId: pp.professional_id, status: "inactive" })}
              isLoading={approveMutation.isPending}
            />
          ))}
          {professionalProviders.length === 0 && (
            <p className="col-span-full text-center py-8 text-muted-foreground">No professionals found</p>
          )}
        </div>
      )}
    </div>
  );
}

function ProfessionalCard({
  professionalProvider,
  onApprove,
  onReject,
  onDeactivate,
  isLoading,
}: {
  professionalProvider: ProfessionalProvider;
  onApprove: () => void;
  onReject: () => void;
  onDeactivate: () => void;
  isLoading: boolean;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 font-semibold text-pink-700">
            {String(professionalProvider.professional_id).slice(0, 2)}
          </div>
          <div>
            <p className="font-medium">Professional #{professionalProvider.professional_id}</p>
            {professionalProvider.payment_amount && (
              <p className="text-xs text-muted-foreground">${professionalProvider.payment_amount}/session</p>
            )}
          </div>
          <span
            className={cn(
              "ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
              statusColorMap[professionalProvider.status]
            )}
          >
            {statusLabel[professionalProvider.status]}
          </span>
        </div>

        <div className="flex gap-2">
          {professionalProvider.status === "pending" && (
            <>
              <Button size="sm" className="flex-1" onClick={onApprove} disabled={isLoading}>
                <UserCheck className="mr-1 h-3 w-3" />
                Approve
              </Button>
              <Button size="sm" variant="destructive" className="flex-1" onClick={onReject} disabled={isLoading}>
                <UserX className="mr-1 h-3 w-3" />
                Reject
              </Button>
            </>
          )}
          {professionalProvider.status === "active" && (
            <Button size="sm" variant="outline" className="w-full" onClick={onDeactivate} disabled={isLoading}>
              Deactivate
            </Button>
          )}
          {professionalProvider.status === "inactive" && (
            <Button size="sm" className="w-full" onClick={onApprove} disabled={isLoading}>
              Re-activate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
