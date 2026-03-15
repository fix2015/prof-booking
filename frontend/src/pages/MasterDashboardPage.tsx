import { DollarSign, Scissors, Calendar, Clock, Image } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SessionsList } from "@/components/dashboard/SessionsList";
import { Spinner } from "@/components/ui/spinner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTodaySessions, useSessions } from "@/hooks/useBooking";
import { useMyProfessionalProfile, useUpdateProfessionalProfile } from "@/hooks/useMaster";
import { professionalsApi } from "@/api/masters";
import { formatCurrency } from "@/utils/formatters";
import { format, subDays } from "date-fns";

export function MasterDashboardPage() {
  const qc = useQueryClient();
  const { data: professional } = useMyProfessionalProfile();
  const updateProfessional = useUpdateProfessionalProfile();
  const { data: todaySessions, isLoading } = useTodaySessions();
  const { data: monthlySessions } = useSessions({
    date_from: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    status: "completed",
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["professional-photos", "me"],
    queryFn: () => professional ? professionalsApi.getPhotos(professional.id) : [],
    enabled: !!professional,
  });

  const addPhotos = useMutation({
    mutationFn: (urls: string[]) =>
      Promise.all(urls.map((url, i) => professionalsApi.addPhoto({ image_url: url, order: photos.length + i }))),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional-photos", "me"] }),
  });

  const removePhoto = useMutation({
    mutationFn: (id: number) => professionalsApi.deletePhoto(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["professional-photos", "me"] }),
  });

  const totalMonthlyEarnings = monthlySessions?.reduce(
    (sum, s) => sum + (s.earnings_amount || 0),
    0
  ) ?? 0;

  const upcomingSessions = todaySessions?.filter(
    (s) => ["pending", "confirmed"].includes(s.status)
  ) ?? [];

  if (isLoading) return <Spinner className="mx-auto mt-20" />;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <ImageUpload
          currentUrl={professional?.avatar_url ?? undefined}
          onUpload={(url) => updateProfessional.mutate({ avatar_url: url || undefined })}
          shape="circle"
          size={64}
          label="Avatar"
        />
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate">
            Welcome back, {professional?.name || "Professional"}!
          </h1>
          <p className="text-sm text-muted-foreground">Here's your overview for today.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatsCard
          title="Today's Sessions"
          value={todaySessions?.length ?? 0}
          icon={Scissors}
          color="pink"
        />
        <StatsCard
          title="Upcoming"
          value={upcomingSessions.length}
          icon={Clock}
          color="blue"
        />
        <StatsCard
          title="This Month"
          value={monthlySessions?.length ?? 0}
          subtitle="completed sessions"
          icon={Calendar}
          color="purple"
        />
        <StatsCard
          title="Monthly Earnings"
          value={formatCurrency(totalMonthlyEarnings)}
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Portfolio photos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="h-4 w-4" />
            Portfolio Photos
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              {photos.length}/10
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MultiImageUpload
            photos={photos}
            onAdd={(urls) => addPhotos.mutate(urls)}
            onRemove={(id) => removePhoto.mutate(id)}
          />
        </CardContent>
      </Card>

      {/* Today's sessions */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <SessionsList
          sessions={todaySessions ?? []}
          title="Today's Sessions"
        />
        <SessionsList
          sessions={upcomingSessions}
          title="Upcoming Sessions"
        />
      </div>
    </div>
  );
}
