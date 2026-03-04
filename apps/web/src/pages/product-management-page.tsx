import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD, TableHeaderRow } from "@/components/ui/data-table";
import { PageSpinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/api-client";
import type { Hotel, HotelRoom, PaginatedResponse } from "@app/shared";

interface RoomRow {
  index: number;
  hotelName: string;
  location: string;
  roomType: string;
  roomCode: string;
  capacity: number;
  price2N3D: number;
  price3N2D: number;
  pricePerNight: number;
}

const fmtVnd = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

/** Compute combo prices from per-night rate (simplified display formula). */
function comboPrices(pricePerNight: number, capacity: number) {
  const base = pricePerNight * capacity;
  return {
    price2N3D: Math.round(base * 2 * 0.95),   // 2 nights 3 days, 5% off
    price3N2D: Math.round(base * 3 * 0.92),   // 3 nights 2 days, 8% off
  };
}

/** Price change badge: green for discount, red for markup indicator. */
function PriceChangeBadge({ pct }: { pct: number }) {
  const isNeg = pct < 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium ${
      isNeg ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
             : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
    }`}>
      {isNeg ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
      {isNeg ? "" : "+"}{pct}%
    </span>
  );
}

/** Read-only product & price management table for hotels and rooms. */
export default function ProductManagementPage() {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const { data: hotelsData, isLoading, refetch } = useQuery({
    queryKey: ["hotels-product-mgmt"],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<Hotel>>("/hotels?limit=100");
      return res.data.data ?? [];
    },
  });

  const hotels = hotelsData ?? [];

  const { data: allRooms } = useQuery({
    queryKey: ["all-rooms-product-mgmt", hotels.map((h) => h.id)],
    enabled: hotels.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        hotels.map((h) =>
          apiClient
            .get<{ data: HotelRoom[] }>(`/hotels/${h.id}/rooms`)
            .then((r) => r.data.data ?? [])
            .catch(() => [] as HotelRoom[]),
        ),
      );
      return results.flat();
    },
  });

  const rooms = allRooms ?? [];

  const locationOptions = [
    { value: "", label: "Tất cả địa điểm" },
    ...Array.from(new Set(hotels.map((h) => h.location))).map((l) => ({ value: l, label: l })),
  ];

  const rows: RoomRow[] = rooms
    .map((room, i) => {
      const hotel = hotels.find((h) => h.id === room.hotelId);
      if (!hotel) return null;
      const { price2N3D, price3N2D } = comboPrices(room.pricePerNight, room.capacity || 2);
      return {
        index: i + 1,
        hotelName: hotel.name,
        location: hotel.location,
        roomType: room.roomType,
        roomCode: room.id.slice(0, 8).toUpperCase(),
        capacity: room.capacity || 2,
        price2N3D,
        price3N2D,
        pricePerNight: room.pricePerNight,
      };
    })
    .filter(Boolean) as RoomRow[];

  const filtered = rows.filter((r) => {
    const matchSearch = !search || r.hotelName.toLowerCase().includes(search.toLowerCase()) || r.roomType.toLowerCase().includes(search.toLowerCase());
    const matchLocation = !locationFilter || r.location === locationFilter;
    return matchSearch && matchLocation;
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Quản lý Bảng giá &amp; Sản phẩm</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{filtered.length} loại phòng</p>
        </div>
        <Button
          variant="outline"
          className="text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400"
          onClick={() => refetch()}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Cập nhật AI
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            className="pl-9"
            placeholder="Tìm khách sạn, loại phòng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sm:w-56">
          <Select
            id="location-filter"
            options={locationOptions}
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <THead>
          <TableHeaderRow>
            <TH className="w-12">STT</TH>
            <TH>Khách sạn</TH>
            <TH>Loại phòng</TH>
            <TH className="hidden sm:table-cell">Mã phòng</TH>
            <TH className="hidden sm:table-cell text-right">Sức chứa</TH>
            <TH className="text-right">Combo 2N3D</TH>
            <TH className="text-right">Combo 3N2D</TH>
            <TH className="text-right hidden lg:table-cell">Giá phòng</TH>
          </TableHeaderRow>
        </THead>
        <TBody>
          {filtered.length === 0 ? (
            <TR><TD colSpan={8} className="py-8 text-center text-[var(--muted-foreground)]">Không tìm thấy dữ liệu.</TD></TR>
          ) : filtered.map((row) => (
            <TR key={`${row.hotelName}-${row.roomCode}`}>
              <TD className="text-[var(--muted-foreground)] text-center">{row.index}</TD>
              <TD>
                <p className="font-medium text-[var(--foreground)]">{row.hotelName}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{row.location}</p>
              </TD>
              <TD className="text-[var(--foreground)]">{row.roomType}</TD>
              <TD className="hidden sm:table-cell font-mono text-xs text-[var(--muted-foreground)]">{row.roomCode}</TD>
              <TD className="hidden sm:table-cell text-right text-[var(--muted-foreground)]">{row.capacity} người</TD>
              <TD className="text-right">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-medium text-[var(--foreground)]">{fmtVnd(row.price2N3D)}</span>
                  <PriceChangeBadge pct={-5} />
                </div>
              </TD>
              <TD className="text-right">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="font-medium text-[var(--foreground)]">{fmtVnd(row.price3N2D)}</span>
                  <PriceChangeBadge pct={-8} />
                </div>
              </TD>
              <TD className="hidden lg:table-cell text-right text-[var(--muted-foreground)]">
                {fmtVnd(row.pricePerNight)}/đêm
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
