import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Percent, History } from "lucide-react";
import { professionalsApi } from "@/api/masters";
import { invoicesApi } from "@/api/invoices";
import { providersApi } from "@/api/salons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/useToast";

export function ProfessionalSplitPage() {
  const { professionalId } = useParams<{ professionalId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const providerIdParam = searchParams.get("provider_id");
  const profId = Number(professionalId);

  const { data: myProvider } = useQuery({
    queryKey: ["providers", "my"],
    queryFn: () => providersApi.getMy(),
    enabled: !providerIdParam,
  });
  const providerId = providerIdParam ? Number(providerIdParam) : myProvider?.id;

  const { data: professional } = useQuery({
    queryKey: ["professionals", profId],
    queryFn: () => professionalsApi.getById(profId),
    enabled: !!profId,
  });

  const { data: splits = [], isLoading: splitsLoading } = useQuery({
    queryKey: ["splits", providerId],
    queryFn: () => invoicesApi.listSplits(providerId!).then((r) => r.data),
    enabled: !!providerId,
  });

  // Current split for this professional
  const currentSplit = [...splits]
    .filter((s: any) => s.professional_id === profId)
    .sort((a: any, b: any) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())[0];

  const [percentage, setPercentage] = useState<string>("");
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));

  const createSplitMutation = useMutation({
    mutationFn: () =>
      invoicesApi.createSplit(providerId!, {
        professional_id: profId,
        professional_percentage: Number(percentage),
        effective_from: effectiveFrom,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["splits", providerId] });
      setPercentage("");
      toast({ title: "Split updated", variant: "success" });
    },
    onError: () => toast({ title: "Failed to update split", variant: "destructive" }),
  });

  // Also update payment_amount on the ProfessionalProvider record for real-time analytics
  const updatePaymentMutation = useMutation({
    mutationFn: (pct: number) =>
      professionalsApi.approveProfessional(providerId!, profId, "active", pct),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professionals"] }),
  });

  const handleSave = () => {
    const pct = Number(percentage);
    if (!pct || pct <= 0 || pct > 100) {
      toast({ title: "Enter a valid percentage (1–100)", variant: "destructive" });
      return;
    }
    createSplitMutation.mutate();
    updatePaymentMutation.mutate(pct);
  };

  const profName = professional?.name ?? `Professional #${profId}`;

  return (
    <div className="space-y-4 md:space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Percent className="h-5 w-5" /> Earnings Split
        </h1>
        <p className="text-sm text-muted-foreground">Set the professional's share of session revenue for {profName}</p>
      </div>

      {/* Current split */}
      {currentSplit && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Current split</p>
            <p className="ds-h1 text-[var(--ds-feedback-success)] mt-[4px]">{currentSplit.professional_percentage}%</p>
            <p className="text-xs text-muted-foreground mt-1">
              effective from {currentSplit.effective_from} · professional earns this % of session earnings
            </p>
          </CardContent>
        </Card>
      )}

      {/* New split form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Set New Split</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Professional percentage (%)</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="e.g. 70"
                min={1}
                max={100}
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
            {percentage && Number(percentage) > 0 && Number(percentage) <= 100 && (
              <p className="text-xs text-muted-foreground">
                Professional earns <span className="ds-body-strong text-[var(--ds-feedback-success)]">{percentage}%</span>,
                provider earns <span className="ds-body-strong text-[var(--ds-feedback-info)]">{100 - Number(percentage)}%</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Effective from</label>
            <Input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={!percentage || createSplitMutation.isPending || updatePaymentMutation.isPending}
            className="w-full"
          >
            {(createSplitMutation.isPending || updatePaymentMutation.isPending) && (
              <Spinner size="sm" className="mr-2" />
            )}
            Save Split
          </Button>
        </CardContent>
      </Card>

      {/* Split history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" /> Split History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {splitsLoading ? (
            <Spinner className="mx-auto" />
          ) : splits.filter((s: any) => s.professional_id === profId).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No split history yet</p>
          ) : (
            <div className="space-y-2">
              {[...splits]
                .filter((s: any) => s.professional_id === profId)
                .sort((a: any, b: any) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())
                .map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-b-0 last:pb-0">
                    <span className="text-muted-foreground">{s.effective_from}</span>
                    <span className="font-medium">{s.professional_percentage}% professional</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
