import { usePublicSalons } from "@/hooks/useSalon";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone } from "lucide-react";

export function SalonSelectorPage() {
  const { data: salons, isLoading } = usePublicSalons();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-6">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💅</div>
          <h1 className="text-3xl font-bold text-pink-800">Find Your Salon</h1>
          <p className="text-pink-600 mt-2">Choose a salon to book your appointment</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-4">
            {salons?.map((salon) => (
              <a key={salon.id} href={`/book/${salon.id}`} className="block">
                <Card className="hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer">
                  <CardContent className="p-5">
                    <h2 className="text-xl font-semibold text-gray-900">{salon.name}</h2>
                    {salon.description && (
                      <p className="text-gray-600 text-sm mt-1">{salon.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      {salon.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-pink-500" />
                          {salon.address}
                        </span>
                      )}
                      {salon.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4 text-pink-500" />
                          {salon.phone}
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <span className="inline-flex items-center rounded-full bg-pink-50 px-4 py-1.5 text-sm font-medium text-pink-700 hover:bg-pink-100 transition-colors">
                        Book Now →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
            {salons?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No salons available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
