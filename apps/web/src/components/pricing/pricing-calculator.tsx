import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import type { Hotel, HotelRoom, PriceCalculation } from "@app/shared";

interface PricingCalculatorProps {
  hotels: Hotel[];
  rooms: HotelRoom[];
  onHotelChange: (hotelId: string) => void;
  onCalculate: (result: PriceCalculation) => void;
  isCalculating?: boolean;
}

/** Reusable pricing calculator form: hotel/room select, dates, guest counter. */
export function PricingCalculator({
  hotels,
  rooms,
  onHotelChange,
  onCalculate,
  isCalculating,
}: PricingCalculatorProps) {
  const [hotelId, setHotelId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [loading, setLoading] = useState(false);

  const hotelOptions = [
    { value: "", label: "-- Chọn khách sạn --" },
    ...hotels.map((h) => ({ value: h.id, label: `${h.name} (${h.location})` })),
  ];

  const roomOptions = [
    { value: "", label: "-- Chọn loại phòng --" },
    ...rooms.map((r) => ({
      value: r.id,
      label: `${r.roomType} - ${new Intl.NumberFormat("vi-VN").format(r.pricePerNight)} VND/đêm`,
    })),
  ];

  const handleHotelChange = (id: string) => {
    setHotelId(id);
    setRoomId("");
    onHotelChange(id);
  };

  const handleCalculate = async () => {
    if (!hotelId || !roomId || !checkIn || !checkOut) return;
    try {
      setLoading(true);
      const res = await apiClient.post<{ data: PriceCalculation }>("/pricing/calculate", {
        hotelId,
        roomId,
        checkIn,
        checkOut,
        guests,
      });
      onCalculate(res.data.data);
    } catch {
      // parent handles errors
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || isCalculating;

  return (
    <div className="space-y-4">
      <Select
        id="hotel-select"
        label="Khách sạn"
        options={hotelOptions}
        value={hotelId}
        onChange={(e) => handleHotelChange(e.target.value)}
      />
      <Select
        id="room-select"
        label="Loại phòng"
        options={roomOptions}
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        disabled={!hotelId}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Ngày nhận phòng</label>
          <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--foreground)]">Ngày trả phòng</label>
          <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[var(--foreground)]">Số khách</label>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGuests((g) => Math.max(1, g - 1))}
            type="button"
          >
            -
          </Button>
          <span className="w-8 text-center font-medium text-[var(--foreground)]">{guests}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGuests((g) => Math.min(20, g + 1))}
            type="button"
          >
            +
          </Button>
        </div>
      </div>
      <Button
        className="w-full"
        disabled={!hotelId || !roomId || !checkIn || !checkOut || busy}
        onClick={handleCalculate}
        type="button"
      >
        {busy ? "Đang tính..." : "Tính giá"}
      </Button>
    </div>
  );
}
