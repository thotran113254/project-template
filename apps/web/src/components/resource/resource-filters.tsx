import { useRef, useCallback, type ChangeEvent } from "react";
import { Search, X } from "lucide-react";
import { RESOURCE_STATUSES, RESOURCE_CATEGORIES } from "@app/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface ResourceFilterValues {
  search: string;
  status: string;
  category: string;
}

interface ResourceFiltersProps {
  filters: ResourceFilterValues;
  onChange: (filters: ResourceFilterValues) => void;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  ...RESOURCE_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  ...RESOURCE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
];

export function ResourceFilters({ filters, onChange }: ResourceFiltersProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange({ ...filters, search: value });
      }, 300);
    },
    [filters, onChange],
  );

  const handleSelectChange = useCallback(
    (field: "status" | "category") => (e: ChangeEvent<HTMLSelectElement>) => {
      onChange({ ...filters, [field]: e.target.value });
    },
    [filters, onChange],
  );

  const hasFilters = filters.search || filters.status || filters.category;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search resources..."
          defaultValue={filters.search}
          onChange={handleSearchChange}
          className="pl-9"
        />
      </div>

      <select
        value={filters.status}
        onChange={handleSelectChange("status")}
        className="h-10 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select
        value={filters.category}
        onChange={handleSelectChange("category")}
        className="h-10 rounded-md border border-[var(--input)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      >
        {CATEGORY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({ search: "", status: "", category: "" })}
        >
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
