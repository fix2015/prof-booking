import { useQuery } from "@tanstack/react-query";
import { providersApi } from "@/api/salons";
import apiClient from "@/api/client";
import { User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Activity } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";

export function AdminPanelPage() {
  const { data: providers = [], isLoading: providersLoading } = useQuery({
    queryKey: ["admin", "providers"],
    queryFn: () => providersApi.listAll(),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => apiClient.get<User[]>("/users/").then((r) => r.data),
  });

  const isLoading = providersLoading || usersLoading;

  const ownerCount = users.filter((u) => u.role === "provider_owner").length;
  const professionalCount = users.filter((u) => u.role === "professional").length;

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Platform Administration</h1>

      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <StatsCard title="Total Providers" value={providers.length} icon={Building2} color="pink" />
            <StatsCard title="Total Users" value={users.length} icon={Users} color="blue" />
            <StatsCard title="Provider Owners" value={ownerCount} icon={Users} color="purple" />
            <StatsCard title="Professionals" value={professionalCount} icon={Activity} color="green" />
          </div>

          {/* Providers table */}
          <Card>
            <CardHeader>
              <CardTitle>All Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">ID</th>
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Address</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {providers.map((provider) => (
                      <tr key={provider.id}>
                        <td className="py-2 text-muted-foreground">#{provider.id}</td>
                        <td className="py-2 font-medium">{provider.name}</td>
                        <td className="py-2 text-muted-foreground">{provider.address || "—"}</td>
                        <td className="py-2">
                          <Badge variant={provider.is_active ? "success" : "secondary"}>
                            {provider.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Users table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">ID</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Role</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.slice(0, 50).map((user) => (
                      <tr key={user.id}>
                        <td className="py-2 text-muted-foreground">#{user.id}</td>
                        <td className="py-2">{user.email}</td>
                        <td className="py-2 capitalize">{user.role.replace("_", " ")}</td>
                        <td className="py-2">
                          <Badge variant={user.is_active ? "success" : "secondary"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
