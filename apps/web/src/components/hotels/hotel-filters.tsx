import { useRef, useCallback, type ChangeEvent } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface HotelFilters {
  search?: string;
  location?: string;
  minStars?: number;
  maxPrice?: number;
}

interface HotelFiltersProps {
  filters: HotelFilters;
  onChange: (filters: HotelFilters) => void;
}

const LOCATION_OPTIONS = [
  { value: "", label: "All Locations" },
  { value: "Kyoto, Japan", label: "Kyoto, Japan" },
  { value: "Da Nang, Vietnam", label: "Da Nang, Vietnam" },
  { value: "Nha Trang, Vietnam", label: "Nha Trang, Vietnam" },
];

const STAR_OPTIONS = [
  { value: "", label: "Any Stars" },
  { value: "3", label: "3+ Stars" },
  { value: "4", label: "4+ Stars" },
  { value: "5", label: "5 Stars" },
];

const PRICE_OPTIONS = [
  { value: "", label: "Any Price" },
  { value: "200", label: "Under $200" },
  { value: "400", label: "$200 - $400" },
  { value: "9999", label: "$400+" },
];

const SELECT_CLASS =
  "h-10 rounded-full border border-[var(--input)] bg-[var(--background)] px-4 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 transition-colors hover:border-teal-400";

/** Hotel filter row: search, location, star rating, price range. */
export function HotelFiltersBar({ filters, onChange }: HotelFiltersProps) {
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

  const handleLocation = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => onChange({ ...filters, location: e.target.value || undefined }),
    [filters, onChange],
  );

  const handleStars = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) =>
      onChange({ ...filters, minStars: e.target.value ? Number(e.target.value) : undefined }),
    [filters, onChange],
  );

  const handlePrice = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) =>
      onChange({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined }),
    [filters, onChange],
  );

  const hasFilters = filters.search || filters.location || filters.minStars || filters.maxPrice;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
        <Input
          placeholder="Search hotels..."
          defaultValue={filters.search}
          onChange={handleSearchChange}
          className="rounded-full pl-9"
        />
      </div>

      <select value={filters.location ?? ""} onChange={handleLocation} className={SELECT_CLASS}>
        {LOCATION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select value={filters.minStars?.toString() ?? ""} onChange={handleStars} className={SELECT_CLASS}>
        {STAR_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <select value={filters.maxPrice?.toString() ?? ""} onChange={handlePrice} className={SELECT_CLASS}>
        {PRICE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange({})}
          className="rounded-full"
        >
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
