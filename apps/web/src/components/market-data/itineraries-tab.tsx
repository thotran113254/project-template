import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AiVisibilityToggle } from "@/components/market-data/ai-visibility-toggle";
import { Spinner } from "@/components/ui/spinner";
import { apiClient } from "@/lib/api-client";
import type { ItineraryTemplate, ItineraryTemplateItem } from "@app/shared";

interface ItinerariesTabProps {
  marketId: string;
  isAdmin: boolean;
}

type TemplateForm = {
  title: string;
  durationDays: string;
  durationNights: string;
  theme: string;
  description: string;
};

const EMPTY_TEMPLATE: TemplateForm = {
  title: "", durationDays: "1", durationNights: "0", theme: "", description: "",
};

function ItineraryItems({ templateId, isAdmin }: { templateId: string; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [itemForm, setItemForm] = useState({ dayNumber: "1", timeOfDay: "", activity: "", location: "", notes: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["itinerary-items", templateId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ItineraryTemplateItem[] }>(`/itineraries/${templateId}/items`);
      return (res.data.data ?? []).sort((a, b) => a.dayNumber - b.dayNumber || a.sortOrder - b.sortOrder);
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/itineraries/${templateId}/items`, {
        dayNumber: Number(itemForm.dayNumber),
        timeOfDay: itemForm.timeOfDay || null,
        activity: itemForm.activity,
        location: itemForm.location || null,
        notes: itemForm.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary-items", templateId] });
      setAddOpen(false);
      setItemForm({ dayNumber: "1", timeOfDay: "", activity: "", location: "", notes: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient.delete(`/itinerary-templates/${templateId}/items/${itemId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["itinerary-items", templateId] }),
  });

  const items = data ?? [];

  return (
    <div className="mt-3 ml-4 border-l-2 border-teal-100 pl-4 space-y-2">
      {isLoading ? (
        <Spinner size="sm" />
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">Chưa có mục nào</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm">
              <span className="shrink-0 rounded bg-teal-100 px-1.5 py-0.5 text-xs font-medium text-teal-700">
                Ngày {item.dayNumber}
              </span>
              {item.timeOfDay && <span className="shrink-0 text-[var(--muted-foreground)]">{item.timeOfDay}</span>}
              <span className="flex-1 text-[var(--foreground)]">{item.activity}</span>
              {item.location && <span className="text-[var(--muted-foreground)]">@ {item.location}</span>}
              {isAdmin && (
                <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-600 shrink-0"
                  onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <>
          <Button size="sm" variant="ghost" className="text-teal-600 hover:text-teal-700 px-0" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 h-3 w-3" /> Thêm mục
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Thêm mục lịch trình</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Ngày *</label>
                    <Input type="number" value={itemForm.dayNumber} onChange={(e) => setItemForm((f) => ({ ...f, dayNumber: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Buổi</label>
                    <Input placeholder="Sáng / Trưa / Chiều / Tối" value={itemForm.timeOfDay} onChange={(e) => setItemForm((f) => ({ ...f, timeOfDay: e.target.value }))} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Hoạt động *</label>
                  <Input value={itemForm.activity} onChange={(e) => setItemForm((f) => ({ ...f, activity: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Địa điểm</label>
                  <Input value={itemForm.location} onChange={(e) => setItemForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Ghi chú</label>
                  <Textarea rows={2} value={itemForm.notes} onChange={(e) => setItemForm((f) => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Hủy</Button>
                <Button className="bg-teal-600 hover:bg-teal-700" disabled={addMutation.isPending || !itemForm.activity}
                  onClick={() => addMutation.mutate()}>
                  {addMutation.isPending ? "Đang lưu..." : "Thêm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

/** Itineraries tab: expandable list of itinerary templates with timeline items. */
export function ItinerariesTab({ marketId, isAdmin }: ItinerariesTabProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ItineraryTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(EMPTY_TEMPLATE);

  const { data, isLoading } = useQuery({
    queryKey: ["itineraries", marketId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ItineraryTemplate[] }>(`/markets/${marketId}/itineraries`);
      return res.data.data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        durationDays: Number(form.durationDays),
        durationNights: Number(form.durationNights),
        theme: form.theme || null,
        description: form.description || null,
      };
      if (editItem) {
        await apiClient.patch(`/markets/${marketId}/itineraries/${editItem.id}`, payload);
      } else {
        await apiClient.post(`/markets/${marketId}/itineraries`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraries", marketId] });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/markets/${marketId}/itineraries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraries", marketId] });
      setDeleteId(null);
    },
  });

  const openAdd = () => { setEditItem(null); setForm(EMPTY_TEMPLATE); setDialogOpen(true); };
  const openEdit = (item: ItineraryTemplate) => {
    setEditItem(item);
    setForm({
      title: item.title,
      durationDays: String(item.durationDays),
      durationNights: String(item.durationNights),
      theme: item.theme ?? "",
      description: item.description ?? "",
    });
    setDialogOpen(true);
  };

  const items = data ?? [];

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Thêm lịch trình
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-[var(--muted-foreground)]">Chưa có lịch trình</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <div key={item.id} className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
                <div className="flex items-center gap-3 p-4">
                  <button className="shrink-0 text-[var(--muted-foreground)]" onClick={() => setExpandedId(expanded ? null : item.id)}>
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--foreground)] truncate">{item.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {item.durationDays} ngày {item.durationNights} đêm
                      {item.theme && ` · ${item.theme}`}
                    </p>
                  </div>
                  <Badge variant={item.status === "active" ? "success" : "secondary"}>{item.status}</Badge>
                  <AiVisibilityToggle
                    entityType="itinerary-template"
                    entityId={item.id}
                    enabled={item.aiVisible}
                    invalidateKeys={[["itineraries", marketId]]}
                  />
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {expanded && (
                  <div className="border-t border-[var(--border)] px-4 pb-4">
                    {item.description && <p className="mt-3 text-sm text-[var(--muted-foreground)]">{item.description}</p>}
                    <ItineraryItems templateId={item.id} isAdmin={isAdmin} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Chỉnh sửa lịch trình" : "Thêm lịch trình mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Tiêu đề *</label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Số ngày</label>
                <Input type="number" value={form.durationDays} onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Số đêm</label>
                <Input type="number" value={form.durationNights} onChange={(e) => setForm((f) => ({ ...f, durationNights: e.target.value }))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Chủ đề</label>
              <Input value={form.theme} onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" disabled={saveMutation.isPending || !form.title} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Xóa lịch trình"
        description="Bạn có chắc muốn xóa lịch trình này và tất cả các mục không?"
        confirmLabel="Xóa"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
