import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { PricingCalculator } from "@/components/pricing/pricing-calculator";
import { apiClient } from "@/lib/api-client";
import type { Hotel, HotelRoom, PriceCalculation, PaginatedResponse } from "@app/shared";

const fmtVnd = (n: number) => `${new Intl.NumberFormat("vi-VN").format(n)} VND`;

/** Sales staff pricing calculator with quote copy feature. */
export default function PricingSalePage() {
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [priceResult, setPriceResult] = useState<PriceCalculation | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: hotelsData, isLoading: hotelsLoading } = useQuery({
    queryKey: ["hotels-list-pricing"],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<Hotel>>("/hotels?limit=100");
      return res.data.data ?? [];
    },
  });

  const { data: roomsData } = useQuery({
    queryKey: ["hotel-rooms-pricing", selectedHotelId],
    enabled: !!selectedHotelId,
    queryFn: async () => {
      const res = await apiClient.get<{ data: HotelRoom[] }>(`/hotels/${selectedHotelId}/rooms`);
      return res.data.data ?? [];
    },
  });

  const hotels = hotelsData ?? [];
  const rooms = roomsData ?? [];

  const handleCopyQuote = async () => {
    if (!priceResult) return;
    const lines = [
      "=== BÁO GIÁ TOUR DU LỊCH ===",
      ...priceResult.breakdown.map((b) => `${b.label}: ${fmtVnd(b.amount)}`),
      `TỔNG CỘNG: ${fmtVnd(priceResult.totalPrice)}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  if (hotelsLoading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Công cụ tính giá (Sale)</h1>
        <p className="text-sm font-medium text-teal-600 dark:text-teal-400">AI TRAVEL ASSISTANT</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <PricingCalculator
            hotels={hotels}
            rooms={rooms}
            onHotelChange={setSelectedHotelId}
            onCalculate={setPriceResult}
          />
        </CardContent>
      </Card>

      {priceResult && (
        <div className="space-y-4">
          <div className="rounded-xl bg-teal-600 p-6 text-white">
            <p className="text-sm font-medium uppercase tracking-wide opacity-80">GIÁ BÁO KHÁCH</p>
            <p className="mt-1 text-4xl font-bold">{fmtVnd(priceResult.totalPrice)}</p>
            <p className="mt-2 text-sm opacity-80">
              {priceResult.nights} đêm &bull; {priceResult.guests} người lớn
            </p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <p className="text-sm font-semibold text-[var(--foreground)] mb-3">Chi tiết giá</p>
              {priceResult.breakdown.map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-[var(--muted-foreground)]">{item.label}</span>
                  <span className="font-medium text-[var(--foreground)]">{fmtVnd(item.amount)}</span>
                </div>
              ))}
              <div className="border-t border-[var(--border)] pt-2 flex justify-between text-sm font-semibold">
                <span className="text-[var(--foreground)]">Tổng cộng</span>
                <span className="text-teal-600">{fmtVnd(priceResult.totalPrice)}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleCopyQuote}
          >
            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Đã sao chép!" : "Sao chép báo giá cho Zalo"}
          </Button>
        </div>
      )}
    </div>
  );
}
