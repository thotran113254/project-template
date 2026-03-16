import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AiVisibilityToggle } from "@/components/market-data/ai-visibility-toggle";
import { Spinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/api-client";
import type { MarketProperty, PropertyRoom, RoomPricing } from "@app/shared";

interface PropertyDetailDialogProps {
  property: MarketProperty;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function RoomRow({ room }: { room: PropertyRoom }) {
  const [expanded, setExpanded] = useState(false);

  const { data: pricings, isLoading } = useQuery({
    queryKey: ["room-pricing", room.id],
    enabled: expanded,
    queryFn: async () => {
      const res = await apiClient.get<{ data: RoomPricing[] }>(`/rooms/${room.id}/pricing`);
      return res.data.data ?? [];
    },
  });

  return (
    <div className="border border-[var(--border)] rounded-md">
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--muted)]/20"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" /> : <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />}
        <span className="flex-1 font-medium text-sm text-[var(--foreground)]">{room.roomType}</span>
        {room.bookingCode && <span className="text-xs text-[var(--muted-foreground)] font-mono">{room.bookingCode}</span>}
        <span className="text-xs text-[var(--muted-foreground)]">{room.capacity} người</span>
        <AiVisibilityToggle entityType="room" entityId={room.id} enabled={room.aiVisible} invalidateKeys={[["property-rooms", room.propertyId]]} />
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-3 pb-3 pt-2">
          {room.description && <p className="text-sm text-[var(--muted-foreground)] mb-3">{room.description}</p>}
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">Bảng giá</h4>
          {isLoading ? (
            <Spinner size="sm" />
          ) : !pricings || pricings.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">Chưa có bảng giá</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="pb-1.5 text-left font-medium text-[var(--muted-foreground)]">Mùa</th>
                    <th className="pb-1.5 text-left font-medium text-[var(--muted-foreground)]">Loại ngày</th>
                    <th className="pb-1.5 text-left font-medium text-[var(--muted-foreground)]">Combo</th>
                    <th className="pb-1.5 text-right font-medium text-[var(--muted-foreground)]">Giá</th>
                    <th className="pb-1.5 text-right font-medium text-[var(--muted-foreground)]">+1</th>
                    <th className="pb-1.5 text-right font-medium text-[var(--muted-foreground)]">-1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {pricings.map((p) => (
                    <tr key={p.id}>
                      <td className="py-1.5 text-[var(--foreground)]">{p.seasonName}</td>
                      <td className="py-1.5 text-[var(--muted-foreground)]">{p.dayType}</td>
                      <td className="py-1.5 text-[var(--muted-foreground)]">{p.comboType}</td>
                      <td className="py-1.5 text-right font-medium text-[var(--foreground)]">
                        {new Intl.NumberFormat("vi-VN").format(p.price)}
                      </td>
                      <td className="py-1.5 text-right text-[var(--muted-foreground)]">
                        {p.pricePlus1 ? new Intl.NumberFormat("vi-VN").format(p.pricePlus1) : "—"}
                      </td>
                      <td className="py-1.5 text-right text-[var(--muted-foreground)]">
                        {p.priceMinus1 ? new Intl.NumberFormat("vi-VN").format(p.priceMinus1) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Modal dialog showing property details, rooms, and pricing. */
export function PropertyDetailDialog({ property, open, onOpenChange }: PropertyDetailDialogProps) {
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["property-rooms", property.id],
    enabled: open,
    queryFn: async () => {
      const res = await apiClient.get<{ data: PropertyRoom[] }>(`/properties/${property.id}/rooms`);
      return (res.data.data ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
    },
  });

  const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "secondary"> = {
    active: "success", inactive: "danger", pending: "warning",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property.name}</DialogTitle>
        </DialogHeader>

        {/* Basic info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[var(--muted-foreground)]">Loại</p>
            <p className="font-medium text-[var(--foreground)]">{property.type}</p>
          </div>
          <div>
            <p className="text-[var(--muted-foreground)]">Xếp hạng sao</p>
            <p className="font-medium text-[var(--foreground)]">{property.starRating ?? "—"}</p>
          </div>
          <div>
            <p className="text-[var(--muted-foreground)]">Trạng thái</p>
            <Badge variant={STATUS_VARIANT[property.status] ?? "secondary"}>{property.status}</Badge>
          </div>
          <div>
            <p className="text-[var(--muted-foreground)]">Hóa đơn</p>
            <p className="font-medium text-[var(--foreground)]">{property.invoiceStatus}</p>
          </div>
          {property.address && (
            <div className="col-span-2">
              <p className="text-[var(--muted-foreground)]">Địa chỉ</p>
              <p className="font-medium text-[var(--foreground)]">{property.address}</p>
            </div>
          )}
          {property.description && (
            <div className="col-span-2">
              <p className="text-[var(--muted-foreground)]">Mô tả</p>
              <p className="text-[var(--foreground)]">{property.description}</p>
            </div>
          )}
        </div>

        {/* Rooms section */}
        <div className="mt-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Phòng & Bảng giá
          </h3>
          {isLoading ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : !rooms || rooms.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">Chưa có phòng nào</p>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => <RoomRow key={room.id} room={room} />)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
