import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import type { MarketKnowledgeUpdate } from "@app/shared";

const KNOWLEDGE_ASPECTS = [
  "Văn hóa", "Khí hậu", "Giao thông", "An ninh",
  "Dịch vụ", "Giá cả", "Mua sắm", "Ẩm thực",
  "Lưu trú", "Hoạt động", "Khác",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketId: string;
  editItem: MarketKnowledgeUpdate | null;
  isAdmin: boolean;
  onSuccess: () => void;
}

type FormState = { aspect: string; knowledge: string };
const EMPTY: FormState = { aspect: KNOWLEDGE_ASPECTS[0] ?? "Văn hóa", knowledge: "" };

/** Form dialog for creating/editing a knowledge update entry. */
export function KnowledgeUpdateFormDialog({ open, onOpenChange, marketId, editItem, isAdmin, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    if (editItem) {
      setForm({ aspect: editItem.aspect, knowledge: editItem.knowledge });
    } else {
      setForm(EMPTY);
    }
  }, [editItem, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editItem) {
        await apiClient.patch(`/markets/${marketId}/knowledge-updates/${editItem.id}`, form);
      } else {
        await apiClient.post(`/markets/${marketId}/knowledge-updates`, form);
      }
    },
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
    },
  });

  const isValid = form.aspect.trim() && form.knowledge.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editItem ? "Chỉnh sửa kiến thức" : "Thêm kiến thức mới"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Khía cạnh *</label>
            <select
              className="flex h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-sm"
              value={form.aspect}
              onChange={(e) => setForm((s) => ({ ...s, aspect: e.target.value }))}
            >
              {KNOWLEDGE_ASPECTS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Nội dung kiến thức *</label>
            <Textarea
              rows={5}
              placeholder="Nhập nội dung kiến thức về thị trường..."
              value={form.knowledge}
              onChange={(e) => setForm((s) => ({ ...s, knowledge: e.target.value }))}
            />
            {!isAdmin && (
              <p className="text-xs text-[var(--muted-foreground)]">
                Đóng góp của bạn sẽ được gửi để admin duyệt trước khi hiển thị.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            disabled={saveMutation.isPending || !isValid}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? "Đang lưu..." : editItem ? "Lưu" : "Gửi đóng góp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
