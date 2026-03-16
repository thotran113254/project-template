import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD, TableHeaderRow } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AiVisibilityToggle } from "@/components/market-data/ai-visibility-toggle";
import { PropertyDetailDialog } from "@/components/market-data/property-detail-dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/api-client";
import type { MarketProperty } from "@app/shared";

interface PropertiesTabProps {
  marketId: string;
  isAdmin: boolean;
}

type FormState = {
  name: string;
  type: string;
  starRating: string;
  address: string;
  description: string;
  status: string;
  invoiceStatus: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: "", type: "", starRating: "", address: "",
  description: "", status: "active", invoiceStatus: "none", notes: "",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "secondary"> = {
  active: "success", inactive: "danger", pending: "warning",
};

/** Properties tab: list of accommodations with CRUD and detail view. */
export function PropertiesTab({ marketId, isAdmin }: PropertiesTabProps) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [detailProp, setDetailProp] = useState<MarketProperty | null>(null);
  const [editItem, setEditItem] = useState<MarketProperty | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ["properties", marketId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: MarketProperty[] }>(`/markets/${marketId}/properties`);
      return res.data.data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        starRating: form.starRating || null,
        address: form.address || null,
        description: form.description || null,
        notes: form.notes || null,
      };
      if (editItem) {
        await apiClient.patch(`/markets/${marketId}/properties/${editItem.id}`, payload);
      } else {
        await apiClient.post(`/markets/${marketId}/properties`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties", marketId] });
      setFormOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/markets/${marketId}/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties", marketId] });
      setDeleteId(null);
    },
  });

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (item: MarketProperty) => {
    setEditItem(item);
    setForm({
      name: item.name, type: item.type, starRating: item.starRating ?? "",
      address: item.address ?? "", description: item.description ?? "",
      status: item.status, invoiceStatus: item.invoiceStatus, notes: item.notes ?? "",
    });
    setFormOpen(true);
  };

  const items = data ?? [];

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Thêm mới
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : (
        <Table>
          <THead>
            <TableHeaderRow>
              <TH>Tên cơ sở</TH>
              <TH>Loại</TH>
              <TH>Sao</TH>
              <TH>Trạng thái</TH>
              <TH>AI</TH>
              <TH className="w-32">Thao tác</TH>
            </TableHeaderRow>
          </THead>
          <TBody>
            {items.length === 0 ? (
              <TR><TD colSpan={6} className="py-8 text-center text-[var(--muted-foreground)]">Chưa có dữ liệu</TD></TR>
            ) : items.map((item) => (
              <TR key={item.id}>
                <TD>
                  <p className="font-medium text-[var(--foreground)]">{item.name}</p>
                  {item.address && <p className="text-xs text-[var(--muted-foreground)]">{item.address}</p>}
                </TD>
                <TD className="text-sm text-[var(--muted-foreground)]">{item.type}</TD>
                <TD className="text-sm text-[var(--muted-foreground)]">{item.starRating ?? "—"}</TD>
                <TD>
                  <Badge variant={STATUS_VARIANT[item.status] ?? "secondary"}>{item.status}</Badge>
                </TD>
                <TD>
                  <AiVisibilityToggle
                    entityType="property"
                    entityId={item.id}
                    enabled={item.aiVisible}
                    invalidateKeys={[["properties", marketId]]}
                  />
                </TD>
                <TD>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDetailProp(item)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      {/* Property detail dialog */}
      {detailProp && (
        <PropertyDetailDialog
          property={detailProp}
          open={!!detailProp}
          onOpenChange={(o) => !o && setDetailProp(null)}
        />
      )}

      {/* Add/Edit form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Chỉnh sửa cơ sở" : "Thêm cơ sở mới"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 grid-cols-2">
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium">Tên cơ sở *</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Loại *</label>
              <Input value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="hotel / resort / villa..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Xếp hạng sao</label>
              <Input value={form.starRating} onChange={(e) => setForm((f) => ({ ...f, starRating: e.target.value }))} placeholder="3 / 4 / 5" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Trạng thái</label>
              <Input value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} placeholder="active / inactive" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Trạng thái hóa đơn</label>
              <Input value={form.invoiceStatus} onChange={(e) => setForm((f) => ({ ...f, invoiceStatus: e.target.value }))} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium">Địa chỉ</label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium">Ghi chú</label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Hủy</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              disabled={saveMutation.isPending || !form.name || !form.type}
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
        title="Xóa cơ sở"
        description="Bạn có chắc muốn xóa cơ sở lưu trú này không?"
        confirmLabel="Xóa"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
