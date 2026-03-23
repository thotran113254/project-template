import { Eye, Pencil, Star, Wifi, Waves, UtensilsCrossed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageThumbnail } from "@/components/market-data/image-manager";
import { AiVisibilityToggle } from "@/components/market-data/ai-visibility-toggle";
import type { MarketProperty } from "@app/shared";

const STATUS_VARIANT: Record<string, "success" | "danger" | "secondary"> = {
  active: "success", inactive: "danger",
};

const TYPE_LABELS: Record<string, string> = {
  homestay: "Homestay", hotel: "Khách sạn", villa: "Villa", resort: "Resort",
};

const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Wifi miễn phí": Wifi, "Hồ bơi": Waves, "Nhà hàng": UtensilsCrossed,
};

interface PropertyCardGridProps {
  properties: MarketProperty[];
  marketId: string;
  isAdmin: boolean;
  onView: (p: MarketProperty) => void;
  onEdit: (p: MarketProperty) => void;
}

/** Hotel-style card grid for properties. */
export function PropertyCardGrid({ properties, marketId, isAdmin, onView, onEdit }: PropertyCardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p) => {
        const images = (p.images as string[]) ?? [];
        const amenities = (p.amenities as string[]) ?? [];
        return (
          <Card key={p.id} className="overflow-hidden hover:shadow-md transition-shadow">
            {/* Cover image */}
            <div className="relative h-40 bg-[var(--muted)]">
              {images[0] ? (
                <img src={images[0]} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[var(--muted-foreground)] text-sm">
                  Chưa có ảnh
                </div>
              )}
              <div className="absolute top-2 left-2 flex gap-1">
                <Badge variant="secondary" className="bg-white/90 text-xs dark:bg-gray-900/90">
                  {TYPE_LABELS[p.type] ?? p.type}
                </Badge>
                <Badge variant={STATUS_VARIANT[p.status] ?? "secondary"}>{p.status}</Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--foreground)] truncate">{p.name}</p>
                  {p.address && <p className="text-xs text-[var(--muted-foreground)] truncate">{p.address}</p>}
                </div>
                {p.starRating && (
                  <div className="flex items-center gap-0.5 shrink-0 ml-2">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{p.starRating}</span>
                  </div>
                )}
              </div>
              {/* Amenity icons */}
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {amenities.slice(0, 5).map((a) => {
                    const Icon = AMENITY_ICONS[a];
                    return Icon ? (
                      <span key={a} title={a} className="rounded-full bg-[var(--muted)] p-1">
                        <Icon className="h-3 w-3 text-[var(--muted-foreground)]" />
                      </span>
                    ) : (
                      <span key={a} className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] text-[var(--muted-foreground)]">{a}</span>
                    );
                  })}
                  {amenities.length > 5 && (
                    <span className="text-[10px] text-[var(--muted-foreground)] self-center">+{amenities.length - 5}</span>
                  )}
                </div>
              )}
              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <AiVisibilityToggle entityType="property" entityId={p.id} enabled={p.aiVisible} invalidateKeys={[["properties", marketId]]} />
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onView(p)}><Eye className="h-3.5 w-3.5" /></Button>
                  {isAdmin && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
