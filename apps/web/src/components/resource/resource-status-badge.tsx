import { Badge } from "@/components/ui/badge";
import type { ResourceStatus } from "@app/shared";

interface ResourceStatusBadgeProps {
  status: ResourceStatus;
}

const STATUS_CONFIG: Record<
  ResourceStatus,
  { label: string; variant: "success" | "secondary" | "warning" | "danger" }
> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "secondary" },
  pending: { label: "Pending", variant: "warning" },
  error: { label: "Error", variant: "danger" },
};

/** Colored badge showing resource operational status. */
export function ResourceStatusBadge({ status }: ResourceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "secondary" as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
