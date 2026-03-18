import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD, TableHeaderRow } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/api-client";
import type { TransportPricing } from "@app/shared";

interface TransportPricingEditorProps {
  providerId: string;
  isAdmin: boolean;
}

const fmtVnd = (n: number): string => new Intl.NumberFormat("vi-VN").format(n) + "₫";

const VEHICLE_CLASSES = ["cabin", "limousine", "sleeper", "speed_boat", "small_boat"];
const SEAT_TYPES = ["single", "double", "front", "middle", "back", "vip", "standard", "sleeper"];

type PricingForm = {
  vehicleClass: string;
  seatType: string;
  capacityPerUnit: string;
  onewayListedPrice: string;
  roundtripListedPrice: string;
  onewayDiscountPrice: string;
  roundtripDiscountPrice: string;
  childFreeUnder: string;
  childDiscountUnder: string;
  childDiscountAmount: string;
  onboardServices: string;
};

const EMPTY_FORM: PricingForm = {
  vehicleClass: "cabin",
  seatType: "standard",
  capacityPerUnit: "1",
  onewayListedPrice: "",
  roundtripListedPrice: "",
  onewayDiscountPrice: "",
  roundtripDiscountPrice: "",
  childFreeUnder: "5",
  childDiscountUnder: "10",
  childDiscountAmount: "",
  onboardServices: "",
};

const selectCls = "flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm";

