import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { PricingOption } from "@app/shared";

export type RoomPricingFormState = {
  comboType: string; dayType: string; standardGuests: string;
  price: string; pricePlus1: string; priceMinus1: string; extraNight: string;
  discountPrice: string; discountPricePlus1: string; discountPriceMinus1: string;
  underStandardPrice: string; extraAdultSurcharge: string;
  extraChildSurcharge: string; includedAmenities: string;
};

export const EMPTY_ROOM_PRICING: RoomPricingFormState = {
  comboType: "", dayType: "", standardGuests: "2",
  price: "", pricePlus1: "", priceMinus1: "", extraNight: "",
  discountPrice: "", discountPricePlus1: "", discountPriceMinus1: "",
  underStandardPrice: "", extraAdultSurcharge: "",
  extraChildSurcharge: "", includedAmenities: "",
};

const selectCls = "flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm";

interface RoomPricingFormDialogProps {
  open: boolean;
  onClose: () => void;
  form: RoomPricingFormState;
  setForm: React.Dispatch<React.SetStateAction<RoomPricingFormState>>;
  isEditing: boolean;
  isAdmin: boolean;
  isSaving: boolean;
  onSave: () => void;
  saveError: string | null;
  comboOptions: PricingOption[];
  dayOptions: PricingOption[];
}

export function RoomPricingFormDialog({
  open, onClose, form, setForm, isEditing, isAdmin, isSaving, onSave, saveError, comboOptions, dayOptions,
}: RoomPricingFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEditing ? "Sửa giá" : "Thêm giá"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Combo *</label>
            <select className={selectCls} value={form.comboType} onChange={(e) => setForm((f) => ({ ...f, comboType: e.target.value }))}>
              {comboOptions.map((o) => <option key={o.optionKey} value={o.optionKey}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Loại ngày *</label>
            <select className={selectCls} value={form.dayType} onChange={(e) => setForm((f) => ({ ...f, dayType: e.target.value }))}>
              {dayOptions.map((o) => <option key={o.optionKey} value={o.optionKey}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium">Số người TC *</label><Input type="number" value={form.standardGuests} onChange={(e) => setForm((f) => ({ ...f, standardGuests: e.target.value }))} /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium">Giá niêm yết *</label><Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium">+1 người</label><Input type="number" value={form.pricePlus1} onChange={(e) => setForm((f) => ({ ...f, pricePlus1: e.target.value }))} /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium">-1 người</label><Input type="number" value={form.priceMinus1} onChange={(e) => setForm((f) => ({ ...f, priceMinus1: e.target.value }))} /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium">Thêm đêm</label><Input type="number" value={form.extraNight} onChange={(e) => setForm((f) => ({ ...f, extraNight: e.target.value }))} /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium">Dưới TC (giá)</label><Input type="number" value={form.underStandardPrice} onChange={(e) => setForm((f) => ({ ...f, underStandardPrice: e.target.value }))} /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium">Phụ thu NL thêm</label><Input type="number" value={form.extraAdultSurcharge} onChange={(e) => setForm((f) => ({ ...f, extraAdultSurcharge: e.target.value }))} /></div>
          <div className="flex flex-col gap-1"><label className="text-sm font-medium">Phụ thu trẻ em</label><Input type="number" value={form.extraChildSurcharge} onChange={(e) => setForm((f) => ({ ...f, extraChildSurcharge: e.target.value }))} /></div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium">Tiện ích bao gồm</label>
            <textarea
              className="flex min-h-[60px] w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              value={form.includedAmenities}
              onChange={(e) => setForm((f) => ({ ...f, includedAmenities: e.target.value }))}
              placeholder="VD: Bữa sáng, hồ bơi, đưa đón sân bay..."
            />
          </div>

          {isAdmin && (
            <div className="col-span-2 border-t pt-3 mt-1">
              <p className="text-xs font-semibold text-orange-600 mb-2">Giá chiết khấu (Admin)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1"><label className="text-sm font-medium text-orange-600">Giá CK</label><Input type="number" value={form.discountPrice} onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))} /></div>
                <div className="flex flex-col gap-1"><label className="text-sm font-medium text-orange-600">CK +1 người</label><Input type="number" value={form.discountPricePlus1} onChange={(e) => setForm((f) => ({ ...f, discountPricePlus1: e.target.value }))} /></div>
                <div className="flex flex-col gap-1"><label className="text-sm font-medium text-orange-600">CK -1 người</label><Input type="number" value={form.discountPriceMinus1} onChange={(e) => setForm((f) => ({ ...f, discountPriceMinus1: e.target.value }))} /></div>
              </div>
            </div>
          )}
        </div>
        {saveError && (
          <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button className="bg-teal-600 hover:bg-teal-700" disabled={isSaving || !form.price} onClick={onSave}>
            {isSaving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
