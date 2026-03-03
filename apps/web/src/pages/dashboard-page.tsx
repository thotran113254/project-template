import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type { Resource, PaginatedResponse } from "@app/shared";

interface StatCard {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

function StatCardItem({ label, value, icon: Icon, colorClass }: StatCard) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className={`rounded-full p-3 ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
          <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Dashboard overview: summary stats and quick navigation. */
export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["resource-list-summary"],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<Resource>>(
        "/resources",
        { params: { limit: 100 } },
      );
      return res.data.data ?? [];
    },
  });

  const items = data ?? [];
  const stats: StatCard[] = [
    {
      label: "Total Resources",
      value: items.length,
      icon: Package,
      colorClass:
        "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    },
    {
      label: "Active",
      value: items.filter((s) => s.status === "active").length,
      icon: CheckCircle,
      colorClass:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    },
    {
      label: "Inactive",
      value: items.filter((s) => s.status === "inactive").length,
      icon: XCircle,
      colorClass:
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
    {
      label: "Error",
      value: items.filter((s) => s.status === "error").length,
      icon: AlertTriangle,
      colorClass:
        "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    },
  ];

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Welcome back, {user?.name}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Here's an overview of your resources.
        </p>
      </div>

      {isError && (
        <p className="text-sm text-red-600">
          Failed to load data. Please refresh.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCardItem key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resource Management</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-[var(--muted-foreground)]">
            Manage your resources, track status, and perform actions.
          </p>
          <Link
            to="/resources"
            className="ml-4 inline-flex shrink-0 items-center rounded-md border border-[var(--input)] bg-[var(--background)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          >
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