/** Inline pricing editor for a transport provider with full CRUD. */
export function TransportPricingEditor({ providerId, isAdmin }: TransportPricingEditorProps) {
  const queryClient = useQueryClient();
  const qk = ["transport-pricing", providerId];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<TransportPricing | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<PricingForm>(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const res = await apiClient.get<{ data: TransportPricing[] }>(`/transport-providers/${providerId}/pricing`);
      return res.data.data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        vehicleClass: form.vehicleClass,
        seatType: form.seatType,
        capacityPerUnit: Number(form.capacityPerUnit) || 1,
        onewayListedPrice: Number(form.onewayListedPrice),
        roundtripListedPrice: form.roundtripListedPrice ? Number(form.roundtripListedPrice) : null,
        onewayDiscountPrice: form.onewayDiscountPrice ? Number(form.onewayDiscountPrice) : null,
        roundtripDiscountPrice: form.roundtripDiscountPrice ? Number(form.roundtripDiscountPrice) : null,
        childFreeUnder: form.childFreeUnder ? Number(form.childFreeUnder) : null,
        childDiscountUnder: form.childDiscountUnder ? Number(form.childDiscountUnder) : null,
        childDiscountAmount: form.childDiscountAmount ? Number(form.childDiscountAmount) : null,
        onboardServices: form.onboardServices || null,
      };
      if (editItem) {
        await apiClient.patch(`/transport-providers/${providerId}/pricing/${editItem.id}`, payload);
      } else {
        await apiClient.post(`/transport-providers/${providerId}/pricing`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/transport-providers/${providerId}/pricing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk });
      setDeleteId(null);
    },
  });

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: TransportPricing) => {
    setEditItem(item);
    setForm({
      vehicleClass: item.vehicleClass,
      seatType: item.seatType,
      capacityPerUnit: String(item.capacityPerUnit),
      onewayListedPrice: String(item.onewayListedPrice),
      roundtripListedPrice: item.roundtripListedPrice ? String(item.roundtripListedPrice) : "",
      onewayDiscountPrice: item.onewayDiscountPrice ? String(item.onewayDiscountPrice) : "",
      roundtripDiscountPrice: item.roundtripDiscountPrice ? String(item.roundtripDiscountPrice) : "",
      childFreeUnder: item.childFreeUnder ? String(item.childFreeUnder) : "",
      childDiscountUnder: item.childDiscountUnder ? String(item.childDiscountUnder) : "",
      childDiscountAmount: item.childDiscountAmount ? String(item.childDiscountAmount) : "",
      onboardServices: item.onboardServices ?? "",
    });
    setDialogOpen(true);
  };

  const sf = (key: keyof PricingForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [key]: e.target.value }));

  const items = data ?? [];
  const colSpan = isAdmin ? 8 : 6;

  return (
    <div className="ml-8 mt-2 mb-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Bảng giá vé</p>
        {isAdmin && (
          <Button size="sm" variant="ghost" className="text-xs text-teal-600 h-6 px-2" onClick={openAdd}>
            <Plus className="mr-0.5 h-3 w-3" /> Thêm giá
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Spinner size="sm" /></div>
      ) : (
        <Table>
          <THead>
            <TableHeaderRow>
              <TH>Hạng xe</TH>
              <TH>Loại ghế</TH>
              <TH>Sức chứa</TH>
              <TH>Giá 1 chiều</TH>
              <TH>Giá 2 chiều</TH>
              {isAdmin && <TH className="text-orange-600">CK 1 chiều</TH>}
              {isAdmin && <TH className="text-orange-600">CK 2 chiều</TH>}
              {isAdmin && <TH className="w-20">Thao tác</TH>}
            </TableHeaderRow>
          </THead>
          <TBody>
            {items.length === 0 ? (
              <TR><TD colSpan={colSpan} className="py-4 text-center text-xs text-[var(--muted-foreground)]">Chưa có bảng giá</TD></TR>
            ) : items.map((item) => (
              <TR key={item.id}>
                <TD className="text-sm font-medium">{item.vehicleClass}</TD>
                <TD className="text-sm text-[var(--muted-foreground)]">{item.seatType}</TD>
                <TD className="text-sm text-[var(--muted-foreground)]">{item.capacityPerUnit}</TD>
                <TD className="text-sm">{fmtVnd(item.onewayListedPrice)}</TD>
                <TD className="text-sm">{item.roundtripListedPrice ? fmtVnd(item.roundtripListedPrice) : "—"}</TD>
                {isAdmin && (
                  <TD className="text-sm text-orange-600">
                    {item.onewayDiscountPrice ? fmtVnd(item.onewayDiscountPrice) : "—"}
                  </TD>
                )}
                {isAdmin && (
                  <TD className="text-sm text-orange-600">
                    {item.roundtripDiscountPrice ? fmtVnd(item.roundtripDiscountPrice) : "—"}
                  </TD>
                )}
                {isAdmin && (
                  <TD>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TD>
                )}
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Chỉnh sửa giá vé" : "Thêm giá vé mới"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Hạng xe *</label>
              <select className={selectCls} value={form.vehicleClass} onChange={(e) => setForm((s) => ({ ...s, vehicleClass: e.target.value }))}>
                {VEHICLE_CLASSES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Loại ghế *</label>
              <select className={selectCls} value={form.seatType} onChange={(e) => setForm((s) => ({ ...s, seatType: e.target.value }))}>
                {SEAT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Sức chứa/đơn vị</label>
              <Input type="number" value={form.capacityPerUnit} onChange={sf("capacityPerUnit")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Giá 1 chiều (VND) *</label>
              <Input type="number" value={form.onewayListedPrice} onChange={sf("onewayListedPrice")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Giá 2 chiều (VND)</label>
              <Input type="number" value={form.roundtripListedPrice} onChange={sf("roundtripListedPrice")} />
            </div>
            {isAdmin && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-orange-600">CK 1 chiều (VND)</label>
                  <Input type="number" value={form.onewayDiscountPrice} onChange={sf("onewayDiscountPrice")} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-orange-600">CK 2 chiều (VND)</label>
                  <Input type="number" value={form.roundtripDiscountPrice} onChange={sf("roundtripDiscountPrice")} />
                </div>
              </>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Trẻ em miễn phí dưới (tuổi)</label>
              <Input type="number" value={form.childFreeUnder} onChange={sf("childFreeUnder")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Trẻ em giảm giá dưới (tuổi)</label>
              <Input type="number" value={form.childDiscountUnder} onChange={sf("childDiscountUnder")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Mức giảm giá trẻ em (%)</label>
              <Input type="number" value={form.childDiscountAmount} onChange={sf("childDiscountAmount")} />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-sm font-medium">Dịch vụ trên xe</label>
              <Input value={form.onboardServices} onChange={sf("onboardServices")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              disabled={saveMutation.isPending || !form.onewayListedPrice}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Xóa giá vé"
        description="Bạn có chắc muốn xóa mức giá này không?"
        confirmLabel="Xóa"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
