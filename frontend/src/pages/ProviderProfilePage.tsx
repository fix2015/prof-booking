import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Clock, Users, Scissors, Star, ChevronDown } from "lucide-react";
import { providersApi } from "@/api/salons";
import { servicesApi } from "@/api/services";
import { professionalsApi } from "@/api/masters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/utils/formatters";

export function ProviderProfilePage() {
  const { providerId } = useParams<{ providerId: string }>();
  const id = Number(providerId);

  const { data: provider, isLoading } = useQuery({
    queryKey: ["providers", "public", id],
    queryFn: () => providersApi.getPublic(id),
    enabled: !!id,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", id],
    queryFn: () => servicesApi.listByProvider(id),
    enabled: !!id,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals", "provider", id, "public"],
    queryFn: () => professionalsApi.getProviderProfessionalsPublic(id),
    enabled: !!id,
  });

  const [servicesExpanded, setServicesExpanded] = useState(false);
  const SERVICES_INITIAL = 6; // 3 rows × 2 cols

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!provider) return <p className="text-center py-20 text-muted-foreground">Provider not found.</p>;

  return (
    <>
      <PublicHeader />
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-shrink-0">
          {provider.logo_url ? (
            <img
              src={provider.logo_url}
              alt={provider.name}
              className="h-24 w-24 rounded-2xl object-cover border shadow"
            />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-pink-600 to-pink-800 flex items-center justify-center text-4xl font-bold text-white shadow">
              {provider.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold">{provider.name}</h1>
          {provider.category && (
            <p className="text-sm text-pink-600 font-medium mt-0.5">{provider.category}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
            {provider.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {provider.address}
              </span>
            )}
            {provider.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4" /> {provider.phone}
              </span>
            )}
            {provider.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" /> {provider.email}
              </span>
            )}
          </div>
          {provider.description && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{provider.description}</p>
          )}
          <div className="mt-4 flex gap-2">
            <Link to={`/book/${provider.id}`}>
              <Button className="bg-gray-900 hover:bg-gray-950">Book Appointment</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-pink-50 p-2">
              <Scissors className="h-4 w-4 text-pink-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Services</p>
              <p className="text-xl font-bold">{services.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-purple-50 p-2">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Professionals</p>
              <p className="text-xl font-bold">{professionals.length}</p>
            </div>
          </CardContent>
        </Card>
        {provider.deposit_percentage > 0 && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-full bg-green-50 p-2">
                <Star className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deposit</p>
                <p className="text-xl font-bold">{provider.deposit_percentage}%</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Services */}
      {services.length > 0 && (() => {
        const active = services.filter((s) => s.is_active);
        const visible = servicesExpanded ? active : active.slice(0, SERVICES_INITIAL);
        return (
          <div>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Scissors className="h-5 w-5" /> Services
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visible.map((service) => (
                <Link key={service.id} to={`/book/${provider.id}?service_id=${service.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {service.duration_minutes} min
                        </div>
                      </div>
                      <p className="text-base font-bold text-gray-800 ml-3 flex-shrink-0">
                        {formatCurrency(service.price)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {active.length > SERVICES_INITIAL && (
              <button
                onClick={() => setServicesExpanded((v) => !v)}
                className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${servicesExpanded ? "rotate-180" : ""}`} />
                {servicesExpanded ? "Show less" : `Show all ${active.length} services`}
              </button>
            )}
          </div>
        );
      })()}

      {/* Professionals */}
      {professionals.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5" /> Our Professionals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {professionals.map((prof) => (
              <Link key={prof.id} to={`/professionals/${prof.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    {prof.avatar_url ? (
                      <img
                        src={prof.avatar_url}
                        alt={prof.name}
                        className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-lg font-bold text-purple-700 flex-shrink-0">
                        {prof.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{prof.name}</p>
                      {prof.experience_years != null && (
                        <p className="text-xs text-muted-foreground">{prof.experience_years} yrs exp</p>
                      )}
                      {prof.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{prof.bio}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
